import random
import datetime
from typing import Dict, Any

INTERNAL_IPS = ["192.168.1.102", "192.168.1.105", "192.168.1.110", "10.0.0.15", "10.0.0.42", "172.16.0.8"]
EXTERNAL_TARGETS = ["10.0.0.1", "10.0.0.5", "172.16.1.100", "192.168.1.1", "10.0.0.254"]
ATTACKER_IPS = ["185.220.101.5", "45.142.214.12", "193.142.146.210", "91.240.118.172", "141.98.11.89", "198.51.100.44"]

ATTACK_TYPES = ["BENIGN", "DoS/DDoS", "Port Scan", "Brute Force", "Botnet", "Web Attack", "Infiltration"]

def generate_random_flow() -> Dict[str, Any]:
    attack_category = random.choices(
        ATTACK_TYPES,
        weights=[0.60, 0.12, 0.12, 0.08, 0.04, 0.03, 0.01],
        k=1
    )[0]
    
    if attack_category == "BENIGN":
        src_ip = random.choice(INTERNAL_IPS)
        dst_ip = random.choice(EXTERNAL_TARGETS)
        src_port = random.randint(1024, 65000)
        dst_port = random.choice([80, 443, 53, 22, 8080])
        protocol = random.choice(["TCP", "UDP", "HTTPS"])
        pkt_cnt = random.randint(5, 250)
        byte_cnt = pkt_cnt * random.randint(200, 1400)
        duration = round(random.uniform(0.1, 15.0), 3)
    elif attack_category == "DoS/DDoS":
        src_ip = random.choice(ATTACKER_IPS)
        dst_ip = random.choice(EXTERNAL_TARGETS)
        src_port = random.randint(1024, 65000)
        dst_port = random.choice([80, 443])
        protocol = "TCP"
        pkt_cnt = random.randint(5000, 45000)
        byte_cnt = pkt_cnt * random.randint(64, 250)
        duration = round(random.uniform(0.01, 1.5), 3)
    elif attack_category == "Port Scan":
        src_ip = random.choice(ATTACKER_IPS)
        dst_ip = random.choice(EXTERNAL_TARGETS)
        src_port = random.randint(40000, 65000)
        dst_port = random.randint(1, 1024)
        protocol = "TCP"
        pkt_cnt = random.randint(1, 3)
        byte_cnt = pkt_cnt * 60
        duration = round(random.uniform(0.001, 0.05), 3)
    elif attack_category == "Brute Force":
        src_ip = random.choice(ATTACKER_IPS)
        dst_ip = random.choice(EXTERNAL_TARGETS)
        src_port = random.randint(1024, 65000)
        dst_port = random.choice([22, 21, 3389])
        protocol = "TCP"
        pkt_cnt = random.randint(20, 100)
        byte_cnt = pkt_cnt * random.randint(100, 400)
        duration = round(random.uniform(0.5, 3.5), 3)
    else:  # Botnet / Web Attack / Infiltration
        src_ip = random.choice(ATTACKER_IPS)
        dst_ip = random.choice(INTERNAL_IPS)
        src_port = random.randint(1024, 65000)
        dst_port = random.choice([80, 443, 8080, 6667])
        protocol = "TCP"
        pkt_cnt = random.randint(40, 300)
        byte_cnt = pkt_cnt * random.randint(300, 1200)
        duration = round(random.uniform(1.0, 20.0), 3)
        
    rate = round(byte_cnt / max(0.001, duration), 2)
    
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "source_port": src_port,
        "destination_port": dst_port,
        "protocol": protocol,
        "packet_count": pkt_cnt,
        "byte_count": byte_cnt,
        "duration": duration,
        "rate": rate,
        "syn_flag": 1 if attack_category in ["DoS/DDoS", "Port Scan"] else 0,
        "ack_flag": 0 if attack_category in ["DoS/DDoS"] else 1,
        "fin_flag": 0
    }
