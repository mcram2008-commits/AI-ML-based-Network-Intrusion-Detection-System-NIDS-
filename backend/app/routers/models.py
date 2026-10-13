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
        
        dataset_name = dataset.original_filename
        try:
            # Read with encoding resilience (CICIDS2017 files often have cp1252 symbols)
            try:
                df = pd.read_csv(dataset.filepath, encoding="utf-8", low_memory=False)
            except (UnicodeDecodeError, Exception):
                df = pd.read_csv(dataset.filepath, encoding="cp1252", low_memory=False)
        except Exception as read_err:
            raise HTTPException(status_code=400, detail=f"Failed to read dataset CSV: {str(read_err)}")
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


@router.delete("/{model_id}")
def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    from app.models import Prediction
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    total_models = db.query(MLModel).count()
    if total_models <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only remaining model. At least one model is required.")

    was_active = model.is_active
    file_path = model.filepath
    model_name = model.name

    # Disassociate predictions
    db.query(Prediction).filter(Prediction.model_id == model_id).update({Prediction.model_id: None})

    db.delete(model)
    db.commit()

    # If the deleted model was active, set the most recent remaining model to active
    if was_active:
        remaining_model = db.query(MLModel).order_by(MLModel.id.desc()).first()
        if remaining_model:
            remaining_model.is_active = True
            db.commit()
            load_active_model(remaining_model.filepath)

    # Safely remove file if custom
    try:
        if file_path and os.path.exists(file_path) and "default" not in file_path:
            os.remove(file_path)
    except Exception:
        pass

    log = SystemLog(user_id=current_user.id, action="MODEL_DELETE", details=f"Deleted model ID {model_id} ({model_name})")
    db.add(log)
    db.commit()

    return {"message": f"Model '{model_name}' successfully removed", "deleted_id": model_id}


@router.post("/reset-clean-base-models")
def reset_clean_base_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    from app.models import Prediction
    from app.ml.adversarial import harden_model_with_adversarial_augmentation

    # Disassociate predictions
    db.query(Prediction).update({Prediction.model_id: None})
    
    # Delete existing models
    db.query(MLModel).delete()
    db.commit()

    # High-quality base training dataset (3000 synthetic network flow samples mimicking CICIDS2017)
    df = generate_synthetic_dataset(num_samples=3000)

    # 1. Base Random Forest
    rf_bundle, rf_metrics = train_and_eval_model(
        df=df,
        algorithm_name="Random Forest",
        test_size=0.2,
        model_save_filename="base_random_forest.joblib"
    )
    rf_model = MLModel(
        name="Random Forest Classifier (Base Production Baseline)",
        algorithm="Random Forest",
        dataset_name="CICIDS2017 Benchmark Flow Sample",
        accuracy=rf_metrics["accuracy"],
        precision=rf_metrics["precision"],
        recall=rf_metrics["recall"],
        f1_score=rf_metrics["f1_score"],
        roc_auc=rf_metrics["roc_auc"],
        confusion_matrix_json=rf_metrics["confusion_matrix"],
        per_class_metrics_json=rf_metrics["per_class_metrics"],
        hyperparams_json={"n_estimators": 100, "max_depth": 12},
        filepath=rf_metrics["save_path"],
        is_active=True
    )
    db.add(rf_model)

    # 2. Base Gradient Boosting
    gb_bundle, gb_metrics = train_and_eval_model(
        df=df,
        algorithm_name="Gradient Boosting",
        test_size=0.2,
        model_save_filename="base_gradient_boosting.joblib"
    )
    gb_model = MLModel(
        name="Gradient Boosting Classifier (Ensemble Baseline)",
        algorithm="Gradient Boosting",
        dataset_name="CICIDS2017 Benchmark Flow Sample",
        accuracy=gb_metrics["accuracy"],
        precision=gb_metrics["precision"],
        recall=gb_metrics["recall"],
        f1_score=gb_metrics["f1_score"],
        roc_auc=gb_metrics["roc_auc"],
        confusion_matrix_json=gb_metrics["confusion_matrix"],
        per_class_metrics_json=gb_metrics["per_class_metrics"],
        hyperparams_json={"n_estimators": 100, "learning_rate": 0.1},
        filepath=gb_metrics["save_path"],
        is_active=False
    )
    db.add(gb_model)

    # 3. Base MLP Neural Network
    mlp_bundle, mlp_metrics = train_and_eval_model(
        df=df,
        algorithm_name="MLP Neural Network",
        test_size=0.2,
        model_save_filename="base_mlp_neural_network.joblib"
    )
    mlp_model = MLModel(
        name="MLP Deep Neural Network (Multi-Layer Perceptron)",
        algorithm="MLP Neural Network",
        dataset_name="CICIDS2017 Benchmark Flow Sample",
        accuracy=mlp_metrics["accuracy"],
        precision=mlp_metrics["precision"],
        recall=mlp_metrics["recall"],
        f1_score=mlp_metrics["f1_score"],
        roc_auc=mlp_metrics["roc_auc"],
        confusion_matrix_json=mlp_metrics["confusion_matrix"],
        per_class_metrics_json=mlp_metrics["per_class_metrics"],
        hyperparams_json={"hidden_layers": [64, 32], "max_iter": 300},
        filepath=mlp_metrics["save_path"],
        is_active=False
    )
    db.add(mlp_model)

    # 4. Hardened Random Forest
    hard_bundle, hard_metrics = harden_model_with_adversarial_augmentation(df=df, algorithm_name="Random Forest")
    hard_model = MLModel(
        name="Hardened Random Forest (Adversarial Robustness FGSM)",
        algorithm="Random Forest",
        dataset_name="CICIDS2017 + Adversarial FGSM Augmentation",
        accuracy=hard_metrics["accuracy"],
        precision=hard_metrics["precision"],
        recall=hard_metrics["recall"],
        f1_score=hard_metrics["f1_score"],
        roc_auc=hard_metrics["roc_auc"],
        confusion_matrix_json=hard_metrics["confusion_matrix"],
        per_class_metrics_json=hard_metrics["per_class_metrics"],
        hyperparams_json={"adversarial_hardened": True, "augmented": True},
        filepath=hard_metrics["save_path"],
        is_active=False
    )
    db.add(hard_model)

    db.commit()
    db.refresh(rf_model)

    set_active_model_bundle(rf_bundle)

    log = SystemLog(user_id=current_user.id, action="MODELS_RESET_BASE", details="Reset and initialized 4 clean Base Benchmark Models")
    db.add(log)
    db.commit()

    return {
        "message": "Clean Base Models suite initialized successfully! 4 baseline models ready.",
        "active_model_id": rf_model.id,
        "models_count": 4
    }

