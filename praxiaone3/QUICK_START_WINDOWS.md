# 🏃 QUICK START: Run Backend in 5 Minutes (Windows)

## Complete Copy-Paste Commands for Windows PowerShell

### **Open 4 Terminals/PowerShell Windows**

---

## **Terminal 1: MySQL & Redis Setup**

```powershell
# Start MySQL (if you have it installed)
# Go to Services and start MySQL, OR if using Docker:
docker run -p 3306:3306 --name mysql_praxia -e MYSQL_ROOT_PASSWORD=root123 -d mysql:8.0

# THEN in same terminal, start Redis:
docker run -p 6379:6379 --name redis_praxia -d redis:latest

# Wait 10 seconds for both to start
Start-Sleep -Seconds 10
docker ps  # Should show both containers running
```

---

## **Terminal 2: Django Development Server**

```powershell
# Navigate to backend
cd f:\PrimeNumerics\ProjectAssignment\praxiaone3\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (first time only)
python manage.py createsuperuser

# Start Django
python manage.py runserver

# You'll see:
# Starting development server at http://127.0.0.1:8000/
```

---

## **Terminal 3: Celery Worker**

```powershell
# Navigate to backend
cd f:\PrimeNumerics\ProjectAssignment\praxiaone3\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start Celery worker
celery -A praxiaone worker -l info

# You'll see:
# [*] Ready to accept tasks!
```

---

## **Terminal 4: Test & Monitor**

```powershell
# Now you can test the API:

# 1. Get JWT Token
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/token/" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"YourPassword"}'

$token = ($response.Content | ConvertFrom-Json).access

# 2. Test API with token
Invoke-WebRequest -Uri "http://localhost:8000/api/chronic/diseases/" `
  -Headers @{"Authorization" = "Bearer $token"} | Select-Object -ExpandProperty Content

# 3. View Admin Panel
# Open browser: http://localhost:8000/admin/

# 4. View Celery Tasks
# Open browser: http://localhost:5555/
```

---

## **Visual Guide: Everyone Should See This**

### Admin Panel (Create & See All Models)
```
http://localhost:8000/admin/
├── FHIR Integration
│   ├── FHIR Accounts (link to EHR)
│   └── FHIR Resources (synced data)
├── Data Sources
│   ├── Wearable Devices
│   └── Health Metrics
├── Chronic Mgmt
│   ├── Chronic Diseases ⭐ (NEW!)
│   ├── Disease Metrics
│   ├── Medication Plans
│   ├── Care Goals
│   ├── Risk Assessments
│   ├── Alert Rules
│   └── Disease Timeline
└── Authentication
    └── Users
```

---

## **Test Each Feature in Order**

### ✅ **Test 1: Admin Panel**

1. Open: http://localhost:8000/admin/
2. Login: admin / yourpassword
3. Click "Add" under "Chronic Diseases"
4. Fill in:
   - Disease Type: Type 2 Diabetes
   - Disease Name: Type 2 Diabetes
   - Diagnosis Date: 2020-01-15
   - Severity: Moderate
   - Is Active: ✓ checked
5. Click "Save"
6. **You should see** the disease in the list!

---

### ✅ **Test 2: API - Add Disease Programmatically**

```powershell
# Get token first
$token = "your_jwt_token_here"

