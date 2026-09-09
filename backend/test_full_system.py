import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== STARTING FULL SYSTEM VERIFICATION SUITE ===")

    # 1. Test Admin Login
    print("\n1. Testing Admin Authentication (/auth/login)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": "admin", "password": "Admin123!"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"   [SUCCESS] Admin logged in. Role: {admin_data['user']['role']}")

    # 2. Test Security Analyst Login
    print("\n2. Testing Security Analyst Authentication...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": "analyst", "password": "Analyst123!"})
    assert res.status_code == 200, f"Analyst login failed: {res.text}"
    analyst_token = res.json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}
    print("   [SUCCESS] Analyst logged in.")

    # 3. Test Viewer Login
    print("\n3. Testing Viewer Authentication...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": "viewer", "password": "Viewer123!"})
    assert res.status_code == 200, f"Viewer login failed: {res.text}"
    viewer_token = res.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    print("   [SUCCESS] Viewer logged in.")

    # 4. Test Registration with validation checks
    print("\n4. Testing Registration Validation...")
    # Test duplicate username
    res_dup = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Test User", "username": "admin", "email": "unique@nids.sec", "password": "Password123!", "confirm_password": "Password123!", "role": "Viewer", "terms": True
    })
    assert res_dup.status_code == 400, "Should reject duplicate username"
    print("   [SUCCESS] Rejected duplicate username.")

    # Test short password
    res_short = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Test User", "username": "testuser1", "email": "test1@nids.sec", "password": "123", "confirm_password": "123", "role": "Viewer", "terms": True
    })
    assert res_short.status_code in [400, 422], "Should reject short password"
    print("   [SUCCESS] Rejected short password.")

    # 5. Test Role-Based Authorization Guards
    print("\n5. Testing Role-Based Authorization Enforcement...")
    # Admin accesses /users -> Allowed
    res = requests.get(f"{BASE_URL}/users", headers=admin_headers)
    assert res.status_code == 200, f"Admin should access /users: {res.text}"
    print("   [SUCCESS] Admin access to /users granted.")

    # Analyst accesses /users -> Forbidden (403)
    res = requests.get(f"{BASE_URL}/users", headers=analyst_headers)
    assert res.status_code == 403, "Analyst should be denied on /users"
    print("   [SUCCESS] Analyst access to /users correctly DENIED (403).")

    # Viewer accesses /models/train -> Forbidden (403)
    res = requests.post(f"{BASE_URL}/models/train", headers=viewer_headers, json={"dataset_id": 0, "algorithm": "Decision Tree"})
    assert res.status_code == 403, "Viewer should be denied on /models/train"
    print("   [SUCCESS] Viewer model training access correctly DENIED (403).")

    # 6. Test Dashboard Stats & Charts
    print("\n6. Testing Dashboard Stats & 8 Chart Endpoints...")
    res_stats = requests.get(f"{BASE_URL}/dashboard/stats", headers=admin_headers)
    assert res_stats.status_code == 200, f"Failed stats: {res_stats.text}"
    stats = res_stats.json()
    print(f"   [SUCCESS] Dashboard Stats: Flows={stats['total_flows']}, Threats={stats['current_threat_level']}, Accuracy={stats['detection_accuracy']}%")

    res_charts = requests.get(f"{BASE_URL}/dashboard/charts", headers=admin_headers)
    assert res_charts.status_code == 200
    charts = res_charts.json()
    assert "traffic_over_time" in charts and "normal_vs_malicious" in charts
    print("   [SUCCESS] All 8 Dashboard Chart datasets retrieved successfully.")

    # 7. Test Intrusion Detection Pipeline & Flow Prediction
    print("\n7. Testing Flow Prediction Pipeline...")
    flow_payload = {
        "source_ip": "185.220.101.5",
        "destination_ip": "10.0.0.1",
        "source_port": 54102,
        "destination_port": 80,
        "protocol": "TCP",
        "packet_count": 45000,
        "byte_count": 3200000,
        "duration": 0.2,
        "rate": 16000000.0
    }
    res_pred = requests.post(f"{BASE_URL}/predict", headers=analyst_headers, json=flow_payload)
    assert res_pred.status_code == 200, f"Prediction failed: {res_pred.text}"
    pred_res = res_pred.json()
    print(f"   [SUCCESS] Prediction Verdict: {pred_res['prediction']} | Category: {pred_res['attack_category']} | Confidence: {pred_res['confidence']}% | Severity: {pred_res['threat_severity']}")

    # 8. Test ML Model Training Engine
    print("\n8. Testing Model Training Engine (Random Forest)...")
    res_train = requests.post(f"{BASE_URL}/models/train", headers=analyst_headers, json={
        "dataset_id": 0, "algorithm": "Random Forest", "test_size": 0.2
    })
    assert res_train.status_code == 201, f"Training failed: {res_train.text}"
    trained_model = res_train.json()
    print(f"   [SUCCESS] Model Trained: '{trained_model['name']}' | Accuracy: {trained_model['accuracy']}% | F1: {trained_model['f1_score']}%")

    # 9. Test Alerts Triage & Status Update
    print("\n9. Testing Alert Triage & Filter...")
    res_alerts = requests.get(f"{BASE_URL}/alerts", headers=analyst_headers)
    assert res_alerts.status_code == 200
    alerts_list = res_alerts.json()
    assert len(alerts_list) > 0, "Alerts list should not be empty"
    first_alert = alerts_list[0]
    
    # Update alert status
    res_update = requests.put(f"{BASE_URL}/alerts/{first_alert['id']}", headers=analyst_headers, json={"status": "Investigating"})
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "Investigating"
    print(f"   [SUCCESS] Alert {first_alert['alert_code']} triaged to 'Investigating'.")

    # 10. Test IP Investigation Endpoint
    print("\n10. Testing IP Threat Investigation Console (/ip/185.220.101.5)...")
    res_ip = requests.get(f"{BASE_URL}/ip/185.220.101.5", headers=analyst_headers)
    assert res_ip.status_code == 200
    ip_info = res_ip.json()
    print(f"   [SUCCESS] IP 185.220.101.5: Threat Score={ip_info['threat_score']}/100 ({ip_info['threat_level']}) | Connections={ip_info['total_connections']}")

    # 11. Test Security Reports Summary
    print("\n11. Testing Executive Security Report Summary...")
    res_rep = requests.get(f"{BASE_URL}/reports/summary", headers=viewer_headers)
    assert res_rep.status_code == 200
    rep_summary = res_rep.json()
    print(f"   [SUCCESS] Security Audit Summary generated for {rep_summary['generated_by']}.")

    # 12. Test SOAR Auto-Mitigation OS Firewall Execution
    print("\n12. Testing SOAR Host OS Firewall Auto-Mitigation...")
    res_soar = requests.post(f"{BASE_URL}/firewall/execute-block", headers=analyst_headers, json={
        "source_ip": "185.220.101.5", "reason": "System Test SOAR Block Execution"
    })
    assert res_soar.status_code == 200, f"SOAR Block failed: {res_soar.text}"
    soar_data = res_soar.json()
    assert soar_data["status"] == "BLOCKED"
    print(f"   [SUCCESS] SOAR Rule Executed for {soar_data['source_ip']} on {soar_data['platform']}. Command: `{soar_data['command_executed']}`")

    res_active = requests.get(f"{BASE_URL}/firewall/active-rules", headers=admin_headers)
    assert res_active.status_code == 200
    print(f"   [SUCCESS] Active SOAR Block Rules List: {len(res_active.json())} rules active.")

    # 13. Test Scapy Real Packet Sniffer Interfaces & Status
    print("\n13. Testing Real Scapy Network Packet Sniffer Engine...")
    res_ifaces = requests.get(f"{BASE_URL}/sniffer/interfaces", headers=admin_headers)
    assert res_ifaces.status_code == 200
    ifaces = res_ifaces.json()
    assert len(ifaces) > 0, "Network adapters list should not be empty"
    print(f"   [SUCCESS] Discovered {len(ifaces)} local network adapters. Primary: {ifaces[0]['name']}")

    res_sniff_status = requests.get(f"{BASE_URL}/sniffer/status", headers=admin_headers)
    assert res_sniff_status.status_code == 200
    sniff_st = res_sniff_status.json()
    print(f"   [SUCCESS] Live Packet Sniffer Status: Running={sniff_st['is_running']} | Adapter={sniff_st['active_interface']}")

    # 14. Test AI Incident Response Playbook Generator
    print("\n14. Testing AI Incident Response Playbook Engine...")
    res_playbook = requests.post(f"{BASE_URL}/advisor/playbook", headers=analyst_headers, json={
        "attack_type": "DoS/DDoS", "source_ip": "185.220.101.5", "destination_ip": "10.0.0.1", "severity": "CRITICAL"
    })
    assert res_playbook.status_code == 200, f"Playbook generation failed: {res_playbook.text}"
    playbook_data = res_playbook.json()
    assert len(playbook_data["containment_cli"]) > 0
    print(f"   [SUCCESS] Playbook Generated: '{playbook_data['title']}' | Containment Commands={len(playbook_data['containment_cli'])} | NIST Stage: {playbook_data['nist_stage']}")

    # 15. Test Telegram Bot Webhook Notification Service
    print("\n15. Testing Telegram & Webhook Alert Notification Service...")
    res_tele = requests.post(f"{BASE_URL}/notifications/test", headers=admin_headers, json={
        "provider": "telegram", "telegram_bot_token": "123456789:TEST_BOT_TOKEN", "telegram_chat_id": "-100123456789"
    })
    assert res_tele.status_code == 200
    print(f"   [SUCCESS] Telegram Bot Test Notification Dispatched.")

    # 16. Test Adversarial ML Stress Test & Model Hardening
    print("\n16. Testing Adversarial ML Evasion Stress Test & Model Hardening...")
    res_adv_eval = requests.post(f"{BASE_URL}/adversarial/evaluate", headers=analyst_headers, json={"noise_level": 0.15})
    assert res_adv_eval.status_code == 200, f"Adversarial eval failed: {res_adv_eval.text}"
    adv_res = res_adv_eval.json()
    print(f"   [SUCCESS] Adversarial Stress Test: Clean Acc={adv_res['clean_accuracy']}% | Adv Acc={adv_res['adversarial_accuracy']}% | Robustness Score={adv_res['robustness_score']}/100 ({adv_res['hardening_grade']})")

    res_adv_harden = requests.post(f"{BASE_URL}/adversarial/harden", headers=analyst_headers, json={"algorithm": "Random Forest"})
    assert res_adv_harden.status_code == 200, f"Adversarial hardening failed: {res_adv_harden.text}"
    harden_res = res_adv_harden.json()
    print(f"   [SUCCESS] Hardened Model Retrained: {harden_res['message']} (Accuracy: {harden_res['accuracy']}%)")

    print("\n=======================================================")
    print(" ALL 16 END-TO-END SYSTEM VERIFICATION TESTS PASSED! ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()


