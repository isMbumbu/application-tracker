# Application Tracker

A modern full-stack job and opportunity tracking platform built with **Django**, **Django Ninja**, and **React**.

The application helps users manage and monitor applications efficiently through a clean API-driven architecture and responsive frontend experience.

---

##  Features

- Create, update, and manage applications
- Track application progress and statuses
- REST-style API with Django Ninja
- Modern React frontend powered by Vite
- Scalable full-stack architecture
- Docker support for containerized development
- Clean separation of frontend and backend services

---

# Tech Stack

## Backend
- Python 3.9+
- Django 4
- Django Ninja
- SQLite (development)
- PostgreSQL-ready architecture

## Frontend
- React
- Vite
- React Router
- Axios

## DevOps & Tooling
- Docker
- Docker Compose
- Git & GitHub

---

# Project Structure

```bash
application-tracker/
│
├── backend/                  # Django backend
│   ├── manage.py
│   ├── core/                 # Django project settings
│   ├── apps/                 # Feature-based Django apps
│   ├── requirements.txt
│   └── .env
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Application pages
│   │   ├── services/         # API calls
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Getting Started

##  Clone the Repository

```bash
git clone git@github.com:isMbumbu/application-tracker.git
cd application-tracker
```

---

# Backend Setup

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Backend will run on:

```bash
http://localhost:8000
```

---

# Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

# Docker Setup

Run the full application with Docker:

```bash
docker-compose up --build
```

---

# Environment Variables

Create a `.env` file inside `backend/` for environment-specific settings.

Example:

```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=*
```

---

# Future Improvements

- Authentication & Authorization
- Dashboard Analytics
- Resume Uploads
- Email Notifications
- Application Search & Filtering
- PostgreSQL Production Deployment

---

# Author

Built by Andrew Ambuka
