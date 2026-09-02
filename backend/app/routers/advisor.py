from fastapi import APIRouter, Depends
from app.schemas import AiAdvisorRequest, AiAdvisorResponse
from app.models import User
from app.auth.deps import get_current_user

router = APIRouter(prefix="/advisor", tags=["AI Security Advisor"])

@router.post("/remediation", response_model=AiAdvisorResponse)
def get_ai_remediation_advice(
    payload: AiAdvisorRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate contextual AI Security Remediation advice for an attack/alert"""
    atk = payload.attack_type.upper()
    src = payload.source_ip or "Attacker"
    dst = payload.destination_ip or "Target Server"
    
    if "DOS" in atk or "DDOS" in atk:
        overview = f"A high-volume Denial of Service attack stream originating from {src} targeting {dst}. Designed to exhaust web service bandwidth or server connection pools."
        impact = "Potential service interruption, web application slowdown, or server unresponsiveness for legitimate network users."
        immediate = [
            f"Apply immediate rate-limiting or drop rules for {src} at perimeter firewall.",
            "Verify server CPU/Memory metrics and connection state tables.",
            "Activate Cloud DDoS protection or SYN flood protection cookies."
        ]
        long_term = [
            "Implement automated rate-limiting per source IP block.",
            "Deploy Web Application Firewall (WAF) with layer 7 flood filtering.",
            "Configure BGP Blackholing or Anycast scrubbing center routing."
        ]
        fw_cmd = f"iptables -A INPUT -s {src} -p tcp --dport 80 -m limit --limit 25/minute -j ACCEPT"
    
    elif "PORT SCAN" in atk or "SCAN" in atk:
        overview = f"Reconnaissance port scanning activity detected from {src}. The attacker is probing open ports across {dst} to identify exposed services or software vulnerabilities."
        impact = "Low immediate impact, but usually precedes an targeted exploit attempt or brute-force attack."
        immediate = [
            f"Add {src} to temp block list for 24 hours.",
            "Audit exposed open ports on destination servers.",
            "Verify SSH and RDP management interfaces are not publicly accessible."
        ]
        long_term = [
            "Configure port-knocking or strict IP whitelisting for admin services.",
            "Enable Snort/Suricata port-scan suppression rules.",
            "Implement intrusion prevention auto-shun (Fail2ban / IP shunning)."
        ]
        fw_cmd = f"iptables -A INPUT -s {src} -j DROP"

    elif "BRUTE FORCE" in atk:
        overview = f"High-frequency credential guessing attack originating from {src} against authentication endpoints on {dst}."
        impact = "Risk of account compromise, unauthorized system access, or credential stuffing success."
        immediate = [
            f"Block source IP {src} at firewall.",
            "Force password reset if any accounts showed successful logins.",
            "Enable mandatory Multi-Factor Authentication (MFA)."
        ]
        long_term = [
            "Deploy account lockout policies after 5 failed attempts.",
            "Migrate SSH access to SSH key-only authentication.",
            "Implement CAPTCHA on all login endpoints."
        ]
        fw_cmd = f"iptables -A INPUT -s {src} -p tcp --dport 22 -j DROP"

    else:
        overview = f"Security anomaly detected ({payload.attack_type}) originating from {src} directed at {dst}."
        impact = "Unusual traffic profile requiring SOC analyst verification."
        immediate = [
            f"Isolate network segment containing {src} if internal.",
            "Inspect raw packet capture and HTTP request payloads.",
            "Verify integrity of destination host operating system."
        ]
        long_term = [
            "Update threat intelligence IP feed databases.",
            "Retrain ML classifier with newly captured flow signatures."
        ]
        fw_cmd = f"iptables -A INPUT -s {src} -j DROP"

    return AiAdvisorResponse(
        attack_type=payload.attack_type,
        severity=payload.severity,
        threat_overview=overview,
        risk_impact=impact,
        immediate_actions=immediate,
        long_term_mitigation=long_term,
        recommended_firewall_command=fw_cmd
    )