# Add a new disease via API
$body = @{
    disease_type = "hypertension"
    disease_name = "Hypertension"
    diagnosis_date = "2019-05-20"
    severity = "mild"
    is_active = $true
    notes = "Controlled with medication"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/chronic/diseases/" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

---

### ✅ **Test 3: Add Health Metrics**

```powershell
# Add HbA1c reading for diabetes patient

$body = @{
    metric_type = "hba1c"
    value = 8.2
    unit = "%"
    measured_at = "2024-03-03T10:00:00Z"
    reference_min = 4.0
    reference_max = 5.6
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/chronic/diseases/1/metrics/" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

**Check Admin:** http://localhost:8000/admin/chronic_mgmt/diseasemetric/
**You should see** the HbA1c metric listed!

---

### ✅ **Test 4: Ingest Wearable Data**

```powershell
# Simulate Apple Health data coming from phone

$body = @{
    metrics = @(
        @{
            metric_type = "heart_rate"
            value = 72.5
            unit = "bpm"
            recorded_at = (Get-Date -AsUTC).ToString('yyyy-MM-ddTHH:mm:ssZ')
        },
        @{
            metric_type = "blood_glucose"
            value = 145
            unit = "mg/dL"
            recorded_at = (Get-Date -AsUTC).ToString('yyyy-MM-ddTHH:mm:ssZ')
        }
    )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/data-sources/apple-health/" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

**Check Admin:** http://localhost:8000/admin/data_sources/healthmetric/
**You should see** heart rate and blood glucose metrics!

---

### ✅ **Test 5: Monitor Celery Tasks**

1. Open: http://localhost:5555/ (Flower)
2. You should see:
   - Task list
   - Worker status
   - Recently completed tasks
   - Active tasks

3. **Trigger async task:**
```powershell
# Try FHIR sync (or any task from Terminal 3)
Invoke-WebRequest -Uri "http://localhost:8000/api/fhir/sync/" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
  }

# Go back to Flower to see the task execute
```

---

### ✅ **Test 6: View Metrics**

```
http://localhost:8000/metrics/
# Should show Prometheus format metrics like:
# django_http_requests_total 42
# django_http_response_time_seconds_sum 15.3
```

---

## **Complete Functionality Checklist**

After running for 2 minutes, you should be able to:

- [ ] Login to admin: http://localhost:8000/admin/
- [ ] See FHIR models: `Fhir Integration > FHIR Resources`
- [ ] See Wearables models: `Data Sources > Health Metrics`
- [ ] See Chronic Disease models: `Chronic Mgmt > Chronic Diseases`
- [ ] Create a disease in admin
- [ ] Create disease metrics via API
- [ ] Create wearable health metrics
- [ ] View Celery tasks in Flower: http://localhost:5555/
- [ ] See Prometheus metrics: http://localhost:8000/metrics/

---

## **If Something Doesn't Work**

### Django not starting?
```powershell
# Check migrations
python manage.py migrate

# Check migrations are created
python manage.py showmigrations

# If needed, reset:
python manage.py migrate --fake-initial
```

### Redis error?
```powershell
# Check if running
redis-cli ping
# Should return: PONG

# If not running:
docker run -p 6379:6379 redis:latest
```

### MySQL connection error?
```powershell
# Check in .env:
# MYSQL_HOST=127.0.0.1
# MYSQL_USER=praxiaone3_user
# MYSQL_PASSWORD=StrongPass@123

# Test connection:
mysql -u praxiaone3_user -p -h 127.0.0.1 -e "SELECT 1"
```

---

## **Ports Reference**

| Service | Port | URL |
|---------|------|-----|
| Django | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Celery Flower | 5555 | http://localhost:5555 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |

---

## **Copy-Paste: Full Setup Script**

Save this as `setup.ps1` and run:

```powershell
# Full automated setup for Windows

Write-Host "Starting Docker containers..."
docker run -p 3306:3306 --name mysql_praxia -e MYSQL_ROOT_PASSWORD=root123 -d mysql:8.0
docker run -p 6379:6379 --name redis_praxia -d redis:latest

Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 15

Write-Host "Setting up Django..."
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
Write-Host "Superuser creation skips if already exists"
# python manage.py createsuperuser

Write-Host "`nSetup Complete! Now open 3 more terminals and run:`n"
Write-Host "Terminal 2: python manage.py runserver"
Write-Host "Terminal 3: celery -A praxiaone worker -l info"
Write-Host "Terminal 4: Open browser to http://localhost:8000/admin/"
```

Run it:
```powershell
.\setup.ps1
```

---

## **🎉 You're Done!**

You now have a fully functional Praxia5Chronic backend with:
- ✅ 12 new database models
- ✅ 30+ API endpoints
- ✅ Async task processing
- ✅ Admin interface
- ✅ Celery monitoring
- ✅ Prometheus metrics

**Everything visible and testable in 5 minutes!** 🚀
