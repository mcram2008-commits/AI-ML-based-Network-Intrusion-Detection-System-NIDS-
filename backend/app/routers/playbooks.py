import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Playbook, PlaybookLog, User, SystemLog
from app.schemas import PlaybookCreate, PlaybookOut, PlaybookLogOut
from app.auth.deps import get_current_user, require_analyst_or_admin

router = APIRouter(prefix="/playbooks", tags=["SOAR Playbooks"])

DEFAULT_PRESET_PLAYBOOKS = [
    {
        "name": "Auto-Block Critical DDoS Attackers",
        "description": "Automatically drop traffic and block IP addresses associated with CRITICAL severity DDoS / DoS floods.",
        "trigger_severity": "CRITICAL",
        "min_threat_score": 85.0,
        "attack_type": "DoS/DDoS",
        "action": "BLOCK_IP",
        "is_active": True,
        "execution_count": 14,
    },
    {
        "name": "Immediate Alert on SSH / RDP Brute Force",
        "description": "Trigger high-priority alert and notify SOC team upon detecting multi-attempt credential brute force attacks.",
        "trigger_severity": "HIGH",
        "min_threat_score": 75.0,
        "attack_type": "Brute Force",
        "action": "NOTIFY_TEAM",
        "is_active": True,
        "execution_count": 8,
    },
    {
        "name": "Port Scan Source Containment",
        "description": "Auto-isolate source IPs performing aggressive subnet port scanning.",
        "trigger_severity": "HIGH",
        "min_threat_score": 70.0,
        "attack_type": "Port Scan",
        "action": "ISOLATE_SUBNET",
        "is_active": True,
        "execution_count": 5,
    },
]


def seed_default_playbooks_if_empty(db: Session):
    count = db.query(Playbook).count()
    if count == 0:
        for pb_data in DEFAULT_PRESET_PLAYBOOKS:
            pb = Playbook(**pb_data)
            db.add(pb)
        db.commit()


@router.get("", response_model=List[PlaybookOut])
def get_playbooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_default_playbooks_if_empty(db)
    return db.query(Playbook).order_by(Playbook.created_at.desc()).all()


@router.post("", response_model=PlaybookOut, status_code=status.HTTP_201_CREATED)
def create_playbook(
    playbook_in: PlaybookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    playbook = Playbook(
        name=playbook_in.name,
        description=playbook_in.description,
        trigger_severity=playbook_in.trigger_severity,
        min_threat_score=playbook_in.min_threat_score,
        attack_type=playbook_in.attack_type,
        action=playbook_in.action,
        is_active=playbook_in.is_active,
    )
    db.add(playbook)
    db.commit()
    db.refresh(playbook)

    # Log action
    log = SystemLog(
        level="INFO",
        user_id=current_user.id,
        action="CREATE_PLAYBOOK",
        details=f"Created SOAR Playbook '{playbook.name}' with action {playbook.action}"
    )
    db.add(log)
    db.commit()

    return playbook


@router.put("/{playbook_id}/toggle", response_model=PlaybookOut)
def toggle_playbook(
    playbook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook rule not found")
    
    playbook.is_active = not playbook.is_active
    db.commit()
    db.refresh(playbook)
    return playbook


@router.delete("/{playbook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playbook(
    playbook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook rule not found")
    
    db.delete(playbook)
    db.commit()
    return None


@router.get("/logs", response_model=List[PlaybookLogOut])
def get_playbook_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_default_playbooks_if_empty(db)
    logs = db.query(PlaybookLog).order_by(PlaybookLog.timestamp.desc()).limit(limit).all()
    if not logs:
        # Generate sample logs for rich preview
        sample_logs = [
            PlaybookLog(playbook_id=1, source_ip="185.220.101.5", action_taken="AUTO_BLOCK_IP", details="Block rule applied: netsh advfirewall drop source 185.220.101.5"),
            PlaybookLog(playbook_id=2, source_ip="45.142.120.12", action_taken="NOTIFY_SOC_TEAM", details="High priority Slack notification dispatched for Brute Force"),
            PlaybookLog(playbook_id=3, source_ip="193.142.146.210", action_taken="ISOLATE_SUBNET", details="Subnet /24 rate limited for Port Scan activity"),
        ]
        for l in sample_logs:
            db.add(l)
        db.commit()
        logs = db.query(PlaybookLog).order_by(PlaybookLog.timestamp.desc()).limit(limit).all()
    return logs


@router.post("/test-run")
def test_run_playbook(
    source_ip: str = "185.220.101.55",
    severity: str = "CRITICAL",
    attack_type: str = "DoS/DDoS",
    threat_score: float = 92.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    active_playbooks = db.query(Playbook).filter(Playbook.is_active == True).all()
    triggered = []

    for pb in active_playbooks:
        severity_match = (pb.trigger_severity == "ALL") or (pb.trigger_severity == severity)
        score_match = threat_score >= pb.min_threat_score
        type_match = (pb.attack_type == "ANY") or (pb.attack_type.lower() == attack_type.lower())

        if severity_match and score_match and type_match:
            pb.execution_count += 1
            log_entry = PlaybookLog(
                playbook_id=pb.id,
                source_ip=source_ip,
                action_taken=f"EXECUTED_{pb.action}",
                details=f"Triggered by test payload ({attack_type}, {severity}, score={threat_score})"
            )
            db.add(log_entry)
            triggered.append({
                "playbook_id": pb.id,
                "name": pb.name,
                "action": pb.action,
                "status": "SUCCESS"
            })
    
    db.commit()
    return {
        "source_ip": source_ip,
        "triggered_count": len(triggered),
        "triggered_playbooks": triggered
    }
