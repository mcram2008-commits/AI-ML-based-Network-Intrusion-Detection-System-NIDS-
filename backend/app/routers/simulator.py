import time
import threading
import random
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.models import User, NetworkFlow, Prediction, Alert
from app.schemas import SimulatorStartRequest, SimulatorStatusResponse
from app.auth.deps import get_current_user

router = APIRouter(prefix="/simulator", tags=["Traffic Simulator"])

class TrafficSimulatorEngine:
    def __init__(self):
        self.is_running = False
        self.attack_preset = "DoS/DDoS"
        self.packets_per_sec = 5
        self.target_ip = "10.0.0.1"
        self.total_flows_generated = 0
        self._thread = None
        self._lock = threading.Lock()

    def _worker(self):
        attacker_ips = [
            "185.220.101.5", "45.142.214.12", "193.142.146.210", 
            "103.253.144.18", "91.240.118.172", "198.51.100.44"
        ]
        
        while self.is_running:
            try:
                db: Session = SessionLocal()
                src_ip = random.choice(attacker_ips)
                preset = self.attack_preset
                
                if preset == "Mixed":
                    preset = random.choice(["DoS/DDoS", "Port Scan", "Brute Force", "BENIGN"])
                
                if preset == "DoS/DDoS":
                    pkts = random.randint(15000, 40000)
                    bytes_cnt = pkts * random.randint(50, 120)
                    dur = round(random.uniform(0.1, 0.8), 2)
                    rate = round(bytes_cnt / max(dur, 0.01), 2)
                    pred = "Malicious"
                    cat = "DoS/DDoS"
                    sev = "CRITICAL"
                    conf = round(random.uniform(96.0, 99.8), 1)
                elif preset == "Port Scan":
                    pkts = random.randint(2, 5)
                    bytes_cnt = pkts * 60
                    dur = round(random.uniform(0.01, 0.05), 3)
                    rate = round(bytes_cnt / max(dur, 0.001), 2)
                    pred = "Malicious"
                    cat = "Port Scan"
                    sev = "MEDIUM"
                    conf = round(random.uniform(90.0, 95.0), 1)
                elif preset == "Brute Force":
                    pkts = random.randint(30, 80)
                    bytes_cnt = pkts * 110
                    dur = round(random.uniform(1.0, 3.0), 2)
                    rate = round(bytes_cnt / max(dur, 0.01), 2)
                    pred = "Malicious"
                    cat = "Brute Force"
                    sev = "HIGH"
                    conf = round(random.uniform(93.0, 97.5), 1)
                else:
                    pkts = random.randint(10, 100)
                    bytes_cnt = pkts * 400
                    dur = round(random.uniform(1.5, 5.0), 2)
                    rate = round(bytes_cnt / max(dur, 0.01), 2)
                    pred = "Normal"
                    cat = "BENIGN"
                    sev = "LOW"
                    conf = round(random.uniform(98.0, 99.9), 1)

                flow = NetworkFlow(
                    timestamp=datetime.datetime.utcnow(),
                    source_ip=src_ip,
                    destination_ip=self.target_ip,
                    source_port=random.randint(40000, 65000),
                    destination_port=80 if preset == "DoS/DDoS" else (22 if preset == "Brute Force" else random.choice([80, 443, 22, 3389])),
                    protocol="TCP",
                    packet_count=pkts,
                    byte_count=bytes_cnt,
                    duration=dur,
                    rate=rate,
                    is_simulated=True
                )
                db.add(flow)
                db.commit()
                db.refresh(flow)

                if pred == "Malicious":
                    alert_code = f"ALT-SIM-{random.randint(100, 999)}"
                    alert = Alert(
                        alert_code=alert_code,
                        flow_id=flow.id,
                        timestamp=datetime.datetime.utcnow(),
                        source_ip=src_ip,
                        destination_ip=self.target_ip,
                        source_port=flow.source_port,
                        destination_port=flow.destination_port,
                        protocol="TCP",
                        attack_type=cat,
                        confidence=conf,
                        severity=sev,
                        status="New",
                        description=f"Simulated attack stream: {cat} detected from {src_ip}"
                    )
                    db.add(alert)
                    db.commit()

                db.close()
                with self._lock:
                    self.total_flows_generated += 1
            except Exception as e:
                print(f"[Simulator] Worker error: {e}")
            
            sleep_time = max(0.2, 1.0 / max(1, self.packets_per_sec))
            time.sleep(sleep_time)

    def start(self, preset: str, pps: int, target: str):
        with self._lock:
            if self.is_running:
                self.stop()
            self.attack_preset = preset
            self.packets_per_sec = pps
            self.target_ip = target
            self.is_running = True
            self._thread = threading.Thread(target=self._worker, daemon=True)
            self._thread.start()

    def stop(self):
        with self._lock:
            self.is_running = False
            self._thread = None

simulator_engine = TrafficSimulatorEngine()

@router.get("/status", response_model=SimulatorStatusResponse)
def get_simulator_status(current_user: User = Depends(get_current_user)):
    """Check current state of the traffic simulator"""
    return SimulatorStatusResponse(
        is_running=simulator_engine.is_running,
        attack_preset=simulator_engine.attack_preset,
        packets_per_sec=simulator_engine.packets_per_sec,
        total_flows_generated=simulator_engine.total_flows_generated,
        active_target_ip=simulator_engine.target_ip
    )

@router.post("/start", response_model=SimulatorStatusResponse)
def start_simulator(
    payload: SimulatorStartRequest,
    current_user: User = Depends(get_current_user)
):
    """Start synthesized live attack flow generator"""
    simulator_engine.start(payload.attack_preset, payload.packets_per_sec, payload.target_ip)
    return get_simulator_status(current_user=current_user)

@router.post("/stop", response_model=SimulatorStatusResponse)
def stop_simulator(current_user: User = Depends(get_current_user)):
    """Stop active traffic simulation engine"""
    simulator_engine.stop()
    return get_simulator_status(current_user=current_user)
