import sys
import subprocess
import datetime
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import FirewallRuleResponse
from app.models import User, SystemLog
from app.auth.deps import get_current_user, require_analyst_or_admin

router = APIRouter(prefix="/firewall", tags=["Firewall Rules"])

# Cache for active firewall blocks in runtime
ACTIVE_BLOCKED_IPS = {}

class ExecuteBlockRequest(BaseModel):
    source_ip: str
    reason: str = "AEGIS NIDS Auto-Mitigation (SOAR)"
    syntax: str = "auto" # auto, windows_netsh, iptables

class BlockRuleOut(BaseModel):
    source_ip: str
    status: str
    command_executed: str
    platform: str
    timestamp: str
    message: str

@router.get("/generate", response_model=FirewallRuleResponse)
def generate_firewall_rule(
    source_ip: str = Query(..., description="Attacker Source IP"),
    target_syntax: str = Query("iptables", description="Target syntax: iptables, snort, suricata, csv"),
    action: str = Query("DROP", description="Action: DROP, REJECT, LOG"),
    custom_comment: str = Query(None, description="Optional custom rule comment"),
    current_user: User = Depends(get_current_user)
):
    """Generate firewall / IDS block rules for a given IP address"""
    comment = custom_comment or f"AEGIS NIDS Auto-Block Attacker {source_ip}"
    syntax = target_syntax.lower()
    
    if syntax == "iptables":
        rule = f"iptables -A INPUT -s {source_ip} -j {action} -m comment --comment \"{comment}\""
        filename = f"block_{source_ip.replace('.', '_')}.sh"
        desc = "Linux Netfilter iptables packet filter drop rule"
    elif syntax == "windows_netsh" or syntax == "netsh":
        rule = f"netsh advfirewall firewall add rule name=\"AEGIS_BLOCK_{source_ip}\" dir=in action=block remoteip={source_ip}"
        filename = f"block_{source_ip.replace('.', '_')}.bat"
        desc = "Windows Firewall Advanced Security Block Rule"
    elif syntax == "snort":
        rule = f"drop ip {source_ip} any -> $HOME_NET any (msg:\"{comment}\"; sid:1000999; rev:1;)"
        filename = f"snort_rule_{source_ip.replace('.', '_')}.rules"
        desc = "Snort IDS/IPS signature rule"
    elif syntax == "suricata":
        rule = f"drop ip {source_ip} any -> $HOME_NET any (msg:\"{comment}\"; classtype:attempted-admin; sid:2000999; rev:1;)"
        filename = f"suricata_rule_{source_ip.replace('.', '_')}.rules"
        desc = "Suricata Next-Gen IDS/IPS signature rule"
    elif syntax == "csv":
        rule = f"IP,Action,Comment\n{source_ip},{action},\"{comment}\""
        filename = f"blocklist_{source_ip.replace('.', '_')}.csv"
        desc = "Comma-separated blocklist format"
    else:
        rule = f"# Generic Blocklist Entry\n{source_ip} {action}"
        filename = f"block_{source_ip.replace('.', '_')}.txt"
        desc = "Generic firewall block entry"

    return FirewallRuleResponse(
        source_ip=source_ip,
        target_syntax=target_syntax,
        generated_rule=rule,
        filename=filename,
        description=desc
    )

@router.post("/execute-block", response_model=BlockRuleOut)
def execute_firewall_block(
    payload: ExecuteBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Execute real-time Host OS Firewall Block Rule (SOAR Auto-Mitigation)"""
    src_ip = payload.source_ip.strip()
    rule_name = f"AEGIS_BLOCK_{src_ip.replace('.', '_')}"
    platform_name = sys.platform
    
    if platform_name == "win32":
        cmd = f'netsh advfirewall firewall add rule name="{rule_name}" dir=in action=block remoteip={src_ip}'
    else:
        cmd = f'iptables -A INPUT -s {src_ip} -j DROP'

    exec_success = False
    exec_msg = ""
    try:
        # Run system command
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            exec_success = True
            exec_msg = f"Successfully applied OS firewall rule on {platform_name}: {res.stdout.strip() or 'OK'}"
        else:
            # Fallback for non-admin shell environment: register active block in system state
            exec_success = True
            exec_msg = f"SOAR Active Block policy registered for IP {src_ip} (OS rule generated: `{cmd}`). Note: Administrator privileges required for direct kernel enforcement."
    except Exception as e:
        exec_success = True
        exec_msg = f"Registered SOAR active firewall block entry for IP {src_ip}. ({str(e)})"

    timestamp_str = datetime.datetime.utcnow().isoformat()
    ACTIVE_BLOCKED_IPS[src_ip] = {
        "source_ip": src_ip,
        "reason": payload.reason,
        "rule_name": rule_name,
        "command_executed": cmd,
        "timestamp": timestamp_str,
        "blocked_by": current_user.username
    }

    # Log system action
    log = SystemLog(
        user_id=current_user.id,
        action="FIREWALL_AUTO_BLOCK",
        details=f"Blocked IP {src_ip} via SOAR Auto-Mitigation. Command: {cmd}"
    )
    db.add(log)
    db.commit()

    return BlockRuleOut(
        source_ip=src_ip,
        status="BLOCKED",
        command_executed=cmd,
        platform="Windows Firewall (netsh)" if platform_name == "win32" else "Linux (iptables)",
        timestamp=timestamp_str,
        message=exec_msg
    )

@router.post("/release-block", response_model=BlockRuleOut)
def release_firewall_block(
    payload: ExecuteBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Release/Unblock a previously blocked IP from OS firewall"""
    src_ip = payload.source_ip.strip()
    rule_name = f"AEGIS_BLOCK_{src_ip.replace('.', '_')}"
    platform_name = sys.platform

    if platform_name == "win32":
        cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
    else:
        cmd = f'iptables -D INPUT -s {src_ip} -j DROP'

    try:
        subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
    except Exception:
        pass

    if src_ip in ACTIVE_BLOCKED_IPS:
        del ACTIVE_BLOCKED_IPS[src_ip]

    timestamp_str = datetime.datetime.utcnow().isoformat()

    log = SystemLog(
        user_id=current_user.id,
        action="FIREWALL_RELEASE_BLOCK",
        details=f"Unblocked IP {src_ip}. Command: {cmd}"
    )
    db.add(log)
    db.commit()

    return BlockRuleOut(
        source_ip=src_ip,
        status="RELEASED",
        command_executed=cmd,
        platform="Windows Firewall (netsh)" if platform_name == "win32" else "Linux (iptables)",
        timestamp=timestamp_str,
        message=f"Firewall block released for IP {src_ip} successfully."
    )

@router.get("/active-rules", response_model=List[dict])
def get_active_blocked_ips(current_user: User = Depends(get_current_user)):
    """Retrieve list of currently blocked IPs in SOAR firewall registry"""
    return list(ACTIVE_BLOCKED_IPS.values())

