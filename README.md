# Focus Flow Senior Seminar Project

## Overview

Focus Flow is a full-stack assignment management application that allows users to input assignments, text to speech, extract key details, and organize their workload efficiently.

### Tech Stack

**Frontend**

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

**Backend**

* NestJS (REST API)
* PostgreSQL

---

## Repository Structure

This project uses a **monorepo structure**, meaning both frontend and backend live in the same repository.

```
root/
│
├── apps/
│   ├── web/                # Frontend (Next.js)
│   │   ├── app/            # App router pages
│   │   ├── components/     # UI components
│   │   └── lib/            # Utility functions
│   │
│   └── api/                # Backend (NestJS)
│       ├── src/
│       │   ├── main.ts     # Backend entry point
│       │   ├── modules/    # Feature modules
│       │   └── services/   # Business logic
│
├── package.json            # Root scripts (runs both apps)
├── package-lock.json
└── README.md
```

---

## Entry Points

* **Frontend entry point:**
  `apps/web/app/page.tsx`

* **Backend entry point:**
  `apps/api/src/main.ts`

---

## Prerequisites

Ensure you have:

* Node.js `20.x` (LTS)
* npm

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

---

### 2. Install dependencies (from root)

```bash
npm install
```

---

### 3. Configure environment variables

Environment variables are not committed for security reasons. Values are shared separately.

#### Frontend

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local` and add the required values.

---

#### Backend

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `.env` and add the required values.

---

### 4. Run the application

From the root directory:

```bash
npm run dev
```

This runs both frontend and backend concurrently.

* Frontend: http://localhost:3000
* Backend API: http://localhost:4000

---

## Running Tests

To run tests:

```bash
npm test
```
---

## Available Scripts

From the root directory:

```bash
npm run dev      # Start frontend + backend
npm run format   # Format code using Prettier
npm test         # Run tests (if available)
```

---

## Code Formatting

This project uses **Prettier** and **Tailwind** for consistent formatting and styling.

Before committing changes:

```bash
npm run format
```
Tailwind is imported using:
@import "tailwindcss";

---

## Backend Overview

The backend is built using **NestJS** and exposes REST endpoints.

### Example Endpoints

* `GET /assignments?userId=...` → Fetch assignments
* `POST /assignments` → Create assignment
* `PATCH /assignments/:id` → Update assignment
* `DELETE /assignments/:id` → Delete assignment

The backend connects to a PostgreSQL database and handles all data persistence. The database link can be provided by a team member or Professor Superdock.

---

## Frontend Overview

The frontend is built using **Next.js App Router**.

Key features:

* Assignment input page (paste raw assignment text)
* AI-based extraction of assignment details
* Text to speech (PDFs and text)
* Editable assignment fields (title, due date, course, etc.)
* Checklist + summary generation
* Calendar view for due dates

---

## Repository Notes / Best Practices

* `.env` files are **not committed** for security reasons
* Database URL and OpenAI Key stored in .env (OpenAI Keys can be personal or ask a team member for theirs).
* The `.idea/` folder should not be committed (IDE-specific files)
* Only one `package-lock.json` should exist at the root
* Non-essential files (e.g., audio files) should not be committed unless required

---

## Monorepo Notes

This project uses multiple `package.json` files:

* Root → shared scripts (e.g., `npm run dev`)
* `apps/web` → frontend dependencies
* `apps/api` → backend dependencies

This is **standard practice** for full-stack monorepos.

---

## Contributors

* Lizzy Cronin
* Riley Schutt
* Jordan Henderson

---

