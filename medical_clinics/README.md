# ArogyaSathi Django backend

This project uses Neon PostgreSQL as its only application database. It deliberately
does not include a SQLite fallback or browser-side persistence.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to the Neon **pooled** connection string, including
   `sslmode=require`. Keep `DIRECT_URL` available for administrative tooling only.
3. Set a random `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, and `DJANGO_ALLOWED_HOSTS`.
4. Activate the existing virtual environment and install `requirements.txt` if needed:

   ```powershell
   .\venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

5. Apply migrations and create an administrator:

   ```powershell
   python manage.py migrate
   python manage.py createsuperuser
   ```

The settings fail fast if `DATABASE_URL` or `DJANGO_SECRET_KEY` is absent, and
reject non-PostgreSQL database URLs. `DJANGO_CONN_MAX_AGE` controls Django's
persistent connection lifetime; the application does not add a second pooling
layer on top of Neon pooling. During `manage.py test`, Django forces
`CONN_MAX_AGE=0` so the test database can be dropped cleanly by Neon after the
test runner finishes. Each test process also gets a unique test database name;
set `DJANGO_TEST_DATABASE_NAME` when a CI job needs a fixed name. When
`DIRECT_URL` is configured, test database administration uses that direct
endpoint rather than Neon’s pooled application endpoint. The test runner
terminates only stale sessions attached to the generated test database before
drop; it never terminates sessions in the application database.

## API

All API POST requests use Django session authentication and CSRF protection.
The authenticated user's owned facility (or assigned staff facility) scopes every
query:

* `POST /api/auth/otp/request/`
* `POST /api/auth/otp/verify/`
* `GET /api/facilities/me/`
* `GET|POST /api/staff/`
* `GET|POST /api/reports/`
* `GET|POST /api/affiliations/`
* `POST /api/affiliations/<uuid>/approve/`
* `POST /api/affiliations/<uuid>/reject/`
* `GET /api/notifications/`
* `POST /api/notifications/<id>/read/`

Use the Django admin to bootstrap users, facilities, and initial profiles. All
state-changing endpoints validate input, use ORM transactions where multiple
records are written, and create audit events for important changes.

## Files and operations

Uploaded documents use a private `FileField` path under `MEDIA_ROOT`; do not
serve that directory as a public static directory. In production, point
`MEDIA_ROOT` at a private object-storage mount or replace the storage backend
with a private S3-compatible backend that issues short-lived, authorised URLs.
Only metadata and ownership/sharing relations are stored in Neon.

Run checks and tests with a PostgreSQL test database:

```powershell
$env:DJANGO_SECRET_KEY="test-secret"
$env:DATABASE_URL="postgresql://...neon.../arogyasathi_test?sslmode=require"
$env:DJANGO_DEBUG="True"
python manage.py check
python manage.py test
```

The tests create and destroy Django's separate test database. Never point a test
run at a production database. A real deployment verification should run
`python manage.py migrate --check`, `python manage.py check --deploy`, then
exercise an authenticated GET and POST against the deployed URL and confirm the
new record remains after logout/login and a restart.

For local automated tests without Neon, set `DJANGO_TEST_DATABASE_URL` to an
isolated SQLite URL such as `sqlite:////tmp/arogyasathi-tests.sqlite3`. This
override is accepted only by `manage.py test`; application runtime still
requires PostgreSQL.

## H5 Frontline Health-Worker Companion

The clinic API includes an offline, protocol-bound H5 companion. Set
`H5_DATA_DIR` to the provided H5 `data/` directory to enable
`/api/companion/answer/` and `/api/companion/visit-list/`. Generate the official
H5 files with:

```powershell
python generate_h5_submission.py --data-dir <path-to-H5-data> --split test --out submission
```

The generated folder contains `H5_answers.jsonl`, `H5_visit_list.csv`, and
`H5_footprint.json`. Keep the H5 data and any downloaded models outside the git
repository, as required by the challenge pack.

## Facility sign-in

Phone numbers are read directly from the existing Neon `users.phone` field.
Login does not copy or modify that field. Use the Django admin to explicitly
link each eligible Neon user to an active PHC or Sub-Centre in **Facility login
identities**. Saving the link creates an internal Django session account with
no usable password; the person signs in with their registered phone and a
one-time code. The selected role is taken from the linked facility, not from
the legacy `users.role` field.

For local development only, when `DJANGO_DEBUG=True`, the one-time code is
printed to the backend terminal. Codes expire after five minutes, are limited
to five verification attempts, and requests are rate-limited per account.
Terminal delivery is disabled when debug mode is off. Replace it with a
verified SMS provider before using phone sign-in in production; never enable
Django debug mode in production.

The development login page also accepts email and password for a Django account
explicitly linked to an active facility profile. This email/password endpoint
is disabled when `DJANGO_DEBUG=False`. Use a unique demo-only account for local
testing; never use demo credentials in production.

Existing Neon users must be mapped deliberately. The existing ASHA, supervisor,
medical officer, and admin roles do not by themselves determine PHC/Sub-Centre
access. Create any missing facility profiles and assign users through the
admin; unmapped users cannot receive a code or access facility data. The old
Django username/password API login is no longer available.

Each facility receives a unique identification number (`PHC-...` or `SC-...`)
stored separately from its profile. A Sub-Centre can enter its PHC's
identification number in its profile to connect to that PHC. ASHA workers added
to a Sub-Centre are linked to that facility, and the PHC can review its
connected Sub-Centres' reports. Schedules, facility profiles, login mappings,
OTP challenges, and saved reports are managed by Django migrations and stored
in Neon.

For Neon inspection, use the Neon SQL Editor or `psql` with `DIRECT_URL` for
administrative work. Use `DATABASE_URL` for application traffic. Enable Neon
branching and scheduled backups/retention appropriate to the environment, and
test restore by creating a temporary branch before promoting any recovery.
