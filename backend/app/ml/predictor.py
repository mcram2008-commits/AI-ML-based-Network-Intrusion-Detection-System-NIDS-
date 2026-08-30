import os
import joblib
import numpy as np
from typing import Dict, Any
from app.config import settings
from app.ml.feature_extractor import extract_features_from_dict

# Global in-memory cached model pipeline bundle
_active_model_bundle = None

def load_active_model(model_filepath: str = None):
    global _active_model_bundle
    if model_filepath and os.path.exists(model_filepath):
        _active_model_bundle = joblib.load(model_filepath)
        return _active_model_bundle
    
    # Try to load any existing joblib in MODELS_DIR
    if os.path.exists(settings.MODELS_DIR):
        files = [f for f in os.listdir(settings.MODELS_DIR) if f.endswith(".joblib")]
        if files:
            path = os.path.join(settings.MODELS_DIR, files[0])
            _active_model_bundle = joblib.load(path)
            return _active_model_bundle
            
    return None

def set_active_model_bundle(bundle):
    global _active_model_bundle
    _active_model_bundle = bundle

def get_threat_severity_and_action(attack_category: str, confidence: float) -> tuple[str, str]:
    if attack_category in ["BENIGN", "Normal"]:
        return "LOW", "Normal network flow - no action needed"
    elif attack_category in ["Port Scan"]:
        if confidence > 85.0:
            return "HIGH", "Investigate source IP and close unauthorized listening ports"
        return "MEDIUM", "Monitor source IP for port sweep activity"
    elif attack_category in ["Brute Force"]:
        return "HIGH", "Block source IP and enforce MFA/account lockout policies"
    elif attack_category in ["DoS/DDoS"]:
        return "CRITICAL", "Deploy rate-limiting / DDoS mitigation rules on firewall immediately"
    elif attack_category in ["Botnet"]:
        return "CRITICAL", "Isolate infected host and initiate C2 server domain block"
    elif attack_category in ["Web Attack", "Infiltration"]:
        return "HIGH", "Inspect web application firewall (WAF) logs for injection attempts"
    else:
        return "MEDIUM", "Investigate suspicious network traffic flow"

def predict_flow(flow_data: Dict[str, Any], model_filepath: str = None) -> Dict[str, Any]:
    global _active_model_bundle
    
    bundle = _active_model_bundle
    if model_filepath or bundle is None:
        bundle = load_active_model(model_filepath)
        
    # If still no model loaded, fallback heuristic inference
    if bundle is None:
        dst_port = flow_data.get("destination_port", 80)
        pkt_cnt = flow_data.get("packet_count", 10)
        rate = flow_data.get("rate", 1000)
        
        if pkt_cnt > 1000 or rate > 50000:
            category = "DoS/DDoS"
            pred = "Malicious"
            conf = 96.5
        elif dst_port in [22, 21, 3389] and pkt_cnt > 30:
            category = "Brute Force"
            pred = "Malicious"
            conf = 92.1
        elif pkt_cnt <= 3 and rate < 100:
            category = "Port Scan"
            pred = "Malicious"
            conf = 89.4
        else:
            category = "BENIGN"
            pred = "Normal"
            conf = 98.2
            
        severity, action = get_threat_severity_and_action(category, conf)
        return {
            "prediction": pred,
            "attack_category": category,
            "confidence": round(conf, 1),
            "threat_severity": severity,
            "recommended_action": action
        }
        
    clf = bundle["classifier"]
    scaler = bundle["scaler"]
    label_encoder = bundle["label_encoder"]
    
    vec = extract_features_from_dict(flow_data)
    vec_scaled = scaler.transform(vec)
    
    probs = clf.predict_proba(vec_scaled)[0]
    pred_idx = np.argmax(probs)
    category = str(label_encoder.classes_[pred_idx])
    conf = float(probs[pred_idx] * 100.0)
    
    pred = "Normal" if category in ["BENIGN", "Normal"] else "Malicious"
    severity, action = get_threat_severity_and_action(category, conf)
    
    return {
        "prediction": pred,
        "attack_category": category,
        "confidence": round(conf, 1),
        "threat_severity": severity,
        "recommended_action": action
    }
