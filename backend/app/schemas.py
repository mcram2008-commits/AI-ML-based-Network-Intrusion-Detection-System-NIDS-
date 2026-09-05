from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Auth & User Schemas
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    confirm_password: str
    role: str = "Viewer"
    terms: bool = True

class UserLogin(BaseModel):
    username_or_email: str
    password: str
    remember_me: bool = False

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    phone: Optional[str] = None
    role: str
    profile_image: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str

class UserCreateAdmin(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    role: str = "Security Analyst"

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

# Dataset Schemas
class DatasetOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    num_records: int
    num_features: int
    missing_values: int
    normal_count: int
    attack_count: int
    normal_percentage: float
    attack_percentage: float
    class_distribution: Optional[Dict[str, int]] = None
    is_preprocessed: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True

# ML Model Schemas
class ModelTrainRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    dataset_id: int
    algorithm: str  # Random Forest, Decision Tree, Logistic Regression, Support Vector Machine, XGBoost, Neural Network
    model_name: Optional[str] = None
    test_size: float = 0.2
    hyperparams: Optional[Dict[str, Any]] = None

class MLModelOut(BaseModel):
    id: int
    name: str
    algorithm: str
    dataset_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    confusion_matrix_json: Optional[Any] = None
    per_class_metrics_json: Optional[Any] = None
    hyperparams_json: Optional[Any] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Traffic & Prediction Schemas
class ManualFlowPredictRequest(BaseModel):
    source_ip: str = "192.168.1.105"
    destination_ip: str = "10.0.0.1"
    source_port: int = 44332
    destination_port: int = 80
    protocol: str = "TCP"
    packet_count: int = 150
    byte_count: int = 14500
    duration: float = 2.5
    rate: float = 5800.0

class FlowPredictionOut(BaseModel):
    id: int
    flow_id: int
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    packet_count: int
    byte_count: int
    duration: float
    rate: float
    prediction: str
    attack_category: str
    confidence: float
    threat_severity: str
    recommended_action: str
    timestamp: datetime

# Alert Schemas
class AlertOut(BaseModel):
    id: int
    alert_code: str
    flow_id: Optional[int] = None
    timestamp: datetime
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    attack_type: str
    confidence: float
    severity: str
    status: str
    description: str

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str  # New, Investigating, Resolved, False Positive

# System Settings Schema
class SystemSettingsUpdate(BaseModel):
    detection_threshold: float = 0.5
    alert_threshold: str = "MEDIUM"
    active_model_id: Optional[int] = None
    refresh_interval_sec: int = 3
    demo_mode: bool = True

# Email Report Schemas
class IPReportEmailRequest(BaseModel):
    source_ip: str
    destination_ip: str
    recipient_email: EmailStr
    notes: Optional[str] = None
    subject: Optional[str] = None

class IPReportEmailResponse(BaseModel):
    success: bool
    status: str
    simulated: bool
    message: str
    recipient: str
    dispatched_at: str
    html_preview: str

# 1. Notification Schemas
class NotificationSettingsUpdate(BaseModel):
    slack_webhook_url: Optional[str] = ""
    discord_webhook_url: Optional[str] = ""
    webhook_enabled: bool = False
    min_severity_trigger: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL

class NotificationSettingsOut(BaseModel):
    slack_webhook_url: str = ""
    discord_webhook_url: str = ""
    webhook_enabled: bool = False
    min_severity_trigger: str = "HIGH"

class TestWebhookRequest(BaseModel):
    webhook_url: str
    provider: str = "slack"  # slack, discord, custom

# 2. Firewall Rule Schemas
class FirewallRuleRequest(BaseModel):
    source_ip: str
    target_syntax: str = "iptables"  # iptables, snort, suricata, csv
    action: str = "DROP"  # DROP, REJECT, LOG
    custom_comment: Optional[str] = None

class FirewallRuleResponse(BaseModel):
    source_ip: str
    target_syntax: str
    generated_rule: str
    filename: str
    description: str

# 3. Simulator Schemas
class SimulatorStartRequest(BaseModel):
    attack_preset: str = "DoS/DDoS"  # DoS/DDoS, Port Scan, Brute Force, Mixed
    packets_per_sec: int = 5
    target_ip: str = "10.0.0.1"

class SimulatorStatusResponse(BaseModel):
    is_running: bool
    attack_preset: str
    packets_per_sec: int
    total_flows_generated: int
    active_target_ip: str

# 4. AI Advisor Schemas
class AiAdvisorRequest(BaseModel):
    attack_type: str
    severity: str = "HIGH"
    source_ip: Optional[str] = "185.220.101.5"
    destination_ip: Optional[str] = "10.0.0.1"
    confidence: Optional[float] = 95.0

class AiAdvisorResponse(BaseModel):
    attack_type: str
    severity: str
    threat_overview: str
    risk_impact: str
    immediate_actions: list[str]
    long_term_mitigation: list[str]
    recommended_firewall_command: str


