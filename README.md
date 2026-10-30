# PHC — ArogyaSathi

ArogyaSathi is a community healthcare workspace for Primary Health Centres
(PHCs) and Sub-Centres. It brings facility operations, frontline teams, and
community health information together in one application.

## What it includes

- Separate PHC and Sub-Centre sign-in and facility profiles
- Facility-scoped family, village, and ASHA worker information
- Clinical registers, reports, analytics, and facility affiliations
- Calendar scheduling for camps, appointments, and meetings
- Django REST endpoints backed by PostgreSQL

## Technology

- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Backend: Django and Django REST framework
- Database: PostgreSQL (Neon compatible)

## Run locally

### Backend

1. Create a Python virtual environment and install dependencies:

   ```bash
   cd medical_clinics
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Create `medical_clinics/.env` from `.env.example`. Set a PostgreSQL
   `DATABASE_URL` and a private, randomly generated `DJANGO_SECRET_KEY`.
   Configure `DJANGO_DEBUG` and allowed hosts for your environment.
3. Apply migrations and start Django:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. The development server proxies API requests
to Django; configure the backend URL in the Vite config when using a different
backend address.

## Security

Never commit `.env` files, database credentials, private keys, local database
files, or real patient data. The checked-in `.env.example` files contain
placeholders only. Use separate credentials for development and production, and
do not enable Django debug mode in production.
