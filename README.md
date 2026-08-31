# Rivi - JIRA Clone

Rivi is a full-featured, modern JIRA clone built with a premium deep-blue design aesthetic. It provides comprehensive project management tools including interactive Kanban boards, sprint management, issue tracking, and detailed reporting.

## 🚀 Features

*   **Interactive Kanban Boards**: Fully functional drag-and-drop issue management powered by `@dnd-kit`.
*   **Sprint & Backlog Management**: Comprehensive backlog view with accordion expansions, inline issue creation, and sprint lifecycles.
*   **Issue Tracking**: Deep issue detail views with priority, status, type tracking, and threaded comments.
*   **Analytics & Reports**: Visual sprint velocity and burndown charts built with `recharts`.
*   **Project Settings**: Configurable project workspaces and team member management.
*   **Authentication**: Secure JWT-based user registration and login system.
*   **Responsive UI**: Modern, responsive React components tailored for a seamless user experience.

## 🛠️ Technology Stack

*   **Backend**: Python 3.13, FastAPI, Motor (async MongoDB), JWT, bcrypt
*   **Frontend**: React, TypeScript, Vite, Zustand (state management), TanStack React Query (data fetching)
*   **Database**: MongoDB
*   **Infrastructure**: Docker, Docker Compose, Nginx
*   **CI/CD**: GitHub Actions

---

## 🏗️ Project Structure

```text
Rivi/
├── backend/                  # FastAPI Application
│   ├── app/                  # Application source code
│   │   ├── models/           # MongoDB document schemas (Pydantic)
│   │   ├── routes/           # API endpoints (Auth, Projects, Issues, etc.)
│   │   ├── utils/            # Helper functions (Auth hashing/tokens)
│   │   └── main.py           # FastAPI entry point
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container definition
├── frontend/                 # React Vite Application
│   ├── src/                  # Application source code
│   │   ├── api/              # Axios API clients
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── pages/            # Application views (Dashboard, Board, etc.)
│   │   └── store/            # Zustand state stores
│   ├── nginx.conf            # Production Nginx reverse-proxy configuration
│   └── Dockerfile            # Multi-stage frontend container definition
├── docker-compose.yml        # Orchestrates the entire application stack
└── .github/workflows/ci.yml  # CI/CD Pipeline
```

---

## 💻 Local Development Setup (Manual)

If you wish to run the frontend and backend separately for active development with hot-reloading:

### 1. Prerequisites
*   Python 3.13
*   Node.js 20+
*   MongoDB running locally on port `27017`

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your_development_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🐳 Docker Production Setup

For a production-like environment or easy local testing, use the included Docker Compose configuration. This will spin up MongoDB, the backend, and the frontend automatically.

1. Ensure Docker and Docker Compose are installed.
2. From the root directory, run:
```bash
docker-compose up -d --build
```

The application stack will be built and started:
*   **Frontend**: Available at `http://localhost` (Port 80)
*   **Backend**: Proxied automatically via Nginx (`/api/*`), or accessible internally.
*   **Database**: Persistent MongoDB volume attached.

To view the logs:
```bash
docker-compose logs -f
```

To shut down the cluster:
```bash
docker-compose down
```

---

## 🔄 CI/CD Pipeline

This project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that triggers on pushes and pull requests to the `main` branch. 

The pipeline performs:
1. **Backend Tests**: Python linting with `flake8` and dependency installation testing.
2. **Frontend Tests**: TypeScript type-checking and a dry-run production build (`npm run build`).
3. **Docker Build Validation**: Ensures that both the frontend and backend Dockerfiles compile correctly.
