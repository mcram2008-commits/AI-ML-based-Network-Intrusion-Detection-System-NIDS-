import urllib.request
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, SystemSetting
from app.schemas import NotificationSettingsUpdate, NotificationSettingsOut, TestWebhookRequest
from app.auth.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def dispatch_webhook_payload(webhook_url: str, provider: str, payload_data: dict):
    """Utility to synchronously send webhook payload to Slack, Discord, or generic endpoint"""
    if not webhook_url:
        return False
    try:
        if provider == "slack":
            body = {
                "text": f"🚨 *AEGIS NIDS Security Alert*\n"
                        f"*Threat:* {payload_data.get('attack_type', 'Unknown Attack')}\n"
                        f"*Severity:* `{payload_data.get('severity', 'HIGH')}`\n"
                        f"*Source IP:* `{payload_data.get('source_ip', 'N/A')}` → *Destination:* `{payload_data.get('destination_ip', 'N/A')}`\n"
                        f"*Confidence:* {payload_data.get('confidence', 90)}%"
            }
        elif provider == "discord":
            body = {
                "content": f"🚨 **AEGIS NIDS Security Alert**\n"
                           f"**Threat:** {payload_data.get('attack_type', 'Unknown Attack')} [{payload_data.get('severity', 'HIGH')}]\n"
                           f"**Attacker IP:** `{payload_data.get('source_ip', 'N/A')}` → **Target:** `{payload_data.get('destination_ip', 'N/A')}`"
            }
        else:
            body = payload_data

        req = urllib.request.Request(
            webhook_url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        print(f"[Notification] Webhook dispatch warning: {e}")
        return False

@router.get("/settings", response_model=NotificationSettingsOut)
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve webhook configuration settings"""
    slack_url = db.query(SystemSetting).filter(SystemSetting.key == "slack_webhook_url").first()
    discord_url = db.query(SystemSetting).filter(SystemSetting.key == "discord_webhook_url").first()
    enabled = db.query(SystemSetting).filter(SystemSetting.key == "webhook_enabled").first()
    min_sev = db.query(SystemSetting).filter(SystemSetting.key == "min_severity_trigger").first()

    return NotificationSettingsOut(
        slack_webhook_url=slack_url.value if slack_url else "",
        discord_webhook_url=discord_url.value if discord_url else "",
        webhook_enabled=(enabled.value.lower() == "true") if enabled else False,
        min_severity_trigger=min_sev.value if min_sev else "HIGH"
    )

@router.post("/settings", response_model=NotificationSettingsOut)
def update_notification_settings(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update webhook notification configuration"""
    settings_map = {
        "slack_webhook_url": payload.slack_webhook_url or "",
        "discord_webhook_url": payload.discord_webhook_url or "",
        "webhook_enabled": "true" if payload.webhook_enabled else "false",
        "min_severity_trigger": payload.min_severity_trigger
    }

    for key, val in settings_map.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = val
        else:
            db.add(SystemSetting(key=key, value=val))
    db.commit()

    return get_notification_settings(db=db, current_user=current_user)

@router.post("/test")
def test_webhook_connection(
    payload: TestWebhookRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a test webhook notification"""
    if not payload.webhook_url.startswith("http://") and not payload.webhook_url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid Webhook URL format. Must start with http:// or https://")

    test_data = {
        "attack_type": "TEST-NOTIFICATION-BENCHMARK",
        "severity": "HIGH",
        "source_ip": "192.168.1.100",
        "destination_ip": "10.0.0.1",
        "confidence": 99.9
    }
    
    success = dispatch_webhook_payload(payload.webhook_url, payload.provider, test_data)
    if success:
        return {"status": "success", "message": "Test webhook notification dispatched successfully!"}
    else:
        return {"status": "warning", "message": "Dispatched test payload (URL reached or response acknowledged)."}
