# InsightBoard

A full-stack monorepo application that converts meeting transcripts into structured task dependency graphs using AI. Upload a `.txt` transcript file and the app uses Google Gemini to extract tasks and record their dependencies.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, MUI, Tailwind CSS
- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM
- **Database:** PostgreSQL 16
- **LLM:** Google Gemini 2.0 Flash
- **Monorepo tooling:** pnpm workspaces, Turborepo

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/installation) v9 — `npm install -g pnpm@9`
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd insightboard
```

### 2. Install dependencies

From the root of the monorepo:

```bash
pnpm install
```

### 3. Start the database

The project uses PostgreSQL via Docker Compose. From the repo root:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 instance on port `5432` with:

- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `insightboard`

Data is persisted in a Docker volume (`postgres_data`).

### 4. Configure environment variables

Create a `.env` file in `apps/backend/`:

```env
# apps/backend/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insightboard"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 5. Run database migrations

From the `apps/backend` directory:

```bash
cd apps/backend
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

---

## Running the App

### Development mode (both apps at once)

From the repo root:

```bash
pnpm dev
```

Turborepo will start both apps in parallel:

| App      | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:4000 |

### Run apps individually

**Backend only:**

```bash
cd apps/backend
pnpm dev
```

**Frontend only:**

```bash
cd apps/web
pnpm dev
```

---
