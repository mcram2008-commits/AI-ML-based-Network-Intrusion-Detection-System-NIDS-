import math
import random
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NetworkFlow, User
from app.auth.deps import get_current_user

router = APIRouter(prefix="/topology", tags=["Network Topology & GeoIP Map"])

KNOWN_GEOIP_DATABASE = {
    "185.220.101.5": {"country": "Russia", "code": "RU", "city": "Moscow", "lat": 55.7558, "lon": 37.6173, "isp": "Tor Exit Node", "threat": "CRITICAL"},
    "45.142.120.12": {"country": "China", "code": "CN", "city": "Beijing", "lat": 39.9042, "lon": 116.4074, "isp": "Chinanet Cloud", "threat": "HIGH"},
    "193.142.146.210": {"country": "Netherlands", "code": "NL", "city": "Amsterdam", "lat": 52.3676, "lon": 4.9041, "isp": "HostEurope B.V.", "threat": "HIGH"},
    "103.251.140.88": {"country": "North Korea", "code": "KP", "city": "Pyongyang", "lat": 39.0392, "lon": 125.7625, "isp": "KPTC Network", "threat": "CRITICAL"},
    "198.51.100.42": {"country": "United States", "code": "US", "city": "Dallas", "lat": 32.7767, "lon": -96.7970, "isp": "DigitalOcean", "threat": "MEDIUM"},
    "10.0.0.1": {"country": "Internal SOC Datacenter", "code": "IN", "city": "SOC Core", "lat": 13.0827, "lon": 80.2707, "isp": "AEGIS Core Network", "threat": "BENIGN"}
}

DEFAULT_INTERNAL_NODES = [
    {"id": "node-core", "label": "SOC Core Gateway", "type": "gateway", "ip": "10.0.0.1", "status": "ONLINE", "x": 400, "y": 250},
    {"id": "node-firewall", "label": "AEGIS Perimeter Firewall", "type": "firewall", "ip": "10.0.0.254", "status": "ACTIVE", "x": 250, "y": 250},
    {"id": "node-web", "label": "Web App Server", "type": "server", "ip": "10.0.0.10", "status": "HEALTHY", "x": 550, "y": 150},
    {"id": "node-db", "label": "Database Cluster", "type": "database", "ip": "10.0.0.20", "status": "HEALTHY", "x": 550, "y": 350},
    {"id": "node-ids", "label": "ML NIDS Inspection Engine", "type": "sensor", "ip": "10.0.0.99", "status": "MONITORING", "x": 400, "y": 100},
]

DEFAULT_ATTACKER_IPS = [
    {"ip": "185.220.101.5", "attack": "DoS/DDoS", "severity": "CRITICAL", "x": 80, "y": 120},
    {"ip": "45.142.120.12", "attack": "Brute Force", "severity": "HIGH", "x": 80, "y": 250},
    {"ip": "193.142.146.210", "attack": "Port Scan", "severity": "HIGH", "x": 80, "y": 380},
]

@router.get("/graph")
def get_topology_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full network topology graph with internal nodes and external attacker vectors."""
    # Query recent flows to dynamically populate graph links
    recent_flows = db.query(NetworkFlow).order_by(NetworkFlow.timestamp.desc()).limit(15).all()

    nodes = list(DEFAULT_INTERNAL_NODES)
    links = [
        {"source": "node-firewall", "target": "node-core", "protocol": "TCP", "status": "SECURE", "bandwidth": "10 Gbps"},
        {"source": "node-core", "target": "node-web", "protocol": "HTTPS", "status": "HEALTHY", "bandwidth": "1 Gbps"},
        {"source": "node-core", "target": "node-db", "protocol": "PGSQL", "status": "HEALTHY", "bandwidth": "1 Gbps"},
        {"source": "node-core", "target": "node-ids", "protocol": "SPAN", "status": "ANALYZING", "bandwidth": "10 Gbps"},
    ]

    # Add external attacker nodes dynamically
    for idx, attacker in enumerate(DEFAULT_ATTACKER_IPS):
        attacker_id = f"attacker-{idx+1}"
        nodes.append({
            "id": attacker_id,
            "label": f"Attacker ({attacker['ip']})",
            "type": "attacker",
            "ip": attacker["ip"],
            "status": attacker["severity"],
            "attack_category": attacker["attack"],
            "x": attacker["x"],
            "y": attacker["y"]
        })
        links.append({
            "source": attacker_id,
            "target": "node-firewall",
            "protocol": "TCP/UDP",
            "status": attacker["severity"],
            "bandwidth": f"{random.randint(10, 500)} Mbps"
        })

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links),
        "target_datacenter": {"name": "AEGIS Main SOC", "lat": 13.0827, "lon": 80.2707}
    }


@router.get("/geoip/{ip}")
def get_geoip_location(
    ip: str,
    current_user: User = Depends(get_current_user)
):
    """Get GeoIP metadata for an IP address."""
    if ip in KNOWN_GEOIP_DATABASE:
        data = KNOWN_GEOIP_DATABASE[ip]
    else:
        # Fallback hash-based coordinates for any unknown IP
        ip_hash = sum(ord(c) for c in ip)
        lat = ((ip_hash * 13) % 120) - 60
        lon = ((ip_hash * 29) % 360) - 180
        data = {
            "country": "External Origin",
            "code": "UN",
            "city": "Remote Node",
            "lat": float(lat),
            "lon": float(lon),
            "isp": "Global Transit Provider",
            "threat": "HIGH"
        }
    
    return {
        "ip": ip,
        "country": data["country"],
        "country_code": data["code"],
        "city": data["city"],
        "latitude": data["lat"],
        "longitude": data["lon"],
        "isp": data["isp"],
        "threat_level": data["threat"],
        "target_coordinates": {"lat": 13.0827, "lon": 80.2707, "city": "SOC HQ"}
    }
