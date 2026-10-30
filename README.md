# ArogyaSathi — PHC and Sub-Centre Community Care

ArogyaSathi is a facility operations workspace for Primary Health Centres (PHCs)
and Sub-Centres. It helps authorised facility staff review community records,
coordinate care teams, manage schedules, and prepare reports.

## What it does

- Separate PHC and Sub-Centre facility profiles and sign-in
- Facility-scoped household, village, ASHA, and clinical register views
- Reports, coverage analytics, and PHC/Sub-Centre affiliations
- Calendar management for medical camps, appointments, and meetings
- Django APIs backed by PostgreSQL, including Neon PostgreSQL
- Optional offline health-protocol companion when the H5 data directory is
  configured

The app handles health information. Use synthetic data for demonstrations and
follow the organisation's privacy and access-control requirements when using
real data.

## How to run

### Requirements

- Python 3.12 or newer
- Node.js 20 or newer and npm
- A PostgreSQL database for application use

### Configure the environment

`FULL_CODE/.env.example` documents every supported setting. Copy the
application-specific example files and fill in the required values. Never
commit the resulting `.env` files.

```bash
cp FULL_CODE/backend/.env.example FULL_CODE/backend/.env
cp FULL_CODE/web/.env.example FULL_CODE/web/.env
```

In `FULL_CODE/backend/.env`, set `DATABASE_URL` to the PostgreSQL application
connection string, `DIRECT_URL` to the direct connection used for test database
administration, and `DJANGO_SECRET_KEY` to a unique random value. For example,
generate a key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Use `DJANGO_DEBUG=True` only for local development. Debug-only email/password
sign-in and terminal OTP delivery are not production authentication methods.
Configure production hosts, HTTPS, and CSRF trusted origins before deployment.

### Start the backend

```bash
cd FULL_CODE/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

On Windows, activate the environment with `.venv\Scripts\activate` instead.
Database migrations are versioned in `FULL_CODE/backend/core/migrations/`.
Create and map facility accounts through the Django admin as described in the
backend configuration and admin UI.

### Start the frontend

In another terminal:

```bash
cd FULL_CODE/web
npm ci
npm run dev
```

Open the Vite URL shown in the terminal (by default
`http://localhost:5173`). The Vite development proxy forwards API requests to
`http://127.0.0.1:8000`; set `VITE_DJANGO_PROXY_TARGET` in
`FULL_CODE/web/.env` to use another backend address. For a separately hosted
frontend, configure `VITE_API_URL` with the Django server origin.

## How to run the tests

Backend tests use an isolated in-memory SQLite test database and synthetic
records; they do not need or modify Neon data:

```bash
cd FULL_CODE/backend
DJANGO_TEST_DATABASE_URL=sqlite:///:memory: python manage.py test core
```

Build and type-check the frontend with:

```bash
cd FULL_CODE/web
npm run build
```

Run the frontend lint and formatting checks with `npm run lint` and
`npm run format:check`.

Install the backend development tools with
`python -m pip install -r requirements-dev.txt`, then check backend lint and
formatting with `ruff check core arogyasathi manage.py` and
`ruff format --check core arogyasathi manage.py`. Audit the backend dependency
set with `pip-audit -r requirements.txt`.

## Architecture

```text
Browser
  └── FULL_CODE/web/ (React, TypeScript, Vite)
        └── session-authenticated JSON API
              └── FULL_CODE/backend/ (Django)
                    ├── core/ (API, domain workflows, tests)
                    ├── core/migrations/ (database schema changes)
                    └── PostgreSQL / Neon
```

The React pages call the shared API client in `FULL_CODE/web/src/lib/`. Django
routes requests to the `core` app, which enforces facility access and persists
application-owned records through PostgreSQL. Existing source health records
are read from the configured database. The optional protocol companion reads
only from a locally supplied `H5_DATA_DIR`.

## AI usage

The core facility, authentication, reporting, and scheduling workflows do not
call a hosted generative-AI service. The optional H5 protocol companion is an
offline feature and requires its own configured protocol data. AI-assisted
development tools were used while maintaining this codebase; all changes should
be reviewed and validated by project maintainers before deployment.

## Pre-built and third-party code

The ArogyaSathi application was present in the repository before this submission
cleanup. The project uses the third-party packages listed in
`FULL_CODE/web/package.json` and `FULL_CODE/backend/requirements.txt`; it does
not intentionally vendor third-party library source. Package lock and
requirements files are committed for reproducible installs.

## Limitations

- A PostgreSQL database and valid facility-to-user mappings are required for
  normal application use.
- OTP codes are delivered to the terminal only in development; production SMS
  delivery must be configured before using phone sign-in in production.
- Email/password sign-in is a development-only path and is disabled when
  `DJANGO_DEBUG=False`.
- H5 companion answers depend on the locally supplied protocol data and are not
  a substitute for clinical judgement.
- This project is a healthcare operations application, not an ML submission;
  no prediction files or model evaluation are included.
- No explicit distribution license has been selected for this repository.
