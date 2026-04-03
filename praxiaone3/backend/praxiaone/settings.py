"""
Django settings for praxiaone project.

Windows dev-friendly + Next.js (CORS) + DRF + JWT + MySQL (fallback to SQLite).
"""

from pathlib import Path
import os
import sys
from datetime import timedelta
from dotenv import load_dotenv

# -----------------------
# Base paths
# -----------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ✅ Make /ai importable from Django (project_root/ai)
# project_root/
#   backend/
#   ai/
sys.path.append(str(BASE_DIR.parent / "ai"))

# Load .env if present (backend/.env)
load_dotenv(BASE_DIR / ".env")

# -----------------------
# OpenAI + AI config
# -----------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

# ✅ Qdrant config (used by backend + can be shared with /ai folder)
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333").strip()
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "praxiaone_health_memory").strip()

# ✅ IMPORTANT: dimension must match your embedding model output
# all-MiniLM-L6-v2 => 384
QDRANT_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "384"))

# If you keep a separate embedding model name (optional)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2").strip()
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu").strip()

# ElevenLabs Configuration
ELEVEN_LABS_VOICE_ID = os.getenv("ELEVEN_LABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip()
ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY", "").strip()


# -----------------------
# Core settings
# -----------------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")
    if h.strip()
]

# -----------------------
# Media / Static
# -----------------------
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------
# Installed apps
# -----------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "django_celery_results",

    # additional project apps
    "core",
    "wellness",
    "fhir_integration",
    "data_sources",
    "chronic_mgmt",
]

# -----------------------
# Middleware
# -----------------------
# Note: django_prometheus middleware is appended dynamically below if the
# package is available. This allows tests to run without installing it.
MIDDLEWARE = [
    # CORS must be high in the list
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# attempt to include django_prometheus if it is installed
try:
    import django_prometheus  # noqa: F401
except ImportError:
    # metrics package not available; skip
    pass
else:
    INSTALLED_APPS.insert(INSTALLED_APPS.index('django_celery_results')+1, 'django_prometheus')
    # add before and after middleware
    MIDDLEWARE.insert(0, 'django_prometheus.middleware.PrometheusBeforeMiddleware')
    MIDDLEWARE.append('django_prometheus.middleware.PrometheusAfterMiddleware')

ROOT_URLCONF = "praxiaone.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "praxiaone.wsgi.application"

# -----------------------
# Database
# -----------------------
MYSQL_NAME = os.getenv("MYSQL_DATABASE")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")

if MYSQL_NAME and MYSQL_USER and MYSQL_PASSWORD:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": MYSQL_NAME,
            "USER": MYSQL_USER,
            "PASSWORD": MYSQL_PASSWORD,
            "HOST": MYSQL_HOST,
            "PORT": MYSQL_PORT,
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# When running the test suite we prefer an in‑memory SQLite database.
# This avoids requiring the MySQL user to create/drop the test database,
# which earlier caused an "Access denied" error.
if 'test' in sys.argv:
    DATABASES['default'] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }

# -----------------------
# Password validation
# -----------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------
# Internationalization
# -----------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# -----------------------
# CORS (for Next.js frontend)
# -----------------------
CORS_ALLOW_ALL_ORIGINS = True

# -----------------------
# Django REST Framework + JWT
# -----------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    # IMPORTANT: enable multipart for uploads
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "14"))),
}

# RAG tuning
RAG_MAX_CHARS = int(os.getenv("RAG_MAX_CHARS", "900"))
RAG_OVERLAP = int(os.getenv("RAG_OVERLAP", "120"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "6"))
RAG_UPSERT_BATCH = int(os.getenv("RAG_UPSERT_BATCH", "64"))

# -----------------------
# Celery Configuration
# -----------------------
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = "django-db"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# -----------------------
# Logging
# -----------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "fhir_integration": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "data_sources": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}
