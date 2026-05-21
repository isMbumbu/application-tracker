# Mini Application Workflow Tracker
### Name: `Andrew Ambuka`
### Email: `andrewambuka9@gmail.com`

A production-style workflow management system built with Django Ninja (backend) and React + TypeScript (frontend). The system enforces a strict, state-driven application review lifecycle with backend-controlled transitions.

## System Overview

This system models a controlled approval workflow used in application processing pipelines.

### Workflow State Machine

Draft -> Submitted -> Under Review -> (Approved | Rejected | Need More Information)

### Key Principles

* **Backend as Source of Truth**: The backend controls all state transitions.
* **Explicit Validation**: All transitions are validated at the API level.
* **FSM Pattern**: The workflow is implemented using a finite state machine pattern.
* **Deterministic Behavior**: No implicit transitions or frontend-driven state control.

---

## Architecture

* **React (UI Layer)**
* **Django Ninja API (Controller Layer)**
* **Service Layer (Business Logic / Workflow Engine)**
* **Django ORM (Persistence Layer)**
* **SQLite (Dev) / PostgreSQL (Extensible)**

### Design Highlights

* **Separation of Concerns**: API layer handles transport/validation, Service layer enforces workflow, ORM handles persistence.
* **State Transition Safety**: Status mutation is restricted to controlled service methods.

---

## Core Domain Model

### Application Entity

Represents a submitted application moving through a structured review lifecycle.

* `tracking_number`
* `applicant_name`
* `applicant_email`
* `company_name`
* `application_type`
* `description`
* `status`
* `reviewer_comment`
* `created_at`
* `updated_at`
* `submitted_at`
* `reviewed_at`

### Application Types

* Recordation
* Renewal
* Change of Ownership
* Change of Name
* Discontinuation

### Application States

* Draft
* Submitted
* Under Review
* Need More Information
* Approved
* Rejected

---

## API Design (Django Ninja)

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /applications/ | Create draft |
| GET | /applications/ | List applications |
| GET | /applications/{id} | Retrieve application |
| PUT | /applications/{id} | Update draft / editable states |
| POST | /applications/{id}/submit | Submit application |
| POST | /applications/{id}/start-review | Move to review stage |
| POST | /applications/{id}/decision | Finalize review decision |

---

## Workflow Engine (Business Logic)

Transitions are enforced in the service layer.

### Transition Rules

* **Draft -> Submitted**: Must be in Draft status.
* **Submitted -> Under Review**: Must be in Submitted status.
* **Under Review -> Terminal States (Approved, Rejected, Need More Information)**: Requires a reviewer decision.

### Guardrails

* Invalid transitions raise controlled API errors.
* Status mutation is centralized.
* Reviewer comments are required for Rejection and Need More Information.

---

## Frontend Architecture (React + TypeScript)

* **Structure**: Stateless UI components with API-driven state rendering.
* **UX State Mapping**:

| Status | Available Actions |
| :--- | :--- |
| Draft | Edit, Submit |
| Submitted | Start Review |
| Under Review | Approve, Reject, Need More Info |
| Need More Information | Edit, Resubmit |
| Approved / Rejected | Read-only |

---

## Testing Strategy

* **Backend**: Focuses on state transition validation, invalid transition rejection, and CRUD correctness.
    * Unit tests: Service layer (workflow engine).
    * Integration tests: API endpoints.

---
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

## DevOps / Local Development

### Full Stack (Docker)

```bash
docker compose up --build
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
