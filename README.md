# LinkShort – Secure URL Shortener & Click Analytics

LinkShort is a self-contained, secure URL shortening service built with **FastAPI**, **PostgreSQL/SQLite**, **SQLAlchemy**, and **React**. It features JSON Web Token (JWT) Authentication, custom alias selection, automated link expiration, and an interactive click analytics dashboard.

---

## Key Features

- 🔐 **Secure JWT Authentication**: Sign up and login flow to own, manage, and delete links.
- 🔗 **Custom Short URLs**: Members can choose custom aliases (e.g., `linkshort.com/my-portfolio`) instead of randomly generated hashes.
- ⏳ **Automated URL Expiration**: Set an optional datetime expiration constraint on short links. Expired links automatically return `410 Gone`.
- 📈 **Interactive Click Analytics**: A custom SVG-rendered history chart, plus browser, operating system (OS), and referrer distribution tracking.
- ⚡ **Background Tracking**: Click analysis is processed asynchronously using FastAPI `BackgroundTasks` to avoid slowing down redirect speeds.
- 🐳 **Dockerized Stack**: Serves backend and compiled frontend React assets in a single container or runs multi-container setups using PostgreSQL.
- 🚀 **One-Click Deploy**: Production-ready deployment template configuration (`render.yaml`) for Render.

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic, Passlib (bcrypt), python-jose (JWT)
- **Database**: PostgreSQL (Production) / SQLite (Local Development fallback)
- **Frontend**: React, Vite, Tailwind CSS (v4)
- **Containerization & Hosting**: Docker, Docker Compose, Render

---

## Project Structure

```
URL Shortner/
├── app/                        # Python backend application package
│   ├── database.py             # SQLAlchemy session and engine initialization
│   ├── models.py               # Database schemas (User, URL, ClickAnalytic)
│   ├── schemas.py              # Pydantic validation schemas
│   ├── auth.py                 # Password hashing & JWT dependencies
│   └── routes/                 # Endpoint routers
│       ├── auth.py             # User signup, login, profile (/api/auth)
│       ├── urls.py             # URL shortening, listing, deleting (/api/urls)
│       └── analytics.py        # Analytics reports (/api/analytics)
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── Content.jsx     # Guest landing page
│   │   │   ├── AuthForm.jsx    # Glassmorphism signup/signin form
│   │   │   ├── Dashboard.jsx   # Member home, creation, lists
│   │   │   └── AnalyticsView.jsx # Detailed SVG charts & click logs
│   │   ├── App.jsx             # State router & auth initializer
│   │   ├── App.css             # Tailwind v4 entrypoint
│   │   └── main.jsx            # React root mount
│   ├── index.html              # Frontend page template (SEO configured)
│   └── package.json            # Frontend dependency specifications
├── main.py                     # Entrypoint & redirection middleware
├── Dockerfile                  # Multi-stage Docker builder (Node build -> Python runner)
├── docker-compose.yml          # Multi-container local stack config
├── render.yaml                 # Render Blueprint deployment script
└── pyproject.toml              # Python project metadata & requirements
```

---

## Local Setup & Run

### Method 1: Docker Compose (Recommended)
This runs the complete app with a PostgreSQL database in Docker containers.

1. Ensure you have **Docker** and **Docker Compose** installed.
2. Run:
   ```bash
   docker compose up --build
   ```
3. Open your browser and navigate to `http://localhost:8000`.

### Method 2: Manual Local Running (SQLite)
This runs the backend with SQLite and the frontend with the Vite dev server.

#### 1. Running the Backend:
1. Navigate to the root directory.
2. Activate your virtual environment and install packages:
   ```bash
   .venv\Scripts\activate    # Windows
   pip install .
   ```
3. Run the uvicorn development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The Swagger API documentation is available at `http://localhost:8000/docs`.*

#### 2. Running the Frontend:
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser. (Vite will proxy API requests to `http://localhost:8000`).

---

## Production Deployment on Render

You can easily deploy LinkShort to Render using the preconfigured [render.yaml](file:///c:/Users/vishe/OneDrive/Desktop/URL%20Shortner/render.yaml) blueprint:

1. Push this code repository to your GitHub account.
2. In the Render Dashboard, click **New** and select **Blueprint**.
3. Select this repository.
4. Render will automatically provision:
   - A **PostgreSQL database**.
   - A **Web Service** running the Docker container.
   - All connection strings (`DATABASE_URL`) and authorization keys (`JWT_SECRET_KEY`) will link automatically.

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Registers a new user.
- `POST /api/auth/login` - Authenticates user credentials (using standard OAuth2 form) and returns a JWT access token.
- `GET /api/auth/me` - Retrieves the authenticated user's profile details.

### URL Operations (`/api/urls`)
- `POST /api/urls/shorten` - Shortens a long URL. Supports optional `custom_code` and `expires_at` parameters (requires authentication to use custom codes/expiration).
- `GET /api/urls/my` - Returns all short links created by the current logged-in user.
- `DELETE /api/urls/delete/{short_code}` - Deletes a short link. Only the owner can delete their URLs.

### Analytics (`/api/analytics`)
- `GET /api/analytics/{short_code}` - Returns detailed redirection data, clicks aggregated by date, referrers, browsers, and OS systems (requires ownership).

### Redirection
- `GET /{short_code}` - Performs a standard `302 Found` redirection to the original destination and logs analytics in the background. If expired, returns a `410 Gone` error.
