# Mini Application Workflow Tracker

A Django Ninja API and typed React frontend for the take-home application
workflow assignment.

Workflow:

```text
Draft -> Submitted -> Under Review -> Need More Information / Approved / Rejected
```

## Features

- Create application drafts
- List and view applications
- Edit Draft and Need More Information applications
- Submit and resubmit applications
- Start review from Submitted
- Record reviewer decisions from Under Review
- Require comments for Need More Information and Rejected decisions
- Docker Compose setup for backend and frontend

## Tech Stack

- Backend: Python 3.9+, Django 4.2, Django Ninja, SQLite
- Frontend: React, TypeScript, Vite, Fetch API
- Tooling: Docker, Docker Compose

## Docker Setup(Important add on)

Run both Frontend and Backend:
After cloning and setting up the `.env` by copying the `.env.examples` of  both folders in the repo(Both folders have .envs)

```bash
docker compose up --build
```
This way docker handles all installations and packages needed to run the application

Then open:

```bash
http://localhost:5173
```

## Environment And Database

Backend environment variables live in:

```bash
backend/.env
```

Use this committed template when setting up a new machine:

```bash
cp backend/.env.example backend/.env
```

The local backend database uses SQLite by default. The connection is configured
in `backend/core/settings.py` through Django's `DATABASES` setting:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": env_path("SQLITE_PATH", BASE_DIR / "db.sqlite3"),
    }
}
```

With the default `.env`, the database file is:

```bash
backend/db.sqlite3
```

`SQLITE_PATH` may be absolute or relative. Relative paths are resolved from the
`backend/` directory, so `SQLITE_PATH=db.sqlite3` is stable whether commands are
run from the project root or from `backend/`.

The initial Django admin user is also configured by environment variables:

```bash
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=change-this-admin-password
```

The local `backend/.env` can use development credentials. Change the password
before using the project anywhere beyond local testing.

Frontend environment variables are optional because the app defaults to:

```bash
http://localhost:8000/api
```

If needed, copy the frontend template:

```bash
cp frontend/.env.example frontend/.env
```

## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_admin_user
python manage.py runserver
```

Backend API:

```bash
http://localhost:8000/api/
```

API docs:

```bash
http://localhost:8000/api/docs
```

Django admin:

```bash
http://localhost:8000/admin/
```

If you use the included local `.env.example`, the development admin credentials are:

```bash
username: admin
password: admin12345
```

Run backend tests:

```bash
cd backend
python manage.py test applications
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```bash
http://localhost:5173
```

Type-check and build:

```bash
npm run typecheck
npm run build
```

Set a custom API URL if needed:

```bash
VITE_API_URL=http://localhost:8000/api npm run dev
```


The backend container runs migrations before starting the development server.
It also creates the configured initial admin user.

Default Docker admin credentials:

```bash
username: admin
password: admin12345
```

## Assignment Coverage

- Application model includes all required fields.
- Application types: Recordation, Renewal, Change of Ownership, Change of Name,
  Discontinuation.
- Statuses: Draft, Submitted, Under Review, Need More Information, Approved,
  Rejected.
- API endpoints support draft creation, list, detail, draft update, submit,
  start review, and reviewer decision.
- Workflow rules are enforced in the API and covered by tests.
- Django admin is enabled for a reviewer/admin user and can be bootstrapped from
  environment variables.
- React UI includes list, create/edit form, detail page, and reviewer decision
  form.
- Detail page actions change by status:
  Draft shows Edit and Submit.
  Submitted shows Start review.
  Under Review shows reviewer decision controls.
  Need More Information shows Edit and Resubmit.
  Approved and Rejected show no edit actions.

## Assumptions

- There is no custom frontend authentication in this assignment, so reviewer
  actions are exposed through the same API. Django admin is available for a
  protected reviewer/admin management surface.
- Need More Information applications can be edited and resubmitted.
- Resubmitting clears the previous reviewer comment for the active review cycle.
- SQLite is used for local development and the take-home scope.

## What I Would Improve With More Time

- Add authentication and reviewer/applicant permissions.
- Add a workflow history table instead of keeping only the latest timestamps.
- Add pagination, search, and status filters.
- Move production settings to environment-specific modules.
- Add end-to-end browser tests for the React workflow.
