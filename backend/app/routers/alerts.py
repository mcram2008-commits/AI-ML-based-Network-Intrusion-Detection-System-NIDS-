from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert, User, SystemLog
from app.schemas import AlertOut, AlertStatusUpdate
from app.auth.deps import require_analyst_or_admin, require_any_user

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[str] = Query(None),
    attack_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
):
    query = db.query(Alert)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    if attack_type:
        query = query.filter(Alert.attack_type == attack_type)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Alert.alert_code.like(s)) |
            (Alert.source_ip.like(s)) |
            (Alert.destination_ip.like(s)) |
            (Alert.attack_type.like(s)) |
            (Alert.description.like(s))
        )
        
    return query.order_by(Alert.id.desc()).limit(limit).all()


@router.put("/{alert_id}", response_model=AlertOut)
def update_alert_status(
    alert_id: int,
    data: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if data.status not in ["New", "Investigating", "Resolved", "False Positive"]:
        raise HTTPException(status_code=400, detail="Invalid status value")
        
    old_status = alert.status
    alert.status = data.status
    db.commit()
    db.refresh(alert)
    
    log = SystemLog(user_id=current_user.id, action="ALERT_STATUS_UPDATE", details=f"Alert {alert.alert_code} changed from {old_status} to {data.status}")
    db.add(log)
    db.commit()
    
    return alert
