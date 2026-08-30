from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SystemSetting, MLModel, User, SystemLog
from app.schemas import SystemSettingsUpdate
from app.auth.deps import require_admin, require_any_user

router = APIRouter(prefix="/settings", tags=["System Settings"])

DEFAULT_SETTINGS = {
    "detection_threshold": "0.5",
    "alert_threshold": "MEDIUM",
    "refresh_interval_sec": "3",
    "demo_mode": "true",
    "email_notifications": "true"
}

@router.get("")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(require_any_user)):
    db_settings = db.query(SystemSetting).all()
    setting_dict = {s.key: s.value for s in db_settings}
    
    # Fill defaults
    for k, v in DEFAULT_SETTINGS.items():
        if k not in setting_dict:
            setting_dict[k] = v
            
    active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
    setting_dict["active_model_id"] = str(active_model.id) if active_model else "1"
    setting_dict["active_model_name"] = active_model.name if active_model else "Random Forest (Default)"
    
    return setting_dict

@router.put("")
def update_settings(
    data: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    updates = {
        "detection_threshold": str(data.detection_threshold),
        "alert_threshold": str(data.alert_threshold),
        "refresh_interval_sec": str(data.refresh_interval_sec),
        "demo_mode": "true" if data.demo_mode else "false"
    }
    
    if data.active_model_id:
        model = db.query(MLModel).filter(MLModel.id == data.active_model_id).first()
        if model:
            db.query(MLModel).update({MLModel.is_active: False})
            model.is_active = True
            
    for k, v in updates.items():
        rec = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if rec:
            rec.value = v
        else:
            db.add(SystemSetting(key=k, value=v))
            
    db.commit()
    
    log = SystemLog(user_id=current_user.id, action="UPDATE_SETTINGS", details="Updated system detection & alert settings")
    db.add(log)
    db.commit()
    
    return {"message": "System settings updated successfully"}
