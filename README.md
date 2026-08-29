# SIH 2026 - Full Stack Application

A modern full-stack application built with **FastAPI** and **React + TypeScript**.

## Project Structure

```text
SIH 2026/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── core/           # Core configuration & security
│   │   ├── db/             # Database session & initialization
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── tests/              # Test files
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend Docker image
│   └── .env.example        # Environment variables template
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json        # Node dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── vite.config.ts      # Vite config
│   └── Dockerfile          # Frontend Docker image
├── docker-compose.yml      # Full stack orchestration
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8000>
- **API Docs**: <http://localhost:8000/docs>
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run database migrations (when using Alembic)
# alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install  # or pnpm install

# Start development server
npm run dev  # or pnpm dev
```

## Configuration

### Backend Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Application
APP_NAME="SIH 2026 API"
DEBUG=true
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sih2026

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### Frontend Configuration

The frontend proxies API requests to the backend. Configure in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

### Users

- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Health

- `GET /health` - Health check
- `GET /api/v1/health` - API health check

## Tech Stack

### Backend

- **FastAPI** - Modern, fast web framework
- **SQLAlchemy 2.0** - Async ORM
- **Pydantic v2** - Data validation
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **JWT** - Authentication
- **Alembic** - Database migrations
- **Pytest** - Testing

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Zustand** - State management
- **ESLint** - Linting

## 📝 Development Guidelines

### Backend

- Follow FastAPI best practices
- Use dependency injection
- Write tests for new features
- Use type hints everywhere
- Follow PEP 8 style guide

### Frontend

- Use functional components with hooks
- Follow React best practices
- Use TypeScript strictly
- Keep components small and focused
- Use CSS Modules or styled-components

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## Deployment

### Production Build

```bash
# Build Docker images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs

- Use separate `.env` files for each environment
- Never commit secrets to version control
- Use Docker secrets or environment variables in production

## License

This project is licensed under the MIT License.
