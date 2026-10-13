import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

# Standard NIDS features extracted from raw flow metric dictionaries or dataframes
FEATURE_NAMES = [
    "source_port",
    "destination_port",
    "protocol_num",
    "packet_count",
    "byte_count",
    "duration",
    "rate",
    "avg_packet_size",
    "syn_flag",
    "ack_flag",
    "fin_flag"
]

PROTOCOL_MAP = {
    "TCP": 6,
    "UDP": 17,
    "ICMP": 1,
    "HTTP": 6,
    "HTTPS": 6,
    "DNS": 17
}

def extract_features_from_dict(flow_data: Dict) -> np.ndarray:
    """
    Extracts a 1D numpy feature vector from flow dictionary.
    """
    src_port = float(flow_data.get("source_port", 80))
    dst_port = float(flow_data.get("destination_port", 80))
    protocol_str = str(flow_data.get("protocol", "TCP")).upper()
    proto_num = float(PROTOCOL_MAP.get(protocol_str, 6))
    
    pkt_cnt = float(flow_data.get("packet_count", 10))
    byte_cnt = float(flow_data.get("byte_count", 1000))
    dur = float(flow_data.get("duration", 1.0))
    if dur <= 0:
        dur = 0.001
        
    rate = float(flow_data.get("rate", byte_cnt / dur))
    avg_pkt_size = byte_cnt / max(1.0, pkt_cnt)
    
    syn_flag = float(flow_data.get("syn_flag", 1 if dst_port in [80, 443, 22] else 0))
    ack_flag = float(flow_data.get("ack_flag", 1))
    fin_flag = float(flow_data.get("fin_flag", 0))
    
    vec = [
        src_port,
        dst_port,
        proto_num,
        pkt_cnt,
        byte_cnt,
        dur,
        rate,
        avg_pkt_size,
        syn_flag,
        ack_flag,
        fin_flag
    ]
    return pd.DataFrame([vec], columns=FEATURE_NAMES)

def extract_features_from_batch(flows: List[Dict]) -> pd.DataFrame:
    """
    Extracts a pandas DataFrame feature matrix (N, num_features) with column names from a list of flow dictionaries.
    """
    rows = []
    for flow in flows:
        src_port = float(flow.get("source_port", 80))
        dst_port = float(flow.get("destination_port", 80))
        protocol_str = str(flow.get("protocol", "TCP")).upper()
        proto_num = float(PROTOCOL_MAP.get(protocol_str, 6))
        
        pkt_cnt = float(flow.get("packet_count", 10))
        byte_cnt = float(flow.get("byte_count", 1000))
        dur = float(flow.get("duration", 1.0))
        if dur <= 0:
            dur = 0.001
            
        rate = float(flow.get("rate", byte_cnt / dur))
        avg_pkt_size = byte_cnt / max(1.0, pkt_cnt)
        
        syn_flag = float(flow.get("syn_flag", 1 if dst_port in [80, 443, 22] else 0))
        ack_flag = float(flow.get("ack_flag", 1))
        fin_flag = float(flow.get("fin_flag", 0))
        
        rows.append([
            src_port, dst_port, proto_num, pkt_cnt, byte_cnt,
            dur, rate, avg_pkt_size, syn_flag, ack_flag, fin_flag
        ])
    return pd.DataFrame(rows, columns=FEATURE_NAMES)



