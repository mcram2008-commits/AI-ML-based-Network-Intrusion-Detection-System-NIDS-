import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
import datetime
from app.config import settings

logger = logging.getLogger("nids_email_service")

def build_ip_incident_email_html(
    source_ip: str,
    destination_ip: str,
    threat_score: float,
    threat_level: str,
    total_connections: int,
    attack_count: int,
    attack_types: List[str],
    ports_accessed: List[int],
    protocols_used: List[str],
    recommended_actions: List[str],
    notes: Optional[str] = None,
    generated_by: str = "SOC Security Analyst"
) -> str:
    """Renders a high-grade executive HTML email report for IP pair security incident."""
    
    badge_color = "#EF4444" if threat_level == "CRITICAL" else ("#F97316" if threat_level == "HIGH" else ("#F59E0B" if threat_level == "MEDIUM" else "#10B981"))
    
    attacks_html = "".join([f'<span style="display:inline-block; background-color: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">{at}</span>' for at in attack_types]) or '<span style="color:#94A3B8;">None Detected</span>'
    
    actions_html = "".join([f'<li style="margin-bottom: 8px; color: #E2E8F0;">🛡️ {act}</li>' for act in recommended_actions])
    
    notes_html = f'''
    <div style="margin-top: 20px; padding: 14px; background-color: #1E293B; border-left: 4px solid #3B82F6; border-radius: 6px;">
        <strong style="color: #60A5FA; font-size: 13px; text-transform: uppercase; tracking: 1px;">Analyst Notes:</strong>
        <p style="margin: 6px 0 0 0; color: #CBD5E1; font-size: 13px; line-height: 1.5;">{notes}</p>
    </div>
    ''' if notes else ""

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070A12; color: #E2E8F0; margin: 0; padding: 20px; }}
            .container {{ max-width: 650px; margin: 0 auto; background: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .header {{ background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); padding: 24px; border-bottom: 1px solid #1E293B; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 20px; color: #38BDF8; font-weight: 700; letter-spacing: 0.5px; }}
            .header p {{ margin: 6px 0 0 0; font-size: 12px; color: #94A3B8; }}
            .content {{ padding: 24px; }}
            .badge {{ display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; color: #FFF; background-color: {badge_color}; margin-top: 4px; }}
            .section-title {{ font-size: 13px; text-transform: uppercase; font-weight: 700; color: #94A3B8; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #1E293B; padding-bottom: 4px; }}
            .footer {{ background: #090E17; padding: 16px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1E293B; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ AEGIS NIDS - Security Incident Report</h1>
                <p>Generated on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} by {generated_by}</p>
            </div>
            <div class="content">
                <!-- IP Pair Box -->
                <table width="100%" style="background:#182234; border:1px solid #2B3954; border-radius:8px; padding:16px; margin-bottom:20px;">
                    <tr>
                        <td align="center" width="45%">
                            <span style="font-size:10px; color:#64748B; font-weight:700; text-transform:uppercase;">Source (Sender) IP</span><br>
                            <span style="font-family:monospace; font-size:16px; font-weight:700; color:#F87171;">{source_ip}</span>
                        </td>
                        <td align="center" width="10%" style="font-size:18px; color:#38BDF8;">➔</td>
                        <td align="center" width="45%">
                            <span style="font-size:10px; color:#64748B; font-weight:700; text-transform:uppercase;">Destination IP</span><br>
                            <span style="font-family:monospace; font-size:16px; font-weight:700; color:#34D399;">{destination_ip}</span>
                        </td>
                    </tr>
                </table>

                <!-- Threat Score Bar -->
                <div style="background:#131C2E; border:1px solid #1E293B; padding:14px; border-radius:8px; margin-bottom:20px; text-align:center;">
                    <div style="font-size:11px; color:#94A3B8; font-weight:700; text-transform:uppercase;">Assessed Threat Severity</div>
                    <div class="badge">{threat_level} (Threat Score: {threat_score}/100)</div>
                </div>

                <!-- Stats Grid -->
                <table width="100%" style="margin-bottom:20px;">
                    <tr>
                        <td width="50%" style="padding-right:6px;">
                            <div style="background:#131C2E; border:1px solid #1E293B; padding:12px; border-radius:8px; text-align:center;">
                                <div style="font-size:18px; font-weight:700; color:#38BDF8;">{total_connections}</div>
                                <div style="font-size:11px; color:#64748B; text-transform:uppercase;">Total Connections</div>
                            </div>
                        </td>
                        <td width="50%" style="padding-left:6px;">
                            <div style="background:#131C2E; border:1px solid #1E293B; padding:12px; border-radius:8px; text-align:center;">
                                <div style="font-size:18px; font-weight:700; color:#F87171;">{attack_count}</div>
                                <div style="font-size:11px; color:#64748B; text-transform:uppercase;">Malicious Detections</div>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="section-title">Detected Attack Vectors</div>
                <div>{attacks_html}</div>

                <div class="section-title">Technical Footprint</div>
                <p style="font-size:12px; color:#CBD5E1; margin:4px 0;"><strong>Target Ports Accessed:</strong> {', '.join(map(str, ports_accessed)) or 'N/A'}</p>
                <p style="font-size:12px; color:#CBD5E1; margin:4px 0;"><strong>Protocols Involved:</strong> {', '.join(protocols_used) or 'N/A'}</p>

                {notes_html}

                <div class="section-title">Recommended SOC Actions</div>
                <ul style="padding-left:20px; font-size:13px; margin-top:8px;">
                    {actions_html}
                </ul>
            </div>
            <div class="footer">
                This is an automated Security Report generated by AEGIS Network Intrusion Detection System (NIDS).<br>
                Confidential — Internal Security Analyst Access Only.
            </div>
        </div>
    </body>
    </html>
    """
    return html


def build_welcome_email_html(full_name: str, username: str, email: str, role: str) -> str:
    """Renders HTML email for newly registered user."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #070A12; color: #E2E8F0; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%); padding: 24px; text-align: center; border-bottom: 1px solid #1E293B; }}
            .header h1 {{ margin: 0; font-size: 22px; color: #60A5FA; }}
            .content {{ padding: 24px; font-size: 14px; line-height: 1.6; color: #CBD5E1; }}
            .card {{ background: #182234; border: 1px solid #2B3954; border-radius: 8px; padding: 16px; margin: 16px 0; }}
            .footer {{ background: #090E17; padding: 14px; text-align: center; font-size: 11px; color: #64748B; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ Welcome to AEGIS NIDS</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{full_name}</strong>,</p>
                <p>Your SOC user account has been successfully registered and provisioned on the AEGIS Network Intrusion Detection System.</p>
                
                <div class="card">
                    <div style="font-size:12px; color:#94A3B8; text-transform:uppercase; font-weight:700; margin-bottom:8px;">Account Details:</div>
                    <p style="margin:4px 0;"><strong>Username:</strong> {username}</p>
                    <p style="margin:4px 0;"><strong>Email:</strong> {email}</p>
                    <p style="margin:4px 0;"><strong>Assigned Role:</strong> <span style="color:#34D399; font-weight:700;">{role}</span></p>
                </div>

                <p>You can now log in to the SOC Dashboard to monitor real-time network flow traffic, analyze threats, and receive incident alerts.</p>
            </div>
            <div class="footer">
                AEGIS NIDS — AI/ML Powered Network Security System
            </div>
        </div>
    </body>
    </html>
    """


def send_email_dispatch(
    recipient_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends email via SMTP (if configured & enabled) or generates local simulated preview dispatch.
    """
    if not text_content:
        text_content = "AEGIS NIDS Security Notice. Please view this message in an HTML compatible mail reader."

    # Try SMTP sending if credentials exist and EMAIL_ENABLED is True
    if settings.EMAIL_ENABLED or (settings.SMTP_USERNAME and settings.SMTP_PASSWORD):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SENDER_NAME} <{settings.SENDER_EMAIL}>"
            msg["To"] = recipient_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SENDER_EMAIL, [recipient_email], msg.as_string())

            logger.info(f"Successfully dispatched live email to {recipient_email}")
            return {
                "success": True,
                "status": "SENT",
                "simulated": False,
                "message": f"Email successfully dispatched to {recipient_email} via SMTP ({settings.SMTP_SERVER})",
                "recipient": recipient_email,
                "dispatched_at": datetime.datetime.utcnow().isoformat(),
                "html_preview": html_content
            }
        except Exception as e:
            logger.warning(f"SMTP dispatch failed ({str(e)}). Falling back to simulated email preview dispatch.")
            return {
                "success": True,
                "status": "SIMULATED_PREVIEW",
                "simulated": True,
                "message": f"Security report generated for {recipient_email} (SMTP server not active or reachable). Displaying live HTML dispatch preview.",
                "error_detail": str(e),
                "recipient": recipient_email,
                "dispatched_at": datetime.datetime.utcnow().isoformat(),
                "html_preview": html_content
            }

    # Default: Return Simulated Preview dispatch
    return {
        "success": True,
        "status": "SIMULATED_PREVIEW",
        "simulated": True,
        "message": f"Security Incident Report formatted and dispatched for {recipient_email} (Preview Mode active).",
        "recipient": recipient_email,
        "dispatched_at": datetime.datetime.utcnow().isoformat(),
        "html_preview": html_content
    }
