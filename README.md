# AEGIS NIDS — AI/ML-Based Network Intrusion Detection System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, software-only **Network Intrusion Detection System (NIDS)** with a complete Authentication & Role-Based Authorization System (`Admin`, `Security Analyst`, `Viewer`), an ML Intrusion Detection Engine, Real-time Traffic Monitoring, Alert Management, IP Threat Investigation, Attack Analytics, and Security PDF/CSV Reporting.

---

## 🌟 Key Features

### 🔐 1. Complete Authentication & Role-Based Access Control (RBAC)
- **Landing Page (`/`)**: Professional cybersecurity hero page with smooth navigation.
- **Registration Page (`/register`)**: Live validation (email format, min 8 chars, password match, duplicate username/email check) and real-time password strength meter.
- **Login Page (`/login`)**: JWT authentication (Access & Refresh tokens) with password hashing via `bcrypt`. Includes password show/hide toggle, Remember Me, and quick-fill demo buttons.
- **Forgot & Reset Password (`/forgot-password`, `/reset-password`)**: Token-driven password recovery with account enumeration protection.
- **User Roles**:
  - **Admin**: Full control over Dashboard, Live Monitoring, Detection, Alerts, Datasets, Models, Reports, User Management (`/users`), and System Settings (`/settings`).
  - **Security Analyst**: Access to Dashboard, Live Monitoring, Detection, Alerts, Datasets, Models, IP Investigation, Attack Analytics, Reports.
  - **Viewer**: Read-only access to Dashboard, Traffic Stats, Attack Analytics, Reports.
- **Profile Page (`/profile`)**: Manage user avatar, view account creation/last login timestamps, edit details, change password, and logout.

### 🛡️ 2. Intrusion Detection Engine & ML Suite
- **Multi-Model Support**: Train and compare **Random Forest**, **Decision Tree**, **Logistic Regression**, **Support Vector Machine (SVM)**, **Gradient Boosting**, and **MLP Neural Networks**.
- **Empirical Metrics Calculation**: Actual Accuracy, Precision, Recall, F1-score, ROC-AUC, and Confusion Matrix calculated from uploaded/synthetic datasets (CICIDS2017 / UNSW-NB15).
- **Flow Classifier & Threat Verdict**: Automatically classifies flows into `BENIGN`, `DoS/DDoS`, `Port Scan`, `Brute Force`, `Botnet`, `Web Attack`, or `Infiltration` with confidence scores and threat levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 📊 3. SOC Dark Dashboard & Analytics
- **8 Interactive Charts**:
  1. Traffic volume over time (Normal vs Attack packets).
  2. Normal vs Malicious traffic pie chart.
  3. Attack category distribution bar chart.
  4. Threat severity breakdown.
  5. Detection accuracy rate trend line (%).
  6. Protocol distribution (TCP, UDP, HTTPS, ICMP).
  7. Top Attacker Source IPs.
  8. Top Target Destination IPs.
- **Live Network Flow Monitoring (`/monitoring`)**: Streaming table with packet counts, rates, threat badges, and stream controls (Pause/Resume).
- **Intrusion Detection Analyzer (`/detection`)**: Manual flow testing pipeline with built-in attack presets.
- **Alert Management (`/alerts`)**: Triage alert statuses (`New` → `Investigating` → `Resolved` → `False Positive`), search, filter by severity, and CSV export.
- **IP Threat Investigation (`/ip-investigation`)**: Forensic lookup console displaying threat score (0–100), attack count, target ports, protocols, and historical timeline.
- **Security Reports (`/reports`)**: Printable executive PDF summary and CSV export.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite/PostgreSQL, PyJWT, Passlib (`bcrypt`), Scikit-Learn, Pandas, NumPy, Joblib.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, Axios, React Router v6.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone Repository
```bash
git clone https://github.com/mcram2008-commits/AI-ML-based-Network-Intrusion-Detection-System-NIDS-.git
cd AI-ML-based-Network-Intrusion-Detection-System-NIDS-
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt

# Launch FastAPI server:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/api/docs`).

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies:
npm install

# Run Vite dev server:
npm run dev
```
Frontend Web Portal will be live at `http://localhost:5173`.

---

## 🔑 Demo Login Accounts

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin123!` | Full System Access (including User & Settings Management) |
| **Security Analyst** | `analyst` | `Analyst123!` | SOC Operations, Alerts, Live Monitoring, ML Training |
| **Viewer** | `viewer` | `Viewer123!` | Read-Only Dashboard & Security Reports |

---

## 📜 License
This project is licensed under the MIT License.
