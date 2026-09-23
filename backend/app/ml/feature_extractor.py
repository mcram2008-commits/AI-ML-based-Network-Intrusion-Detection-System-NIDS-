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
        
    # Replace Infinity / NaN values
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna()
    
    y = df[label_col].astype(str)
    X = df.drop(columns=[label_col])
    
    # Select numeric columns
    X = X.select_dtypes(include=[np.number])
    
    # If no numeric columns found, encode string columns
    if X.shape[1] == 0:
        X = pd.get_dummies(df.drop(columns=[label_col]))
        
    return X, y, list(X.columns)
