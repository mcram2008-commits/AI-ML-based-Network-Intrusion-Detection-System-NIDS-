from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import NetworkFlow, Prediction, Alert, User
from app.auth.deps import require_any_user

router = APIRouter(prefix="/ip", tags=["IP Investigation"])

@router.get("/{ip_address}")
def investigate_ip(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
) -> Dict[str, Any]:
    flows = db.query(NetworkFlow).filter(
        (NetworkFlow.source_ip == ip_address) | (NetworkFlow.destination_ip == ip_address)
    ).all()
    
    flow_ids = [f.id for f in flows]
    
    total_connections = len(flows)
    if total_connections == 0:
        # Generate clean default inspection response for any unrecorded IP query
        return {
            "ip_address": ip_address,
            "total_connections": 0,
            "attack_count": 0,
            "threat_score": 5.0,
            "threat_level": "LOW",
            "first_seen": "N/A",
            "last_seen": "N/A",
            "attack_types": [],
            "destination_ips": [],
            "ports_accessed": [],
            "protocols_used": [],
            "timeline": []
        }
        
    preds = db.query(Prediction).filter(Prediction.flow_id.in_(flow_ids)).all() if flow_ids else []
    
    attack_preds = [p for p in preds if p.prediction == "Malicious"]
    attack_count = len(attack_preds)
    
    attack_types = list(set([p.attack_category for p in attack_preds if p.attack_category not in ["BENIGN", "Normal"]]))
    
    dest_ips = list(set([f.destination_ip for f in flows if f.source_ip == ip_address]))
    ports_accessed = list(set([f.destination_port for f in flows]))
    protocols_used = list(set([f.protocol for f in flows]))
    
    timestamps = [f.timestamp for f in flows if f.timestamp]
    first_seen = min(timestamps).isoformat() if timestamps else "N/A"
    last_seen = max(timestamps).isoformat() if timestamps else "N/A"
    
    # Calculate Threat Score (0 - 100)
    threat_score = min(100.0, round((attack_count / max(1, total_connections)) * 100.0 + min(50, attack_count * 10), 1))
    
    if threat_score > 75.0:
        threat_level = "CRITICAL"
    elif threat_score > 50.0:
        threat_level = "HIGH"
    elif threat_score > 20.0:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"
        
    timeline = []
    for f in sorted(flows, key=lambda x: x.timestamp or datetime.datetime.utcnow(), reverse=True)[:20]:
        pred_match = next((p for p in preds if p.flow_id == f.id), None)
        timeline.append({
            "timestamp": f.timestamp.isoformat() if f.timestamp else "",
            "source_ip": f.source_ip,
            "destination_ip": f.destination_ip,
            "destination_port": f.destination_port,
            "protocol": f.protocol,
            "prediction": pred_match.prediction if pred_match else "Normal",
            "attack_category": pred_match.attack_category if pred_match else "BENIGN",
            "threat_severity": pred_match.threat_severity if pred_match else "LOW"
        })
        
    return {
        "ip_address": ip_address,
        "total_connections": total_connections,
        "attack_count": attack_count,
        "threat_score": threat_score,
        "threat_level": threat_level,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "attack_types": attack_types if attack_types else ["None"],
        "destination_ips": dest_ips[:10],
        "ports_accessed": ports_accessed[:10],
        "protocols_used": protocols_used,
        "timeline": timeline
    }
