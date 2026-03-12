# InsightBoard

A full-stack monorepo application that converts meeting transcripts into structured task dependency graphs using AI. Upload a `.txt` transcript file and the app uses Google Gemini to extract tasks and record their dependencies.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, MUI, Tailwind CSS
- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM
- **Database:** PostgreSQL 16
- **LLM:** Google Gemini 2.5 Flash
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
git clone git@github.com:sayandip18/insightboard.git
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

### 6. To enter the postgres container from inside the command line in docker desktop

```bash
psql -U postgres -d insightboard
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

**Cycle detection algorithm**

First, construct a graph (adjacency list) from the tasks. Uses a
recursion stack to identify presence of cycle and a path list to track all tasks visited in that cycle.
Finally, it marks all the tasks in a cycle as "Blocked".

**Idempotency logic**

1. Every uploaded file is hashed. Transcript table has an "@unique" column called contentHash.
   This prevents the two similar files from being processed by LLM twice. When POST /upload endpoint
   is called it looks up the transcript by contentHash, if not found only then we proceed.

Note that just to bypass this feature, I have added a checkbox called "Force Regenerate" which removes
old generated dependency graph and makes LLM call on the newly uploaded one.

2. On calling POST /upload, if a matching hashed transcript is found but the job status is Pending/Processing,
   it means that the job already exists and we should not create more jobs for the same. When user tries to upload
   the same transcript before it is done processing, it returns the same job from before.

3. If two concurrent requests are made with identical transcript, one will hit the Prisma unique
   constrain error. This error is gracefully handled and we refetch the already existing transcript and apply
   the same caching/job logic.

4. On server startup, jobs previously in Processing State are set to FAILED. This allows retries. The user has to manually upload that file.

5. On frontend, jobs are stored in local storage, on page refresh, the same job list is restored so user knows
   what transcripts are previously processed.

**Color coding**

Color coding is based on task priority. High priority is red, medium is yellow and low is green.
