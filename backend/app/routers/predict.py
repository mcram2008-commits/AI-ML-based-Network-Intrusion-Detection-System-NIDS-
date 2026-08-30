import uuid
import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NetworkFlow, Prediction, Alert, User, MLModel
from app.schemas import ManualFlowPredictRequest, FlowPredictionOut
from app.auth.deps import require_analyst_or_admin, require_any_user
from app.ml.predictor import predict_flow
from app.ml.simulator import generate_random_flow

router = APIRouter(prefix="/predict", tags=["Prediction Engine"])

def _process_flow_prediction(flow_dict: Dict[str, Any], db: Session) -> Dict[str, Any]:
    active_model = db.query(MLModel).filter(MLModel.is_active == True).first()
    model_path = active_model.filepath if active_model else None
    model_id = active_model.id if active_model else None
    
    # Create NetworkFlow record
    flow_rec = NetworkFlow(
        timestamp=datetime.datetime.utcnow(),
        source_ip=flow_dict["source_ip"],
        destination_ip=flow_dict["destination_ip"],
        source_port=flow_dict["source_port"],
        destination_port=flow_dict["destination_port"],
        protocol=flow_dict["protocol"],
        packet_count=flow_dict["packet_count"],
        byte_count=flow_dict["byte_count"],
        duration=flow_dict["duration"],
        rate=flow_dict["rate"],
        is_simulated=flow_dict.get("is_simulated", True)
    )
    db.add(flow_rec)
    db.commit()
    db.refresh(flow_rec)
    
    # Run prediction
    res = predict_flow(flow_dict, model_filepath=model_path)
    
    pred_rec = Prediction(
        flow_id=flow_rec.id,
        model_id=model_id,
        prediction=res["prediction"],
        attack_category=res["attack_category"],
        confidence=res["confidence"],
        threat_severity=res["threat_severity"],
        recommended_action=res["recommended_action"],
        timestamp=datetime.datetime.utcnow()
    )
    db.add(pred_rec)
    db.commit()
    db.refresh(pred_rec)
    
    # Auto-generate Alert if threat level is MEDIUM, HIGH, or CRITICAL
    if res["threat_severity"] in ["MEDIUM", "HIGH", "CRITICAL"]:
        alert_code = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        alert_rec = Alert(
            alert_code=alert_code,
            flow_id=flow_rec.id,
            timestamp=datetime.datetime.utcnow(),
            source_ip=flow_rec.source_ip,
            destination_ip=flow_rec.destination_ip,
            source_port=flow_rec.source_port,
            destination_port=flow_rec.destination_port,
            protocol=flow_rec.protocol,
            attack_type=res["attack_category"],
            confidence=res["confidence"],
            severity=res["threat_severity"],
            status="New",
            description=f"Automated threat detection: {res['attack_category']} attack detected with {res['confidence']}% confidence. Recommended Action: {res['recommended_action']}"
        )
        db.add(alert_rec)
        db.commit()
        
    return {
        "id": pred_rec.id,
        "flow_id": flow_rec.id,
        "source_ip": flow_rec.source_ip,
        "destination_ip": flow_rec.destination_ip,
        "source_port": flow_rec.source_port,
        "destination_port": flow_rec.destination_port,
        "protocol": flow_rec.protocol,
        "packet_count": flow_rec.packet_count,
        "byte_count": flow_rec.byte_count,
        "duration": flow_rec.duration,
        "rate": flow_rec.rate,
        "prediction": res["prediction"],
        "attack_category": res["attack_category"],
        "confidence": res["confidence"],
        "threat_severity": res["threat_severity"],
        "recommended_action": res["recommended_action"],
        "timestamp": pred_rec.timestamp
    }


@router.post("", response_model=FlowPredictionOut)
def predict_single_flow(
    req: ManualFlowPredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
):
    flow_dict = req.dict()
    flow_dict["is_simulated"] = False
    return _process_flow_prediction(flow_dict, db)


@router.get("/generate-live-tick", response_model=FlowPredictionOut)
def generate_live_tick(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
):
    random_flow = generate_random_flow()
    return _process_flow_prediction(random_flow, db)


@router.get("/recent-flows", response_model=List[FlowPredictionOut])
def get_recent_flows(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
):
    preds = db.query(Prediction).order_by(Prediction.id.desc()).limit(limit).all()
    results = []
    for p in preds:
        f = p.flow
        if f:
            results.append({
                "id": p.id,
                "flow_id": f.id,
                "source_ip": f.source_ip,
                "destination_ip": f.destination_ip,
                "source_port": f.source_port,
                "destination_port": f.destination_port,
                "protocol": f.protocol,
                "packet_count": f.packet_count,
                "byte_count": f.byte_count,
                "duration": f.duration,
                "rate": f.rate,
                "prediction": p.prediction,
                "attack_category": p.attack_category,
                "confidence": p.confidence,
                "threat_severity": p.threat_severity,
                "recommended_action": p.recommended_action,
                "timestamp": p.timestamp
            })
    return results
