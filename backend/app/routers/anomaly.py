from typing import List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NetworkFlow, User
from app.auth.deps import require_any_user, require_admin
from app.services.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/anomaly", tags=["Zero-Day Anomaly Detection"])


class AnomalyTrainRequest(BaseModel):
    contamination: float = Field(0.05, ge=0.01, le=0.25, description="Expected proportion of outliers in baseline")


class FlowEvaluateRequest(BaseModel):
    flow_duration: float = 120000.0
    source_port: int = 49152
    destination_port: int = 80
    protocol: str = "TCP"
    total_fwd_packets: int = 10
    total_bwd_packets: int = 12
    total_length_of_fwd_packets: float = 1500.0
    flow_bytes_per_sec: float = 40000.0
    flow_packets_per_sec: float = 75.0
    fwd_packet_length_mean: float = 140.0
    bwd_packet_length_mean: float = 290.0
    syn_flag_count: int = 1
    ack_flag_count: int = 6


@router.get("/status")
def get_anomaly_detector_status(current_user: User = Depends(require_any_user)):
    """Returns the current state and parameters of the Isolation Forest Anomaly Engine"""
    return {
        "is_ready": anomaly_detector.model is not None,
        "model_architecture": "Isolation Forest (150 Estimators, Unsupervised)",
        "contamination_factor": anomaly_detector.contamination,
        "total_baseline_samples": anomaly_detector.total_trained_samples,
        "last_trained_at": anomaly_detector.last_trained_at,
        "features_monitored": [
            "Flow Duration", "Source/Destination Ports", "Protocol",
            "Forward/Backward Packet Counts", "Total Length of Fwd Packets",
            "Flow Bytes/Sec", "Flow Packets/Sec", "Packet Length Means",
            "SYN & ACK Flag Counts"
        ]
    }


@router.post("/train")
def train_baseline_model(
    payload: AnomalyTrainRequest,
    current_user: User = Depends(require_admin)
):
    """Retrain the Isolation Forest baseline on normal network traffic"""
    result = anomaly_detector.train_baseline(contamination=payload.contamination)
    return result


@router.post("/detect")
def detect_flow_anomaly(
    payload: FlowEvaluateRequest,
    current_user: User = Depends(require_any_user)
):
    """Evaluates a single network flow for Zero-Day Anomaly deviation"""
    result = anomaly_detector.evaluate_flow(payload.model_dump())
    return result


@router.get("/live-scan")
def scan_recent_flows(
    limit: int = Query(30, ge=5, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_user)
):
    """Scans the latest network flows using the Isolation Forest model to surface Zero-Day outliers"""
    flows = db.query(NetworkFlow).order_by(NetworkFlow.id.desc()).limit(limit).all()
    results = []

    for f in flows:
        dur_us = float(getattr(f, "duration", 0.12) or 0.12) * 1000000.0
        pkts = int(getattr(f, "packet_count", 15) or 15)
        bytes_tot = int(getattr(f, "byte_count", 2500) or 2500)
        rate_val = float(getattr(f, "rate", 45000.0) or 45000.0)
        fwd_pkts = max(1, int(pkts * 0.45))
        bwd_pkts = max(1, int(pkts * 0.55))
        mean_len = bytes_tot / max(1, pkts)

        flow_dict = {
            "flow_duration": dur_us,
            "source_port": f.source_port,
            "destination_port": f.destination_port,
            "protocol": f.protocol,
            "total_fwd_packets": fwd_pkts,
            "total_bwd_packets": bwd_pkts,
            "total_length_of_fwd_packets": float(bytes_tot * 0.4),
            "flow_bytes_per_sec": rate_val,
            "flow_packets_per_sec": pkts / max(0.001, (getattr(f, "duration", 0.12) or 0.12)),
            "fwd_packet_length_mean": mean_len * 0.8,
            "bwd_packet_length_mean": mean_len * 1.2,
            "syn_flag_count": 1 if f.protocol == "TCP" else 0,
            "ack_flag_count": max(1, int(fwd_pkts * 0.8)),
        }
        res = anomaly_detector.evaluate_flow(flow_dict)
        results.append({
            "flow_id": f.id,
            "source_ip": f.source_ip,
            "source_port": f.source_port,
            "destination_ip": f.destination_ip,
            "destination_port": f.destination_port,
            "protocol": f.protocol,
            "is_anomaly": res["is_anomaly"],
            "anomaly_score": res["anomaly_score"],
            "verdict": res["verdict"],
            "recommendation": res["recommendation"],
            "top_deviating_features": res["top_deviating_features"]
        })

    anomalies_detected = sum(1 for r in results if r["is_anomaly"])
    return {
        "scanned_flows_count": len(results),
        "anomalies_detected": anomalies_detected,
        "anomaly_rate_pct": round((anomalies_detected / max(1, len(results))) * 100, 1),
        "results": results
    }
