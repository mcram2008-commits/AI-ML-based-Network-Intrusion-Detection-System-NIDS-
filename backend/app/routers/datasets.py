import os
import shutil
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Dataset, User, SystemLog
from app.schemas import DatasetOut
from app.auth.deps import require_analyst_or_admin, require_any_user
from app.ml.feature_extractor import preprocess_df

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetOut])
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(require_any_user)):
    return db.query(Dataset).order_by(Dataset.id.desc()).all()

@router.post("/upload", response_model=DatasetOut, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    if not file.filename.endswith((".csv", ".txt", ".pcap")):
        raise HTTPException(status_code=400, detail="Only CSV or network flow text files are supported")
        
    save_path = os.path.join(settings.UPLOADS_DIR, f"ds_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        df = pd.read_csv(save_path, nrows=50000)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV dataset: {str(e)}")
        
    X, y, feature_cols = preprocess_df(df)
    
    total_records = len(df)
    num_features = len(feature_cols)
    missing_vals = int(df.isna().sum().sum())
    
    class_counts = y.value_counts().to_dict()
    
    normal_cnt = 0
    attack_cnt = 0
    for cat_name, cnt in class_counts.items():
        if str(cat_name).upper() in ["BENIGN", "NORMAL"]:
            normal_cnt += cnt
        else:
            attack_cnt += cnt
            
    norm_pct = round((normal_cnt / max(1, total_records)) * 100.0, 1)
    att_pct = round((attack_cnt / max(1, total_records)) * 100.0, 1)
    
    dataset_rec = Dataset(
        filename=os.path.basename(save_path),
        original_filename=file.filename,
        num_records=total_records,
        num_features=num_features,
        missing_values=missing_vals,
        normal_count=normal_cnt,
        attack_count=attack_cnt,
        normal_percentage=norm_pct,
        attack_percentage=att_pct,
        class_distribution=class_counts,
        filepath=save_path,
        is_preprocessed=True
    )
    
    db.add(dataset_rec)
    db.commit()
    db.refresh(dataset_rec)
    
    log = SystemLog(user_id=current_user.id, action="DATASET_UPLOAD", details=f"Uploaded dataset {file.filename} ({total_records} rows)")
    db.add(log)
    db.commit()
    
    return dataset_rec


@router.post("/{dataset_id}/preprocess")
def preprocess_dataset_endpoint(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = pd.read_csv(dataset.filepath)
    X, y, feature_cols = preprocess_df(df)
    
    dataset.is_preprocessed = True
    dataset.missing_values = 0
    db.commit()
    
    return {
        "message": "Dataset preprocessed successfully",
        "dataset_id": dataset.id,
        "clean_records": len(X),
        "features": feature_cols
    }
