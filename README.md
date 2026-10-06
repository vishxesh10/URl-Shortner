# 🔗 LinkShort — URL Shortener

A full-stack URL shortener web application built with **FastAPI** (Python backend) and **React** (frontend). It supports user authentication, custom short codes, link expiration, and detailed click analytics.

> **Live Demo:** [https://url-shortner-u2wp.onrender.com](https://url-shortner-u2wp.onrender.com)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register and log in with secure token-based auth (24-hour sessions)
- 🔗 **URL Shortening** — Shorten any long URL instantly (works without login too)
- ✏️ **Custom Aliases** — Choose your own short code (e.g. `/my-brand`) — requires login
- ⏰ **Link Expiration** — Set an expiry date for any short link — requires login
- 📊 **Click Analytics** — Track clicks per link with breakdown by browser, OS, referrer, and time
- 🗑️ **Link Management** — View and delete your created links from a personal dashboard
- 🐳 **Docker Ready** — One-command deployment with Docker Compose (includes PostgreSQL)
- ☁️ **Render Deployment** — Pre-configured `render.yaml` for one-click cloud deploy

---

## 🏗️ Project Structure

```
URL Shortner/
├── main.py                  # FastAPI app entry point + redirect handler
├── app/
│   ├── database.py          # SQLAlchemy engine + session setup (SQLite / PostgreSQL)
│   ├── models.py            # Database models: User, URL, ClickAnalytic
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT creation, password hashing, auth dependencies
│   └── routes/
│       ├── auth.py          # /api/auth — register, login, /me
│       ├── urls.py          # /api/urls — shorten, list, delete
│       └── analytics.py     # /api/analytics — per-link click stats
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component — routing between pages
│   │   └── Components/
│   │       ├── Header.jsx       # Top navigation bar
│   │       ├── Content.jsx      # Landing page with URL shortener form
│   │       ├── AuthForm.jsx     # Login / Register form
│   │       ├── Dashboard.jsx    # User's link management dashboard
│   │       └── AnalyticsView.jsx # Detailed analytics page per link
│   └── vite.config.js       # Vite dev server config
├── Dockerfile               # Multi-stage build (React → static, then FastAPI)
├── docker-compose.yml       # Local dev with PostgreSQL
├── render.yaml              # Render.com one-click deploy config
├── pyproject.toml           # Python project metadata + dependencies
├── requirements.txt         # Python package requirements
└── .env.example             # Environment variable template
```

---

## 🗄️ Database Models

### `User`
| Column            | Type        | Description                         |
|-------------------|-------------|-------------------------------------|
| `id`              | Integer PK  | Auto-incremented primary key        |
| `username`        | String(50)  | Unique username                     |
| `email`           | String(100) | Unique email address                |
| `hashed_password` | String(255) | bcrypt-hashed password              |
| `created_at`      | DateTime    | Account creation timestamp (UTC)    |

### `URL`
| Column         | Type        | Description                                        |
|----------------|-------------|----------------------------------------------------|
| `id`           | Integer PK  | Auto-incremented primary key                       |
| `original_url` | Text        | The full original URL                              |
| `short_code`   | String(50)  | Unique short code (random 6-char or custom alias)  |
| `created_at`   | DateTime    | Creation timestamp (UTC)                           |
| `expires_at`   | DateTime    | Optional expiry (null = never expires)             |
| `user_id`      | FK → users  | Owner (null for anonymous/guest links)             |

### `ClickAnalytic`
| Column       | Type       | Description                         |
|--------------|------------|-------------------------------------|
| `id`         | Integer PK | Auto-incremented primary key        |
| `url_id`     | FK → urls  | Which URL was clicked               |
| `clicked_at` | DateTime   | Click timestamp (UTC)               |
| `ip_address` | String(45) | Visitor IP (supports IPv6)          |
| `user_agent` | Text       | Raw User-Agent header               |
| `browser`    | String(50) | Parsed browser (Chrome, Firefox...) |
| `os`         | String(50) | Parsed OS (Windows, macOS, iOS...)  |
| `referrer`   | Text       | HTTP Referer header                 |

---

## 🔌 API Endpoints

### Authentication — `/api/auth`
| Method | Endpoint             | Auth Required | Description             |
|--------|----------------------|---------------|-------------------------|
| POST   | `/api/auth/register` | No            | Create a new account    |
| POST   | `/api/auth/login`    | No            | Login and get JWT token |
| GET    | `/api/auth/me`       | Yes           | Get current user info   |

### URL Operations — `/api/urls`
| Method | Endpoint                        | Auth Required | Description                                        |
|--------|---------------------------------|---------------|----------------------------------------------------|
| POST   | `/api/urls/shorten`             | Optional      | Shorten a URL (custom alias/expiry needs auth)     |
| GET    | `/api/urls/my`                  | Yes           | Get all URLs created by the logged-in user         |
| DELETE | `/api/urls/delete/{short_code}` | Yes           | Delete a specific short URL (owner only)           |

### Analytics — `/api/analytics`
| Method | Endpoint                      | Auth Required | Description                             |
|--------|-------------------------------|---------------|-----------------------------------------|
| GET    | `/api/analytics/{short_code}` | Yes           | Get detailed click analytics for a URL |

### Redirect — Root level
| Method | Endpoint        | Description                                      |
|--------|-----------------|--------------------------------------------------|
| GET    | `/{short_code}` | Redirect to the original URL (records analytics) |

> 📖 Interactive API docs available at: `http://localhost:8000/docs`

---

## ⚙️ Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.11, FastAPI, SQLAlchemy, Uvicorn       |
| Auth      | JWT (python-jose), bcrypt (passlib)             |
| Database  | SQLite (dev) / PostgreSQL (production)          |
| Frontend  | React 18, Vite, TailwindCSS                     |
| Deploy    | Docker, Docker Compose, Render.com              |

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

### Option 1 — Run Backend + Frontend Separately (Recommended for Development)

#### 1. Clone the repository
```bash
git clone https://github.com/vishxesh10/URl-Shortner.git
cd "URL Shortner"
```

#### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```env
DATABASE_URL=sqlite:///./urls.db      # SQLite for local dev
JWT_SECRET_KEY=your-secret-key-here
```

#### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

#### 4. Start the backend server
```bash
uvicorn main:app --reload --port 8000
```
Backend runs at: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

#### 5. Install and start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

### Option 2 — Docker Compose (Full Stack with PostgreSQL)

```bash
docker-compose up --build
```

This starts:
- `linkshort-web` — FastAPI + React served on port `8000`
- `linkshort-db` — PostgreSQL 15 database

App available at: `http://localhost:8000`

---

## ☁️ Deploy to Render (Free)

This project includes a `render.yaml` for one-click deployment to [Render.com](https://render.com).

1. Fork this repository on GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will automatically:
   - Provision a free PostgreSQL database (`linkshort-db`)
   - Build the Docker image (React frontend + FastAPI backend)
   - Set all required environment variables (including auto-generating `JWT_SECRET_KEY`)
   - Deploy the service

---

## 🔐 Environment Variables

| Variable         | Required | Description                                       | Default               |
|------------------|----------|---------------------------------------------------|-----------------------|
| `DATABASE_URL`   | Yes      | Database connection string                        | `sqlite:///./urls.db` |
| `JWT_SECRET_KEY` | Yes      | Secret key for signing JWT tokens (keep private!) | fallback dev key      |

> ⚠️ **Never commit your real `.env` file.** Use `.env.example` as a template only.

---

## 🧠 How It Works

1. **User visits the app** → React frontend loads and checks for a saved JWT token
2. **Shorten a URL** → Frontend calls `POST /api/urls/shorten` → Backend generates a 6-character random code (or uses your custom alias) → Returns the short URL
3. **Someone clicks the short link** → Request hits `GET /{short_code}` on the backend → Checks if the URL exists and hasn't expired → Records click analytics **in the background** (non-blocking, so redirect is instant) → Redirects the user to the original URL (`HTTP 302`)
4. **View analytics** → Frontend calls `GET /api/analytics/{short_code}` → Returns aggregated data: clicks over time, browser breakdown, OS breakdown, referrer sources

---

## 📦 Key Dependencies

| Package          | Purpose                                         |
|------------------|-------------------------------------------------|
| `fastapi`        | Web framework for building the REST API         |
| `sqlalchemy`     | ORM for database access                         |
| `uvicorn`        | ASGI server to run FastAPI                      |
| `python-jose`    | JWT token encoding and decoding                 |
| `bcrypt/passlib` | Secure password hashing                         |
| `psycopg2-binary`| PostgreSQL database adapter                     |
| `python-dotenv`  | Load environment variables from `.env` file     |
| `email-validator`| Email format validation for user registration   |

---

## 📄 License

This project is open source. Feel free to use, fork, and modify it.
