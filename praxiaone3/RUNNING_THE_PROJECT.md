# 🚀 Praxia5Chronic - Quick Start Running Guide

## How to Run the Project Locally

### Prerequisites Check
- Python 3.9+ ✅
- MySQL Server ✅
- Redis ✅
- Node.js 18+ (for frontend)

---

## STEP-BY-STEP: Run the Backend

### Step 1: Open Terminal in Backend Folder

```powershell
# Navigate to backend folder
cd f:\PrimeNumerics\ProjectAssignment\praxiaone3\backend
```

### Step 2: Activate Virtual Environment

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# You should see (.venv) at the start of your command line
```

### Step 3: Install Dependencies (First Time Only)

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Ensure MySQL is Running

```bash
# Check if MySQL is running
mysql -u root -p

# If not, start MySQL server (Windows)
# Services > MySQL > Start
```

### Step 5: Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Then run:
CREATE DATABASE praxiaone3;
CREATE USER 'praxiaone3_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON praxiaone3.* TO 'praxiaone3_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Start Redis

```bash
# Open a new terminal/PowerShell
redis-server

# OR if using Docker
docker run -p 6379:6379 redis:latest
```

### Step 7: Run Database Migrations

```bash
cd f:\PrimeNumerics\ProjectAssignment\praxiaone3\backend

# Activate venv first
.\.venv\Scripts\Activate.ps1

# Run migrations
python manage.py migrate
```

### Step 8: Create Superuser (Admin Account)

```bash
python manage.py createsuperuser

# When prompted:
# Username: admin
# Email: admin@praxiaone.com
# Password: (enter your choice)
```

### Step 9: Start Django Development Server

```bash
# Terminal 1: Django server
python manage.py runserver

# You should see:
# Starting development server at http://127.0.0.1:8000/
```

### Step 10: Start Celery Worker (NEW!)

```bash
# Terminal 2: Celery worker (keep it running)
celery -A praxiaone worker -l info

# You should see:
# [*] Ready to accept tasks!
```

### Step 11: Start Celery Beat Scheduler (Optional)

```bash
# Terminal 3: Celery beat scheduler
celery -A praxiaone beat -l info

# You should see:
# [*] beat: Starting...
```

---

## 🌐 Where to See All the Changes

### 1. **Django Admin Panel** (Manage Models)

**URL:** http://localhost:8000/admin/

**Login with:** 
- Username: `admin`
- Password: (whatever you created)

**What you can see here:**
- ✅ FHIR Accounts (fhir_integration/FHIRAccount)
- ✅ FHIR Resources (fhir_integration/FHIRResource)
- ✅ Wearable Devices (data_sources/WearableDevice)
- ✅ Health Metrics (data_sources/HealthMetric)
- ✅ Chronic Diseases (chronic_mgmt/ChronicDisease)
- ✅ Disease Metrics (chronic_mgmt/DiseaseMetric)
- ✅ Medications (chronic_mgmt/MedicationPlan)
- ✅ Care Goals (chronic_mgmt/CareGoal)
- ✅ Risk Assessments (chronic_mgmt/RiskAssessment)
- ✅ Alert Rules (chronic_mgmt/AlertRule)
- ✅ Disease Timeline (chronic_mgmt/DiseaseTimeline)

---

### 2. **API Endpoints** (Test with Postman/cURL)

Start your server and test these endpoints using **Postman** or **cURL**.

#### **Authentication First**
```bash
# Get JWT Token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Response (copy the access token):
# {"access":"eyJ0...","refresh":"eyJ1..."}
```

Then use the token in headers for all requests:
```bash
-H "Authorization: Bearer <your_token>"
```

#### **FHIR Integration Endpoints**

```bash
# 1. Link FHIR Account
POST http://localhost:8000/api/fhir/account/
{
  "fhir_server_url": "https://your-fhir-server.com/fhir",
  "patient_id": "patient-123"
}

# 2. Get FHIR Account
GET http://localhost:8000/api/fhir/account/

# 3. Trigger FHIR Sync (Async)
POST http://localhost:8000/api/fhir/sync/

# 4. Get Synced FHIR Resources
GET http://localhost:8000/api/fhir/resources/
GET http://localhost:8000/api/fhir/resources/?resource_type=Observation
```

#### **Wearable Data Endpoints**

```bash
# 1. Ingest Apple Health Data
POST http://localhost:8000/api/data-sources/apple-health/
{
  "metrics": [
    {
      "metric_type": "heart_rate",
      "value": 75.5,
      "unit": "bpm",
      "recorded_at": "2024-03-03T10:30:00Z"
    }
  ]
}

# 2. Ingest Google Fit Data
POST http://localhost:8000/api/data-sources/google-fit/
{
  "metrics": [
    {
      "metric_type": "steps",
      "value": 10000,
      "unit": "steps",
      "recorded_at": "2024-03-03T10:30:00Z"
    }
  ]
}

