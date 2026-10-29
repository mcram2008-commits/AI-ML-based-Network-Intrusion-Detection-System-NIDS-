import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from app.config import settings

MODEL_FILE = os.path.join(settings.MODELS_DIR, "isolation_forest_baseline.joblib")
SCALER_FILE = os.path.join(settings.MODELS_DIR, "isolation_forest_scaler.joblib")

FEATURE_NAMES = [
    "flow_duration",
    "source_port",
    "destination_port",
    "protocol_num",
    "total_fwd_packets",
    "total_bwd_packets",
    "total_length_of_fwd_packets",
    "flow_bytes_per_sec",
    "flow_packets_per_sec",
    "fwd_packet_length_mean",
    "bwd_packet_length_mean",
    "syn_flag_count",
    "ack_flag_count"
]

DEFAULT_BASELINE_STATS = {
    "flow_duration": {"mean": 125000.0, "std": 85000.0, "unit": "μs"},
    "source_port": {"mean": 41200.0, "std": 14000.0, "unit": "port"},
    "destination_port": {"mean": 443.0, "std": 800.0, "unit": "port"},
    "protocol_num": {"mean": 6.0, "std": 4.0, "unit": "proto"},
    "total_fwd_packets": {"mean": 12.0, "std": 8.0, "unit": "pkts"},
    "total_bwd_packets": {"mean": 15.0, "std": 12.0, "unit": "pkts"},
    "total_length_of_fwd_packets": {"mean": 1850.0, "std": 1200.0, "unit": "bytes"},
    "flow_bytes_per_sec": {"mean": 45000.0, "std": 25000.0, "unit": "B/s"},
    "flow_packets_per_sec": {"mean": 85.0, "std": 45.0, "unit": "pkt/s"},
    "fwd_packet_length_mean": {"mean": 145.0, "std": 80.0, "unit": "bytes"},
    "bwd_packet_length_mean": {"mean": 320.0, "std": 150.0, "unit": "bytes"},
    "syn_flag_count": {"mean": 1.0, "std": 0.5, "unit": "flags"},
    "ack_flag_count": {"mean": 8.0, "std": 6.0, "unit": "flags"}
}


