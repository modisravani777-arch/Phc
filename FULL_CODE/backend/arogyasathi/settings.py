import os
import sys
from importlib.util import find_spec
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY must be configured")

DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in {"1", "true", "yes"}
if not DEBUG and (len(SECRET_KEY) < 50 or SECRET_KEY.startswith("django-insecure-")):
    raise RuntimeError("DJANGO_SECRET_KEY must be a strong production secret")
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")
    if h.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if o.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "arogyasathi.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
WSGI_APPLICATION = "arogyasathi.wsgi.application"
TEST_RUNNER = "core.test_runner.NeonDiscoverRunner"

DATABASE_URL = os.environ.get("DATABASE_URL")
DIRECT_URL = os.environ.get("DIRECT_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must point to the PostgreSQL application database")

if find_spec("psycopg") is None:
    raise RuntimeError("psycopg must be installed to use the PostgreSQL database")

IS_TEST_RUN = "test" in sys.argv
TEST_DATABASE_URL = os.environ.get("DJANGO_TEST_DATABASE_URL")
database_url = (
    TEST_DATABASE_URL
    if IS_TEST_RUN and TEST_DATABASE_URL
    else (DIRECT_URL if IS_TEST_RUN and DIRECT_URL else DATABASE_URL)
)
DATABASES = {
    "default": dj_database_url.parse(
        database_url,
        conn_max_age=0 if IS_TEST_RUN else int(os.environ.get("DJANGO_CONN_MAX_AGE", "60")),
        conn_health_checks=True,
    )
}
if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql":
    database_connect_timeout = int(os.environ.get("DJANGO_DB_CONNECT_TIMEOUT", "10"))
    if database_connect_timeout <= 0:
        raise RuntimeError("DJANGO_DB_CONNECT_TIMEOUT must be a positive integer")
    DATABASES["default"].setdefault("OPTIONS", {})["connect_timeout"] = database_connect_timeout
if IS_TEST_RUN and DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql":
    test_database_name = os.environ.get("DJANGO_TEST_DATABASE_NAME")
    if not test_database_name:
        base_name = DATABASES["default"].get("NAME", "arogyasathi")
        test_database_name = f"test_{base_name}_{os.getpid()}"[:63]
    DATABASES["default"]["TEST"] = {"NAME": test_database_name}
if not IS_TEST_RUN and DATABASES["default"].get("ENGINE") != "django.db.backends.postgresql":
    raise RuntimeError("DATABASE_URL must point to PostgreSQL")

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT") or BASE_DIR / "media")
MEDIA_URL = "media/"
H5_DATA_DIR = os.environ.get("H5_DATA_DIR", "")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LOGIN_URL = "/login/"
LOGIN_REDIRECT_URL = "/dashboard/"
LOGOUT_REDIRECT_URL = "/"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", str(not DEBUG)).lower() in {
    "1",
    "true",
    "yes",
}
SECURE_HSTS_SECONDS = int(
    os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000" if not DEBUG else "0")
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
