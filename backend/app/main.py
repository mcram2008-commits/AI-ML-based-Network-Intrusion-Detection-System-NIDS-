import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, MLModel, NetworkFlow, Prediction, Alert, SystemSetting
from app.auth.jwt import get_password_hash
from app.ml.trainer import generate_synthetic_dataset, train_and_eval_model

from app.routers import (
    auth, users, datasets, models, predict,
    dashboard, alerts, ip_analysis, attacks, reports, settings as settings_router,
    notifications, firewall, simulator, advisor, route_optimization, live_sniffer
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(datasets.router, prefix=settings.API_PREFIX)
app.include_router(models.router, prefix=settings.API_PREFIX)
app.include_router(predict.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(ip_analysis.router, prefix=settings.API_PREFIX)
app.include_router(attacks.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_PREFIX)
app.include_router(notifications.router, prefix=settings.API_PREFIX)
app.include_router(firewall.router, prefix=settings.API_PREFIX)
app.include_router(simulator.router, prefix=settings.API_PREFIX)
app.include_router(advisor.router, prefix=settings.API_PREFIX)
app.include_router(route_optimization.router, prefix=settings.API_PREFIX)
app.include_router(live_sniffer.router, prefix=settings.API_PREFIX)





@app.on_event("startup")
def startup_event():
    # 1. Initialize Database Tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Seed Default Admin User if no users exist
        if db.query(User).count() == 0:
            admin_user = User(
                full_name="SOC Administrator",
                username="admin",
                email="admin@nids.sec",
                phone="+18005550199",
                password_hash=get_password_hash("Admin123!"),
                role="Admin",
                is_active=True,
                is_verified=True,
                created_at=datetime.datetime.utcnow()
            )
            
            analyst_user = User(
                full_name="Security Analyst",
                username="analyst",
                email="analyst@nids.sec",
                phone="+18005550198",
                password_hash=get_password_hash("Analyst123!"),
                role="Security Analyst",
                is_active=True,
                is_verified=True,
                created_at=datetime.datetime.utcnow()
            )
            
            viewer_user = User(
                full_name="Viewer User",
                username="viewer",
                email="viewer@nids.sec",
                phone="+18005550197",
                password_hash=get_password_hash("Viewer123!"),
                role="Viewer",
                is_active=True,
                is_verified=True,
                created_at=datetime.datetime.utcnow()
            )
            
            db.add_all([admin_user, analyst_user, viewer_user])
            db.commit()
            print("--> Seeded default Admin (admin / Admin123!), Analyst (analyst / Analyst123!), Viewer (viewer / Viewer123!)")
            
        # 3. Seed Default Active ML Model if none exists
        if db.query(MLModel).count() == 0:
            df = generate_synthetic_dataset(num_samples=1500)
            bundle, metrics = train_and_eval_model(df, "Random Forest", test_size=0.2, model_save_filename="rf_default.joblib")
            
            rf_model = MLModel(
                name="Random Forest Classifier (CICIDS2017 Sample)",
                algorithm="Random Forest",
                dataset_name="CICIDS2017 Benchmark Flow Sample",
                accuracy=metrics["accuracy"],
                precision=metrics["precision"],
                recall=metrics["recall"],
                f1_score=metrics["f1_score"],
                roc_auc=metrics["roc_auc"],
                confusion_matrix_json=metrics["confusion_matrix"],
                per_class_metrics_json=metrics["per_class_metrics"],
                filepath=metrics["save_path"],
                is_active=True
            )
            db.add(rf_model)
            db.commit()
            print(f"--> Trained and seeded initial active ML Model with Accuracy: {metrics['accuracy']}%")
            
        # 4. Seed Initial Flows and Alerts if empty
        if db.query(NetworkFlow).count() == 0:
            flows_data = [
                ("185.220.101.5", "10.0.0.1", 44102, 80, "TCP", 25000, 2500000, 0.5, 5000000.0, "Malicious", "DoS/DDoS", 98.4, "CRITICAL", "ALT-DOS-01"),
                ("45.142.214.12", "10.0.0.5", 58490, 22, "TCP", 45, 4500, 1.2, 3750.0, "Malicious", "Brute Force", 94.2, "HIGH", "ALT-BRUTE-02"),
                ("193.142.146.210", "172.16.1.100", 61002, 443, "TCP", 2, 120, 0.02, 6000.0, "Malicious", "Port Scan", 91.0, "MEDIUM", "ALT-SCAN-03"),
                ("192.168.1.105", "10.0.0.1", 52100, 443, "HTTPS", 80, 45000, 3.5, 12857.0, "Normal", "BENIGN", 99.1, "LOW", None),
                ("192.168.1.110", "192.168.1.1", 53300, 53, "UDP", 12, 1200, 0.1, 12000.0, "Normal", "BENIGN", 99.5, "LOW", None)
            ]
            
            for src, dst, sp, dp, proto, pkts, bytes_cnt, dur, rate, pred, cat, conf, sev, alt_code in flows_data:
                flow = NetworkFlow(
                    timestamp=datetime.datetime.utcnow(),
                    source_ip=src,
                    destination_ip=dst,
                    source_port=sp,
                    destination_port=dp,
                    protocol=proto,
                    packet_count=pkts,
                    byte_count=bytes_cnt,
                    duration=dur,
                    rate=rate,
                    is_simulated=True
                )
                db.add(flow)
                db.commit()
                db.refresh(flow)
                
                prediction = Prediction(
                    flow_id=flow.id,
                    model_id=1,
                    prediction=pred,
                    attack_category=cat,
                    confidence=conf,
                    threat_severity=sev,
                    recommended_action="Investigate source IP" if pred == "Malicious" else "Normal traffic",
                    timestamp=datetime.datetime.utcnow()
                )
                db.add(prediction)
                
                if alt_code:
                    alert = Alert(
                        alert_code=alt_code,
                        flow_id=flow.id,
                        timestamp=datetime.datetime.utcnow(),
                        source_ip=src,
                        destination_ip=dst,
                        source_port=sp,
                        destination_port=dp,
                        protocol=proto,
                        attack_type=cat,
                        confidence=conf,
                        severity=sev,
                        status="New",
                        description=f"Initial alert: {cat} attack detected with {conf}% confidence."
                    )
                    db.add(alert)
                db.commit()
            print("--> Seeded initial network flows, predictions, and alerts")
            
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/api/docs"
    }