class AnomalyDetectorService:
    def __init__(self):
        self.model: IsolationForest = None
        self.scaler: StandardScaler = None
        self.contamination: float = 0.05
        self.total_trained_samples: int = 0
        self.last_trained_at: str = None
        self._load_or_initialize()

    def _generate_synthetic_benign_baseline(self, n_samples: int = 2500) -> np.ndarray:
        """Generates realistic normal enterprise traffic distributions for baseline training"""
        np.random.seed(42)
        data = []
        for _ in range(n_samples):
            dur = max(500, np.random.normal(120000, 45000))
            sport = np.random.randint(1024, 65535)
            dport = np.random.choice([80, 443, 8080, 53, 22, 3306], p=[0.35, 0.45, 0.08, 0.08, 0.02, 0.02])
            proto = 6 if dport != 53 else 17
            fwd_pkts = max(1, int(np.random.exponential(10)))
            bwd_pkts = max(1, int(np.random.exponential(14)))
            fwd_len = fwd_pkts * np.random.normal(150, 40)
            bytes_sec = max(100, np.random.normal(40000, 15000))
            pkts_sec = max(5, np.random.normal(80, 30))
            fwd_mean = max(40, np.random.normal(140, 35))
            bwd_mean = max(40, np.random.normal(300, 70))
            syn = 1 if proto == 6 else 0
            ack = max(1, int(fwd_pkts * 0.8))

            data.append([
                dur, sport, dport, proto, fwd_pkts, bwd_pkts,
                fwd_len, bytes_sec, pkts_sec, fwd_mean, bwd_mean, syn, ack
            ])
        return np.array(data)

    def train_baseline(self, contamination: float = 0.05, custom_samples: np.ndarray = None) -> Dict[str, Any]:
        """Trains or retrains the Isolation Forest model on benign baseline network behavior"""
        import datetime
        self.contamination = contamination
        X = custom_samples if custom_samples is not None else self._generate_synthetic_benign_baseline(3000)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        iso_forest = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        iso_forest.fit(X_scaled)

        self.model = iso_forest
        self.scaler = scaler
        self.total_trained_samples = len(X)
        self.last_trained_at = datetime.datetime.utcnow().isoformat()

        # Persist to disk
        try:
            joblib.dump(self.model, MODEL_FILE)
            joblib.dump(self.scaler, SCALER_FILE)
        except Exception as e:
            print("Warning saving anomaly model to disk:", e)

        return {
            "status": "success",
            "message": "Zero-Day Isolation Forest Baseline successfully trained",
            "trained_samples": self.total_trained_samples,
            "contamination_rate": self.contamination,
            "features_used": len(FEATURE_NAMES),
            "timestamp": self.last_trained_at
        }

    def _load_or_initialize(self):
        """Loads cached Isolation Forest model if present, otherwise trains fresh baseline"""
        if os.path.exists(MODEL_FILE) and os.path.exists(SCALER_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
                self.scaler = joblib.load(SCALER_FILE)
                self.total_trained_samples = 3000
                self.last_trained_at = "Cached Persistent Baseline"
                return
            except Exception:
                pass
        # Auto-train default baseline
        self.train_baseline()

    def evaluate_flow(self, flow_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a flow dictionary against the unsupervised Isolation Forest baseline.
        Returns anomaly decision, anomaly score (0-100%), and explainability feature deviations.
        """
        if self.model is None or self.scaler is None:
            self.train_baseline()

        # Protocol mapping
        proto = flow_dict.get("protocol", "TCP")
        proto_num = 6 if proto == "TCP" else (17 if proto == "UDP" else 1)
        if isinstance(flow_dict.get("protocol_num"), (int, float)):
            proto_num = flow_dict.get("protocol_num")

        raw_vector = [
            float(flow_dict.get("flow_duration", 120000)),
            float(flow_dict.get("source_port", 45000)),
            float(flow_dict.get("destination_port", 80)),
            float(proto_num),
            float(flow_dict.get("total_fwd_packets", 10)),
            float(flow_dict.get("total_bwd_packets", 12)),
            float(flow_dict.get("total_length_of_fwd_packets", 1500)),
            float(flow_dict.get("flow_bytes_per_sec", 40000)),
            float(flow_dict.get("flow_packets_per_sec", 75)),
            float(flow_dict.get("fwd_packet_length_mean", 140)),
            float(flow_dict.get("bwd_packet_length_mean", 290)),
            float(flow_dict.get("syn_flag_count", 1)),
            float(flow_dict.get("ack_flag_count", 6))
        ]

        X = np.array([raw_vector])
        X_scaled = self.scaler.transform(X)

        # Isolation Forest prediction: 1 = inlier (normal), -1 = outlier (anomaly)
        pred = self.model.predict(X_scaled)[0]
        # score_samples returns opposite of anomaly score (lower means more anomalous)
        raw_score = self.model.score_samples(X_scaled)[0]
        # Normalize score into human-friendly 0-100 anomaly index
        # raw_score is typically between -0.8 (extreme outlier) and -0.35 (dense inlier)
        anomaly_score = max(0.0, min(100.0, round((-raw_score - 0.38) * 260, 1)))

        is_anomaly = bool(pred == -1 or anomaly_score >= 60.0)

        # Explainability: compute feature z-scores to isolate which features caused the anomaly
        deviations = []
        for i, f_name in enumerate(FEATURE_NAMES):
            val = raw_vector[i]
            stat = DEFAULT_BASELINE_STATS.get(f_name, {"mean": 1.0, "std": 1.0, "unit": ""})
            z_score = abs(val - stat["mean"]) / max(1e-4, stat["std"])
            if z_score > 1.8:
                pct_diff = round(((val - stat["mean"]) / max(1e-4, stat["mean"])) * 100, 1)
                deviations.append({
                    "feature": f_name.replace("_", " ").title(),
                    "observed_value": round(val, 2),
                    "baseline_mean": round(stat["mean"], 2),
                    "deviation_pct": f"{'+' if pct_diff > 0 else ''}{pct_diff}%",
                    "severity": "CRITICAL" if z_score > 3.5 else "HIGH" if z_score > 2.5 else "MEDIUM"
                })

        deviations = sorted(deviations, key=lambda d: d.get("severity") == "CRITICAL", reverse=True)[:5]

        if is_anomaly:
            if anomaly_score > 85.0:
                verdict = "Severe Zero-Day Anomaly"
                recommendation = "Isolate host and deploy immediate firewall block rule."
            else:
                verdict = "Suspected Novel Attack Pattern"
                recommendation = "Flagged for deep packet inspection and analyst investigation."
        else:
            verdict = "Normal Network Behavior"
            recommendation = "Traffic pattern conforms to historical enterprise baseline."

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "raw_decision_score": round(float(raw_score), 4),
            "verdict": verdict,
            "recommendation": recommendation,
            "top_deviating_features": deviations,
            "model_type": "Unsupervised Isolation Forest (Zero-Day Detector)",
            "evaluated_features_count": len(FEATURE_NAMES)
        }


anomaly_detector = AnomalyDetectorService()
