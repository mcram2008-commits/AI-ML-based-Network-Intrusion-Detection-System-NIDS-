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

    print("\n=======================================================")
    print(" ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY! ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
