# Praxia5Chronic - Backend Setup Guide

## Project Structure

```
backend/
├── praxiaone/          # Django project settings
├── core/               # Core wellness app
├── wellness/           # Additional wellness features
├── fhir_integration/   # FHIR R4 EHR integration
├── data_sources/       # Wearable device integration
├── manage.py           # Django management
├── requirements.txt    # Python dependencies
├── .env                # Environment variables
└── setup_backend.bat   # Windows setup script
```

## Prerequisites

- Python 3.9+
- MySQL 5.7+
- Redis (for Celery)
- Node.js 18+ (for frontend, in frontend folder)

## Installation Steps

### 1. Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Edit `.env` file with your settings:

```env
DJANGO_SECRET_KEY=your-secret-key-change-this
DJANGO_DEBUG=0  # Set to 0 for production
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# MySQL Configuration
MYSQL_DATABASE=praxiaone3
MYSQL_USER=praxiaone3_user
MYSQL_PASSWORD=StrongPass@123
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Celery & Redis
CELERY_BROKER_URL=redis://localhost:6379/0
REDIS_URL=redis://localhost:6379/0

# FHIR Server (optional)
FHIR_SERVER_URL=https://your-fhir-server.com/fhir

# AI/Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=praxiaone_health_memory
```

### 4. Create MySQL Database

```sql
CREATE DATABASE praxiaone3;
CREATE USER 'praxiaone3_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON praxiaone3.* TO 'praxiaone3_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

### 7. Start Redis

**Windows (using WSL or installed Redis):**
```bash
redis-server
```

**Linux/macOS:**
```bash
redis-server
```

**Or using Docker:**
```bash
docker run -p 6379:6379 redis:latest
```

### 8. Run Development Server

```bash
python manage.py runserver
```

### 9. Run Celery Worker (in separate terminal)

```bash
celery -A praxiaone worker -l info
```

### 10. Run Celery Beat (optional, in separate terminal)

```bash
celery -A praxiaone beat -l info
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/token/` - Get JWT token
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Core
- `GET /api/health/` - Health check

### FHIR Integration
- `POST /api/fhir/account/` - Link FHIR account
- `GET /api/fhir/account/` - Get FHIR account
- `POST /api/fhir/sync/` - Trigger FHIR sync
- `GET /api/fhir/resources/` - List synced FHIR resources

### Data Sources (Wearables)
- `POST /api/data-sources/apple-health/` - Ingest Apple Health data
- `POST /api/data-sources/google-fit/` - Ingest Google Fit data
- `GET /api/data-sources/devices/` - List wearable devices
- `POST /api/data-sources/devices/` - Link new device
- `DELETE /api/data-sources/devices/<id>/` - Disconnect device
- `GET /api/data-sources/metrics/` - Get health metrics
- `POST /api/data-sources/sync/` - Trigger device sync

### Monitoring
- `GET /metrics/` - Prometheus metrics

## Troubleshooting

### Redis Connection Error
```
Error: Connection refused
```
Make sure Redis is running:
```bash
redis-server  # Windows or Linux
# or
docker run -p 6379:6379 redis:latest
```

### MySQL Connection Error
```
Error: Access denied for user
```
Check .env credentials match MySQL setup.

### Migrations Failed
Clear and rebuild:
```bash
python manage.py makemigrations
python manage.py migrate --fake-initial
python manage.py migrate
```

### Celery Tasks Not Running
1. Check if worker is running
2. Check Redis connection
3. Check task logs in worker terminal

## Production Deployment

### Using Gunicorn

```bash
gunicorn praxiaone.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
```

### Using Docker

```bash
docker build -t praxia5:latest .
docker run -p 8000:8000 praxia5:latest
```

### Environment Variables for Production

```env
DJANGO_SECRET_KEY=use-strong-random-key
DJANGO_DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Testing

Run tests:
```bash
python manage.py test
```

Run specific app tests:
```bash
python manage.py test fhir_integration
python manage.py test data_sources
```

## Admin Panel

Access Django admin:
```
http://localhost:8000/admin/
```

Use the superuser credentials created earlier.

## Documentation

- [Django REST Framework](https://www.django-rest-framework.org/)
- [FHIR R4 Spec](https://www.hl7.org/fhir/R4/)
- [Celery Documentation](https://docs.celeryproject.io/)
- [Qdrant Vector Database](https://qdrant.tech/)

## Support

For issues or questions, refer to individual app documentation or project GitHub.
