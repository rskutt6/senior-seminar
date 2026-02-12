### Frontend

- **Next.js** (React, App Router)
- **TypeScript**

## Backend

- **NestJS**

Enure you have:

- Node.js 20.x (LTS)
- npm

## Setup

1. Clone repository
2. Install dependencies (from root)
   - npm install

3. Configure environment variables (not committed to GitHub)
   - cp apps/web/.env.example apps/web/.env.local --> (inside .env.local)
   - In text group chat
4. Backend (NestJS)
   - cp apps/api/.env.example apps/api/.env --> (inside .env) In text group chat
5. Running frontend and backend toegther
   - npm run dev
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
6. Uses **Prettier** to help with formatting
   - Before committing changes run --> npm run format
