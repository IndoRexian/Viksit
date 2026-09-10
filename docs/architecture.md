# Viksit System Architecture

Viksit is an AI-powered competency and learning platform for MoSPI statistical officers and administrators.

## High-Level Flow

```text
Officer / Administrator
          |
          v
React Frontend (Vite + TypeScript)
          | REST/JSON + JWT
          v
FastAPI Backend (/api/v1)
          |
          +--> Domain Services --> SQLAlchemy --> SQLite/PostgreSQL
          |    Users, competencies, courses, admin analytics
          |
          +--> Gemini AI
               Assessments, document quizzes, learning mentor
          |
          v
Personalized results, recommendations, progress, and certificates
          |
          v
React Dashboard, Admin Portal, and AI interfaces
```

## Components

```mermaid
graph TB
    User[Officer or Administrator]

    subgraph Frontend[React Frontend]
        UI[Login, dashboards, assessments, courses, document studio, AI mentor]
        State[AuthContext and ThemeContext]
        Client[REST API client with JWT]
    end

    subgraph Backend[FastAPI Backend]
        Gateway[CORS, validation, exception handling]
        Auth[JWT authentication and RBAC]
        Routes[Users, competencies, courses, AI, admin, health routes]
        Services[User, FRAC, course, admin, and AI services]
    end

    subgraph External[Persistence and AI]
        DB[(SQLite / PostgreSQL)]
        Gemini[Google Gemini]
        Docs[MoSPI and NSSO documents]
    end

    User --> UI --> State --> Client
    Client -->|HTTP JSON + JWT| Gateway
    Gateway --> Auth --> Routes --> Services
    Services --> DB
    Services --> Gemini
    Docs -->|Grounded quiz generation| Gemini
    Gemini -->|Structured results and validated enrollment intent| Services
```

## Main Data Flows

### Competency Assessment

1. The dashboard loads the officer's FRAC competency matrix and target levels.
2. The AI service sends competency context to Gemini and receives five structured MCQs.
3. The submitted assessment updates proficiency and dashboard visualizations.
4. Skill gaps are calculated as:

   $$\text{Gap} = \max(0, \text{Target Level} - \text{Assessed Level})$$

### Courses and Enrollment

1. Course recommendations are matched to the officer's largest competency gaps.
2. Enrollment and progress are stored in `user_courses`.
3. Completion records certificate and badge information.
4. The AI mentor may request enrollment, but the backend validates the course and action before writing data.

### Document Quizzes and AI Mentor

1. An officer or trainer uploads a MoSPI/NSSO PDF, TXT, or DOCX document.
2. Gemini generates a source-grounded quiz with options, answers, explanations, and competency tags.
3. The mentor receives sanitized profile, gap, course, quiz, and document context.
4. It provides learning guidance and can perform enrollment only through a server-validated action.

### Administration

Administrators use the protected admin portal to view cadre metrics, inspect officer competency gaps, manage courses, and apply competency overrides with remarks.

## Persistence Model

```mermaid
erDiagram
    USERS ||--o{ USER_COURSES : enrolls
    USERS ||--o{ USER_COMPETENCIES : assessed_in
    COURSES ||--o{ USER_COURSES : contains
    COMPETENCIES ||--o{ USER_COMPETENCIES : evaluates

    USERS {
        bigint id PK
        text username
        text name
        text department
        text role
    }

    COURSES {
        bigint id PK
        text name
        text tags
        text description
    }

    USER_COURSES {
        bigint user_id FK
        bigint course_id FK
        int progress
        text status
        text certificate_id
    }

    COMPETENCIES {
        bigint id PK
        text code
        text name
        text category
        text target_levels
    }

    USER_COMPETENCIES {
        bigint user_id FK
        bigint competency_id FK
        int assessed_level
        text status
    }
```

## API and Security

All application routes are under `/api/v1`:

| Route | Purpose |
| --- | --- |
| `/users`, `/auth` | Registration, login, and profiles |
| `/competencies` | FRAC matrix and assessments |
| `/courses` | Catalog, recommendations, enrollment, and progress |
| `/ai` | Gemini assessments, document quizzes, and mentor chat |
| `/admin` | Analytics, course management, and overrides |
| `/health` | Service health |

- JWT authentication and role-based access protect officer and administrator workflows.
- Pydantic validation and centralized exception handling keep API responses consistent.
- Prompts and uploaded content are sanitized before entering AI context.
- AI actions are restricted to enrollment and validated server-side.
