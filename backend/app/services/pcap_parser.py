import os
import time
from typing import Dict, Any, List
from collections import defaultdict
from scapy.all import rdpcap, PcapReader, IP, TCP, UDP, ICMP, DNS, Raw, wrpcap
from app.ml.predictor import predict_batch_flows

def parse_pcap_file(filepath: str, max_packets: int = 10000, model_filepath: str = None) -> Dict[str, Any]:
    """
    Parses Wireshark PCAP / PCAPNG packet capture file, reconstructs 5-tuple IP network flows,
    and classifies all flows using the active NIDS machine learning detection engine.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"PCAP file not found: {filepath}")

    file_size_bytes = os.path.getsize(filepath)
    file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
    filename = os.path.basename(filepath)

    packets_read = 0
    start_time = None
    end_time = None
    protocol_counts = defaultdict(int)
    flow_map = defaultdict(lambda: {
        "packets": 0,
        "bytes": 0,
        "first_seen": None,
        "last_seen": None,
        "syn_count": 0,
        "ack_count": 0,
        "fin_count": 0
    })

    try:
        # Use PcapReader for memory efficiency
        with PcapReader(filepath) as pcap_reader:
            for pkt in pcap_reader:
                packets_read += 1
                pkt_time = float(pkt.time) if hasattr(pkt, "time") else time.time()
                if start_time is None or pkt_time < start_time:
                    start_time = pkt_time
                if end_time is None or pkt_time > end_time:
                    end_time = pkt_time

                if IP in pkt:
                    ip_pkt = pkt[IP]
                    src_ip = str(ip_pkt.src)
                    dst_ip = str(ip_pkt.dst)
                    pkt_len = len(pkt)

                    if TCP in pkt:
                        tcp_pkt = pkt[TCP]
                        src_port = int(tcp_pkt.sport)
                        dst_port = int(tcp_pkt.dport)
                        proto = "TCP"
                        protocol_counts["TCP"] += 1
                        flags = tcp_pkt.flags
                        has_syn = 1 if flags & 0x02 else 0
                        has_ack = 1 if flags & 0x10 else 0
                        has_fin = 1 if flags & 0x01 else 0
                    elif UDP in pkt:
                        udp_pkt = pkt[UDP]
                        src_port = int(udp_pkt.sport)
                        dst_port = int(udp_pkt.dport)
                        proto = "UDP"
                        if DNS in pkt or src_port == 53 or dst_port == 53:
                            protocol_counts["DNS"] += 1
                        else:
                            protocol_counts["UDP"] += 1
                        has_syn, has_ack, has_fin = 0, 1, 0
                    elif ICMP in pkt:
                        src_port = 0
                        dst_port = 0
                        proto = "ICMP"
                        protocol_counts["ICMP"] += 1
                        has_syn, has_ack, has_fin = 0, 0, 0
                    else:
                        src_port = 0
                        dst_port = 0
                        proto = "OTHER"
                        protocol_counts["OTHER"] += 1
                        has_syn, has_ack, has_fin = 0, 0, 0

                    flow_key = (src_ip, dst_ip, src_port, dst_port, proto)
                    fdata = flow_map[flow_key]
                    fdata["packets"] += 1
                    fdata["bytes"] += pkt_len
                    if fdata["first_seen"] is None or pkt_time < fdata["first_seen"]:
                        fdata["first_seen"] = pkt_time
                    if fdata["last_seen"] is None or pkt_time > fdata["last_seen"]:
                        fdata["last_seen"] = pkt_time
                    fdata["syn_count"] += has_syn
                    fdata["ack_count"] += has_ack
                    fdata["fin_count"] += has_fin

                if packets_read >= max_packets:
                    break

    except Exception as e:
        print(f"[PCAP Parser] Read notice: {e}")

    # Reconstruct flow records
    reconstructed_flows: List[Dict[str, Any]] = []
    total_duration = max(0.1, (end_time - start_time)) if (start_time and end_time) else 1.0

    for (src_ip, dst_ip, src_port, dst_port, proto), fdata in flow_map.items():
        dur = max(0.001, (fdata["last_seen"] - fdata["first_seen"])) if (fdata["first_seen"] and fdata["last_seen"]) else 0.01
        pkt_cnt = fdata["packets"]
        byte_cnt = fdata["bytes"]
        rate = round(byte_cnt / max(0.001, dur), 1)

        reconstructed_flows.append({
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "source_port": src_port,
            "destination_port": dst_port,
            "protocol": proto,
            "packet_count": pkt_cnt,
            "byte_count": byte_cnt,
            "duration": round(dur, 3),
            "rate": rate,
            "syn_flag": 1 if fdata["syn_count"] > 0 else 0,
            "ack_flag": 1 if fdata["ack_count"] > 0 else 0,
            "fin_flag": 1 if fdata["fin_count"] > 0 else 0,
            "is_simulated": False
        })

    # Sort flows by volume descending
    reconstructed_flows.sort(key=lambda x: x["byte_count"], reverse=True)

    # Classify all extracted flows using ML model
    predictions = predict_batch_flows(reconstructed_flows, model_filepath=model_filepath)

    # Combine flow data with predictions
    attack_counts = defaultdict(int)
    normal_count = 0
    malicious_count = 0
    top_sources = defaultdict(lambda: {"attacks": 0, "total": 0, "bytes": 0})
    analyzed_flows = []

    for idx, f in enumerate(reconstructed_flows):
        pred = predictions[idx] if idx < len(predictions) else {"prediction": "Normal", "attack_category": "BENIGN", "confidence": 95.0, "threat_severity": "LOW"}
        is_attack = pred["prediction"] == "Malicious"
        if is_attack:
            malicious_count += 1
            attack_counts[pred["attack_category"]] += 1
            top_sources[f["source_ip"]]["attacks"] += 1
        else:
            normal_count += 1
            attack_counts["Normal"] += 1

        top_sources[f["source_ip"]]["total"] += 1
        top_sources[f["source_ip"]]["bytes"] += f["byte_count"]

        analyzed_flows.append({
            "id": idx + 1,
            **f,
            **pred
        })

    # Top talkers / threat sources
    source_stats = [
        {"ip": ip, "total_flows": d["total"], "attack_flows": d["attacks"], "total_bytes": d["bytes"], "is_attacker": d["attacks"] > 0}
        for ip, d in top_sources.items()
    ]
    source_stats.sort(key=lambda x: x["attack_flows"], reverse=True)

    return {
        "pcap_metadata": {
            "filename": filename,
            "file_size_mb": file_size_mb,
            "total_packets": packets_read,
            "total_flows": len(reconstructed_flows),
            "capture_duration_sec": round(total_duration, 2),
            "protocols": dict(protocol_counts)
        },
        "threat_summary": {
            "total_flows": len(reconstructed_flows),
            "normal_count": normal_count,
            "malicious_count": malicious_count,
            "threat_ratio_pct": round((malicious_count / max(1, len(reconstructed_flows))) * 100, 1),
            "attack_breakdown": dict(attack_counts)
        },
        "top_attackers": [s for s in source_stats if s["is_attacker"]][:5],
        "flows": analyzed_flows[:150]  # Return top 150 flows for snappy rendering
    }


def create_sample_attack_pcap(filepath: str) -> str:
    """
    Generates a realistic synthetic Wireshark PCAP capture containing:
    1. SYN Flood DoS attack traffic
    2. Vertical Port Scan probe packets
    3. Normal HTTP/HTTPS web sessions
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    pkts = []
    base_t = time.time() - 60

    # 1. Normal Web traffic (Client -> Web Server)
    for i in range(15):
        t = base_t + (i * 0.4)
        pkts.append(IP(src="192.168.1.10", dst="10.0.0.1")/TCP(sport=51200+i, dport=443, flags="S"))
        pkts.append(IP(src="10.0.0.1", dst="192.168.1.10")/TCP(sport=443, dport=51200+i, flags="SA"))
        pkts.append(IP(src="192.168.1.10", dst="10.0.0.1")/TCP(sport=51200+i, dport=443, flags="A")/Raw(load="GET /index.html HTTP/1.1\r\n\r\n"))

    # 2. Port Scan from Attacker IP (185.220.101.5)
    scan_ports = [21, 22, 23, 25, 80, 110, 139, 443, 445, 1433, 3306, 3389, 8080]
    for p in scan_ports:
        base_t += 0.05
        pkts.append(IP(src="185.220.101.5", dst="10.0.0.1")/TCP(sport=49821, dport=p, flags="S"))

    # 3. SYN Flood DoS Attack from Botnet IP (45.33.32.156)
    for i in range(80):
        base_t += 0.01
        pkts.append(IP(src="45.33.32.156", dst="10.0.0.1")/TCP(sport=10000+i, dport=80, flags="S"))

    wrpcap(filepath, pkts)
    return filepath