def preprocess_df(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Preprocesses uploaded CSV dataset (CICIDS2017/UNSW-NB15/Generic).
    """
    df = df.copy()
    
    # Strip whitespace from columns
    df.columns = [str(c).strip() for c in df.columns]
    
    # Identify target label column
    label_col = None
    possible_labels = ["Label", "label", "Attack", "attack", "Category", "category", "class", "Class", "attack_cat"]
    for col in possible_labels:
        if col in df.columns:
            label_col = col
            break
            
    if not label_col:
        # Fallback: assume last column is label
        label_col = df.columns[-1]
        
    # Clean string encoding in labels
    df[label_col] = df[label_col].astype(str).str.replace(r'[^\x00-\x7F]+', ' ', regex=True).str.strip()

    # Map attack labels to standardized enterprise NIDS categories
    UNSW_NUM_MAP = {
        "0": "BENIGN", "0.0": "BENIGN",
        "1": "Analysis", "1.0": "Analysis",
        "2": "Backdoor", "2.0": "Backdoor",
        "3": "DoS", "3.0": "DoS",
        "4": "Exploits", "4.0": "Exploits",
        "5": "Fuzzers", "5.0": "Fuzzers",
        "6": "Generic", "6.0": "Generic",
        "7": "Reconnaissance", "7.0": "Reconnaissance",
        "8": "Shellcode", "8.0": "Shellcode",
        "9": "Worms", "9.0": "Worms"
    }

    def map_attack_label(val: str) -> str:
        v = str(val).strip()
        if v in UNSW_NUM_MAP:
            return UNSW_NUM_MAP[v]
        u = v.upper()
        if u in ["BENIGN", "NORMAL"]:
            return "BENIGN"
        if "DDOS" in u or "DOS" in u:
            return "DoS/DDoS"
        if "PORTSCAN" in u or "PORT SCAN" in u:
            return "Port Scan"
        if "PATATOR" in u or "BRUTE" in u:
            return "Brute Force"
        if "WEB ATTACK" in u:
            return "Web Attack"
        if "BOT" in u:
            return "Botnet"
        if "INFILTRATION" in u or "INFILTERATION" in u:
            return "Infiltration"
        return v

    df[label_col] = df[label_col].apply(map_attack_label)

    # Check for CICIDS2017 / CICFlowMeter flow attributes to align with real-time detection pipeline
    lower_map = {c.lower(): c for c in df.columns}
    is_cicids = ("destination port" in lower_map or "dest port" in lower_map or "dst port" in lower_map) and "flow duration" in lower_map

    if is_cicids:
        dp_col = lower_map.get("destination port", lower_map.get("dest port", lower_map.get("dst port")))
        dur_col = lower_map["flow duration"]
        
        # Packet counts
        fwd_pkts_col = lower_map.get("total fwd packets", lower_map.get("total fwd packet"))
        fwd_pkts = df[fwd_pkts_col] if fwd_pkts_col else 5
        bwd_pkts = df[lower_map.get("total backward packets", lower_map.get("total bwd packets"))] if ("total backward packets" in lower_map or "total bwd packets" in lower_map) else 5
        pkt_cnt = pd.to_numeric(fwd_pkts, errors="coerce").fillna(5) + pd.to_numeric(bwd_pkts, errors="coerce").fillna(5)

        # Byte counts
        fwd_bytes = df[lower_map.get("total length of fwd packets", lower_map.get("total length of fwd packet"))] if ("total length of fwd packets" in lower_map or "total length of fwd packet" in lower_map) else 500
        bwd_bytes = df[lower_map.get("total length of bwd packets", lower_map.get("total length of bwd packet"))] if ("total length of bwd packets" in lower_map or "total length of bwd packet" in lower_map) else 500
        byte_cnt = pd.to_numeric(fwd_bytes, errors="coerce").fillna(500) + pd.to_numeric(bwd_bytes, errors="coerce").fillna(500)

        # Flow duration in seconds
        dur_raw = pd.to_numeric(df[dur_col], errors="coerce").fillna(1000)
        dur_sec = np.maximum(dur_raw / 1e6, 0.001)

        # Rate
        rate_val = np.nan_to_num(byte_cnt / dur_sec, nan=0.0, posinf=1e8, neginf=0.0)

        # Avg packet size
        if "average packet size" in lower_map:
            avg_pkt = pd.to_numeric(df[lower_map["average packet size"]], errors="coerce").fillna(byte_cnt / np.maximum(pkt_cnt, 1))
        else:
            avg_pkt = byte_cnt / np.maximum(pkt_cnt, 1)

        # TCP flags
        syn = pd.to_numeric(df[lower_map["syn flag count"]], errors="coerce").fillna(0) if "syn flag count" in lower_map else 0
        ack = pd.to_numeric(df[lower_map["ack flag count"]], errors="coerce").fillna(1) if "ack flag count" in lower_map else 1
        fin = pd.to_numeric(df[lower_map["fin flag count"]], errors="coerce").fillna(0) if "fin flag count" in lower_map else 0

        dest_ports = pd.to_numeric(df[dp_col], errors="coerce").fillna(80)

        # Source port
        sp_col = lower_map.get("source port", lower_map.get("src port"))
        if sp_col:
            src_ports = pd.to_numeric(df[sp_col], errors="coerce").fillna(pd.Series(np.random.randint(1024, 65000, size=len(df)), index=df.index))
        else:
            src_ports = pd.Series(np.random.randint(1024, 65000, size=len(df)), index=df.index)

        # Protocol
        proto_col = lower_map.get("protocol", lower_map.get("protocol_num"))
        proto_vals = pd.to_numeric(df[proto_col], errors="coerce").fillna(6.0) if proto_col else 6.0

        X = pd.DataFrame({
            "source_port": src_ports,
            "destination_port": dest_ports,
            "protocol_num": proto_vals,
            "packet_count": pkt_cnt,
            "byte_count": byte_cnt,
            "duration": dur_sec,
            "rate": rate_val,
            "avg_packet_size": avg_pkt,
            "syn_flag": syn,
            "ack_flag": ack,
            "fin_flag": fin
        })
    else:
        # Generic dataset: use all numeric features
        X = df.drop(columns=[label_col])
        X = X.select_dtypes(include=[np.number])
        if X.shape[1] == 0:
            X = pd.get_dummies(df.drop(columns=[label_col]))

    # Clean NaNs and infs
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    y = df[label_col]

    # Balanced / stratified sampling if dataset is huge (> 15000 rows) for optimal training performance
    if len(df) > 15000:
        try:
            df_combined = X.copy()
            df_combined["__target_label__"] = y
            n_per_class = max(1500, int(15000 / max(1, len(df_combined["__target_label__"].unique()))))
            sampled_df = df_combined.groupby("__target_label__", group_keys=False).apply(
                lambda grp: grp.sample(n=min(len(grp), n_per_class), random_state=42)
            ).sample(frac=1.0, random_state=42)
            y = sampled_df["__target_label__"]
            X = sampled_df.drop(columns=["__target_label__"])
        except Exception:
            idx = np.random.RandomState(42).choice(len(X), size=min(15000, len(X)), replace=False)
            X = X.iloc[idx].reset_index(drop=True)
            y = y.iloc[idx].reset_index(drop=True)

    return X, y, list(X.columns)

