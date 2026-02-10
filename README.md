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
   - NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
4. Backend (NestJS)
   - cp apps/api/.env.example apps/api/.env --> (inside .env) PORT=4000
5. Running frontend and backend toegther
   - npm run dev
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
6. Uses **Prettier** to help with formatting
   - Before committing changes run --> npm run format
