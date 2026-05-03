# Focus Flow Senior Seminar Project

## Overview

Focus Flow is a full-stack assignment management application that allows users to input assignments, text to speech, extract key details using AI, and organize their workload efficiently.

---

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

### Backend
- NestJS (REST API)
- PostgreSQL
- Prisma ORM

---

## 📁 Repository Structure

This project uses a **monorepo architecture**, where both frontend and backend live in the same repository and are managed using npm workspaces.
## 📁 Repository Structure

This project uses a **monorepo architecture**, where both frontend and backend live in the same repository and are managed using npm workspaces.

root/
│
├── apps/
│ ├── web/ # Frontend (Next.js)
│ │ ├── app/ # Pages (App Router)
│ │ ├── components/ # UI components
│ │ └── lib/ # Utility/helper functions
│ │
│ └── api/ # Backend (NestJS)
│ ├── src/
│ │ ├── main.ts # Backend entry point
│ │ ├── modules/ # Feature modules
│ │ └── services/ # Business logic
│
├── package.json # Root scripts (runs both apps)
├── package-lock.json
└── README.md
---

## Entry Points

- Frontend: apps/web/app/page.tsx
- Backend: apps/api/src/main.ts

---

## Prerequisites

Make sure you have:

- Node.js 20.x
- npm

---

## Getting Started (Development Setup)

### 1. Clone the repository

git clone <your-repo-url>
cd <repo-name>

---

### 2. Install dependencies

npm install

This installs dependencies for both frontend and backend via workspaces.

---

### 3. Configure environment variables

Environment variables are not committed for security reasons.

Frontend:

cp apps/web/.env.example apps/web/.env.local

Backend:

cp apps/api/.env.example apps/api/.env

Then fill in required values:
- Database URL
- OpenAI API key

---

### 4. Run the application

npm run dev

This runs both services concurrently:

- Frontend → http://localhost:3000
- Backend → http://localhost:4000

---

## Running Tests

npm test

- Backend: Jest + Supertest
- Frontend: Testing Library + Jest

---

## Available Scripts

npm run dev      # Run frontend + backend
npm run format   # Format code with Prettier
npm test         # Run tests

---

## Styling (Tailwind CSS)

This project uses Tailwind CSS for styling.

Tailwind is imported globally using:

@import "tailwindcss";

It is used throughout the frontend for:
- Layout
- Spacing
- Component styling
- Responsive design

---

## Hidden files

.env is not pushed for security. This is where the database URL and OpenAI key are stored. This information can be retrieved by asking a team member(listed below) or asking Professor Superdock for the URL. You can also use a personal OpenAI Key to handle the AI work.

---

## Application Architecture

### High-Level Flow

1. User inputs assignment text (frontend)
2. Frontend sends data to backend API
3. Backend:
   - Extracts structured data (AI)
   - Stores assignment in PostgreSQL
4. Frontend displays:
   - Editable assignment fields
   - AI-generated summary
   - Checklist + calendar view
  
1. User inputs a PDF or text file
2. Frontend sends data to backend API
3. Backend:
   - Extract information
   - Creates an audio file
4. Frontend displays:
   - Play generated audio
   - Library of all saved files

---

## Backend Overview

Built with NestJS, following a modular structure.

### Example Endpoints

- GET /assignments?userId=... → Fetch assignments
- POST /assignments → Create assignment
- PATCH /assignments/:id → Update assignment
- DELETE /assignments/:id → Delete assignment

Handles:
- Database interactions (PostgreSQL + Prisma)
- AI integration
- Business logic

---

## Frontend Overview

Built with Next.js App Router. Tailwind is used to make sure there is comprehensive formatting and look. React.js is used for functionality.

### Features

- Assignment input page
- AI-powered extraction of:
  - Title
  - Due date
  - Course
  - Weight
- Editable assignment fields
- AI summary generation
- Step-by-step checklist
- Text to speech audio library
- Calendar view

---

## Monorepo Notes

This project uses multiple package.json files:

- Root → shared scripts (npm run dev)
- apps/web → frontend dependencies
- apps/api → backend dependencies

This is standard practice for full-stack applications.

---

## Repository Best Practices

- .env files are not committed
- .idea/ is ignored (IDE-specific files)

---

## Contributors

- Lizzy Cronin
- Riley Schutt
- Jordan Henderson