# 3. Get Wearable Devices
GET http://localhost:8000/api/data-sources/devices/

# 4. Get Health Metrics
GET http://localhost:8000/api/data-sources/metrics/
GET http://localhost:8000/api/data-sources/metrics/?metric_type=heart_rate&days=7

# 5. Trigger Wearable Sync
POST http://localhost:8000/api/data-sources/sync/
```

#### **Chronic Disease Management Endpoints** (NEW!)

```bash
# 1. List User's Chronic Diseases
GET http://localhost:8000/api/chronic/diseases/

# 2. Add New Chronic Disease
POST http://localhost:8000/api/chronic/diseases/
{
  "disease_type": "type2_diabetes",
  "disease_name": "Type 2 Diabetes",
  "diagnosis_date": "2020-01-15",
  "severity": "moderate",
  "is_active": true,
  "notes": "Well controlled with metformin"
}

# 3. Get Disease Details
GET http://localhost:8000/api/chronic/diseases/1/

# 4. Update Disease
PUT http://localhost:8000/api/chronic/diseases/1/
{
  "severity": "mild",
  "risk_score": 35.5
}

# 5. Get Disease Metrics
GET http://localhost:8000/api/chronic/diseases/1/metrics/
GET http://localhost:8000/api/chronic/diseases/1/metrics/?metric_type=hba1c&days=30

# 6. Add Disease Metric
POST http://localhost:8000/api/chronic/diseases/1/metrics/
{
  "metric_type": "hba1c",
  "value": 8.2,
  "unit": "%",
  "measured_at": "2024-03-03T10:00:00Z"
}

# 7. Get Medications
GET http://localhost:8000/api/chronic/diseases/1/medications/

# 8. Add Medication
POST http://localhost:8000/api/chronic/diseases/1/medications/
{
  "medication_name": "Metformin",
  "generic_name": "Metformin HCl",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "started_date": "2020-01-15"
}

# 9. Get Risk Assessment
GET http://localhost:8000/api/chronic/diseases/1/risk/

# 10. Get Dashboard Summary
GET http://localhost:8000/api/chronic/summary/
```

---

### 3. **Celery Task Monitor** (Flower)

**URL:** http://localhost:5555/

**What you see:**
- ✅ All async tasks running
- ✅ Task execution history
- ✅ Celery worker status
- ✅ Task queue depth
- ✅ Real-time monitoring

**Try triggering async tasks:**
```bash
# FHIR Sync (runs async in background)
POST http://localhost:8000/api/fhir/sync/

# Check status in Flower:
# http://localhost:5555/tasks
```

---

### 4. **Metrics & Monitoring** (Prometheus)

**URL:** http://localhost:9090/

**What you can see:**
- ✅ API request counts
- ✅ Request latencies
- ✅ Error rates
- ✅ Django ORM queries
- ✅ Redis memory usage

**Example query:**
```
django_http_requests_total
django_http_responses_total
```

---

### 5. **Dashboards** (Grafana) - Optional

**URL:** http://localhost:3001/

**Default Login:**
- Username: `admin`
- Password: `admin123`

**Import dashboards for:**
- Django metrics
- Redis performance
- MySQL queries
- Overall system health

---

## 📊 Complete Flow to Test Everything

### **Test Scenario: Add a Diabetes Patient**

**Terminal Setup:**
```
Terminal 1: python manage.py runserver           (port 8000)
Terminal 2: celery -A praxiaone worker -l info   (asyncs)
Terminal 3: redis-server                         (broker)
```

### **Step 1: Admin Panel - Create User**

1. Go to http://localhost:8000/admin/
2. Login as admin
3. Users > Add User
4. Create "john_doe" / "password123"

### **Step 2: Get JWT Token**

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}'

# Copy the "access" token (starts with eyJ...)
```

### **Step 3: Create Chronic Disease**

```bash
curl -X POST http://localhost:8000/api/chronic/diseases/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disease_type": "type2_diabetes",
    "disease_name": "Type 2 Diabetes",
    "diagnosis_date": "2020-01-15",
    "severity": "moderate",
    "is_active": true,
    "notes": "Well controlled"
  }'

# Response: 
# {
#   "id": 1,
#   "disease_type": "type2_diabetes",
#   "disease_name": "Type 2 Diabetes",
#   ...
# }
```

### **Step 4: Add Disease Metric (HbA1c)**

```bash
curl -X POST http://localhost:8000/api/chronic/diseases/1/metrics/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metric_type": "hba1c",
    "value": 8.2,
    "unit": "%",
    "measured_at": "2024-03-03T10:00:00Z"
  }'
```

### **Step 5: Check Admin Panel**

Go to: http://localhost:8000/admin/chronic_mgmt/chronicdisease/

