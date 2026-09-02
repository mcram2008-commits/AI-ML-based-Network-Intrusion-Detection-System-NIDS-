from fastapi import APIRouter, Depends, Query
from app.schemas import FirewallRuleResponse
from app.models import User
from app.auth.deps import get_current_user

router = APIRouter(prefix="/firewall", tags=["Firewall Rules"])

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
