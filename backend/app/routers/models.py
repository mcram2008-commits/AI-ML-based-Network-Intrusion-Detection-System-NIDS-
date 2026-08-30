import os
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MLModel, Dataset, User, SystemLog
from app.schemas import MLModelOut, ModelTrainRequest
from app.auth.deps import require_analyst_or_admin, require_any_user
from app.ml.trainer import train_and_eval_model, generate_synthetic_dataset
from app.ml.predictor import set_active_model_bundle, load_active_model

router = APIRouter(prefix="/models", tags=["ML Models"])

@router.get("", response_model=List[MLModelOut])
def list_models(db: Session = Depends(get_db), current_user: User = Depends(require_any_user)):
    return db.query(MLModel).order_by(MLModel.id.desc()).all()

@router.post("/train", response_model=MLModelOut, status_code=status.HTTP_201_CREATED)
def train_model_endpoint(
    req: ModelTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    dataset_name = "CICIDS2017 Sample Dataset"
    if req.dataset_id > 0:
        dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
        if not dataset or not os.path.exists(dataset.filepath):
            raise HTTPException(status_code=404, detail="Selected dataset file not found")
        df = pd.read_csv(dataset.filepath)
        dataset_name = dataset.original_filename
    else:
        df = generate_synthetic_dataset(num_samples=2500)
        
    model_name = req.model_name or f"{req.algorithm} ({dataset_name})"
    
    try:
        model_bundle, metrics = train_and_eval_model(
            df=df,
            algorithm_name=req.algorithm,
            test_size=req.test_size
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model training failed: {str(e)}")
        
    # Deactivate other active models if any
    db.query(MLModel).update({MLModel.is_active: False})
    
    new_model = MLModel(
        name=model_name,
        algorithm=req.algorithm,
        dataset_name=dataset_name,
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        roc_auc=metrics["roc_auc"],
        confusion_matrix_json=metrics["confusion_matrix"],
        per_class_metrics_json=metrics["per_class_metrics"],
        hyperparams_json=req.hyperparams or {"test_size": req.test_size},
        filepath=metrics["save_path"],
        is_active=True
    )
    
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    
    set_active_model_bundle(model_bundle)
    
    log = SystemLog(user_id=current_user.id, action="MODEL_TRAIN", details=f"Trained model {new_model.name} with accuracy {new_model.accuracy}%")
    db.add(log)
    db.commit()
    
    return new_model


@router.post("/{model_id}/select-active")
def select_active_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    db.query(MLModel).update({MLModel.is_active: False})
    model.is_active = True
    db.commit()
    
    load_active_model(model.filepath)
    
    return {"message": f"Active model set to {model.name}", "active_model_id": model.id}