You should see:
- ✅ Disease "Type 2 Diabetes" listed
- ✅ Patient "john_doe"
- ✅ Severity "moderate"
- ✅ Risk score displayed

### **Step 6: Check Dashboard Summary**

```bash
curl -X GET http://localhost:8000/api/chronic/summary/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response shows:
# {
#   "total_diseases": 1,
#   "critical_risk_count": 0,
#   "high_risk_count": 0,
#   "moderate_risk_count": 1,
#   "low_risk_count": 0,
#   "diseases": [...]
# }
```

### **Step 7: Ingest Wearable Data**

```bash
curl -X POST http://localhost:8000/api/data-sources/apple-health/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {
        "metric_type": "heart_rate",
        "value": 72.5,
        "unit": "bpm",
        "recorded_at": "2024-03-03T15:30:00Z"
      },
      {
        "metric_type": "blood_glucose",
        "value": 145.0,
        "unit": "mg/dL",
        "recorded_at": "2024-03-03T10:00:00Z"
      }
    ]
  }'
```

### **Step 8: Check Metrics in Admin**

Go to: http://localhost:8000/admin/data_sources/healthmetric/

You should see:
- ✅ Heart rate: 72.5 bpm
- ✅ Blood glucose: 145 mg/dL

---

## 📋 Postman Collection Template

Save this as `praxia5-postman.json` and import into Postman:

```json
{
  "info": {
    "name": "Praxia5Chronic API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Get Token",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/auth/token/",
        "body": {
          "mode": "raw",
          "raw": "{\"username\":\"admin\",\"password\":\"yourpassword\"}"
        }
      }
    },
    {
      "name": "Chronic - List Diseases",
      "request": {
        "method": "GET",
        "url": "http://localhost:8000/api/chronic/diseases/",
        "header": {
          "Authorization": "Bearer {{token}}"
        }
      }
    },
    {
      "name": "Chronic - Create Disease",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/chronic/diseases/",
        "header": {
          "Authorization": "Bearer {{token}}",
          "Content-Type": "application/json"
        },
        "body": {
          "mode": "raw",
          "raw": "{\"disease_type\":\"type2_diabetes\",\"disease_name\":\"Type 2 Diabetes\",\"diagnosis_date\":\"2020-01-15\",\"severity\":\"moderate\",\"is_active\":true}"
        }
      }
    },
    {
      "name": "Data Sources - Ingest Apple Health",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/data-sources/apple-health/",
        "header": {
          "Authorization": "Bearer {{token}}",
          "Content-Type": "application/json"
        },
        "body": {
          "mode": "raw",
          "raw": "{\"metrics\":[{\"metric_type\":\"heart_rate\",\"value\":75.5,\"unit\":\"bpm\",\"recorded_at\":\"2024-03-03T10:00:00Z\"}]}"
        }
      }
    },
    {
      "name": "FHIR - Sync",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/fhir/sync/",
        "header": {
          "Authorization": "Bearer {{token}}"
        }
      }
    }
  ]
}
```

---

## 🔍 Verify Everything is Working

### Check 1: Django Server

```
http://localhost:8000/
# Should return "Welcome to Django"
```

### Check 2: Admin Panel

```
http://localhost:8000/admin/
# Should ask for login
```

### Check 3: Prometheus Metrics

```
http://localhost:8000/metrics/
# Should show Prometheus format metrics
```

### Check 4: Celery Status

Open Terminal running Celery - you should see:
```
[*] celery@COMPUTERNAME ready.
[*] pool: solo (1 workers, prefork implementation)
```

---

## 🐛 Troubleshooting

### Error: "redis.exceptions.ConnectionError"
```bash
# Redis is not running
redis-server  # Start Redis
```

### Error: "mysql: Access denied"
```bash
# Check credentials in .env file
# Verify MySQL is running
# Reset password if needed
```

### Error: "No module named 'fhir_integration'"
```bash
# Apps not registered in INSTALLED_APPS
# Check praxiaone/settings.py
# Run: python manage.py migrate
```

### Error: "Celery worker not picking up tasks"
```bash
# Check Redis is running
# Restart Celery worker
# Check Flower: http://localhost:5555/
```

---

## 📖 Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| Django Admin | http://localhost:8000/admin/ | Manage models |
| Metrics | http://localhost:8000/metrics/ | Prometheus data |
| Flower | http://localhost:5555/ | Monitor Celery tasks |
| Prometheus | http://localhost:9090/ | Query metrics |
| Grafana | http://localhost:3001/ | Dashboard (optional) |

---

## 🎉 Summary

You now have:
- ✅ 3 Django apps with 12 models
- ✅ 30+ API endpoints
- ✅ Async task processing (Celery)
- ✅ Admin interface to manage everything
- ✅ Metrics & monitoring
- ✅ All running locally on your machine!

**Everything is ready for frontend integration!** 🚀
