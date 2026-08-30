import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="Viewer", nullable=False)  # Admin, Security Analyst, Viewer
    profile_image = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    num_records = Column(Integer, default=0)
    num_features = Column(Integer, default=0)
    missing_values = Column(Integer, default=0)
    normal_count = Column(Integer, default=0)
    attack_count = Column(Integer, default=0)
    normal_percentage = Column(Float, default=0.0)
    attack_percentage = Column(Float, default=0.0)
    class_distribution = Column(JSON, nullable=True)
    filepath = Column(String(500), nullable=False)
    is_preprocessed = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)


class MLModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    algorithm = Column(String(50), nullable=False)  # Random Forest, Decision Tree, Logistic Regression, SVM, Gradient Boosting, MLP Neural Network
    dataset_name = Column(String(100), default="CICIDS2017 Sample")
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix_json = Column(JSON, nullable=True)
    per_class_metrics_json = Column(JSON, nullable=True)
    hyperparams_json = Column(JSON, nullable=True)
    filepath = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class NetworkFlow(Base):
    __tablename__ = "network_flows"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source_ip = Column(String(45), index=True, nullable=False)
    destination_ip = Column(String(45), index=True, nullable=False)
    source_port = Column(Integer, nullable=False)
    destination_port = Column(Integer, nullable=False)
    protocol = Column(String(10), nullable=False)
    packet_count = Column(Integer, nullable=False)
    byte_count = Column(Integer, nullable=False)
    duration = Column(Float, nullable=False)  # flow duration in seconds
    rate = Column(Float, nullable=False)  # bytes per sec
    is_simulated = Column(Boolean, default=True)

    predictions = relationship("Prediction", back_populates="flow", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="flow", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("network_flows.id", ondelete="CASCADE"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="SET NULL"), nullable=True)
    prediction = Column(String(20), nullable=False)  # Normal vs Malicious
    attack_category = Column(String(50), nullable=False)  # Benign, DoS/DDoS, Port Scan, Brute Force, Botnet, Web Attack, Infiltration
    confidence = Column(Float, nullable=False)  # percentage e.g. 97.4
    threat_severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_action = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    flow = relationship("NetworkFlow", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False)
    flow_id = Column(Integer, ForeignKey("network_flows.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source_ip = Column(String(45), index=True, nullable=False)
    destination_ip = Column(String(45), index=True, nullable=False)
    source_port = Column(Integer, nullable=False)
    destination_port = Column(Integer, nullable=False)
    protocol = Column(String(10), nullable=False)
    attack_type = Column(String(50), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String(20), index=True, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(20), default="New", index=True, nullable=False)  # New, Investigating, Resolved, False Positive
    description = Column(Text, nullable=False)

    flow = relationship("NetworkFlow", back_populates="alerts")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(String(255), nullable=False)


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    level = Column(String(20), default="INFO")
    user_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
