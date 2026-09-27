# Full-Stack CRUD Application

A submission-ready full-stack application built with:
- Frontend: Next.js (App Router) + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQLite
- Authentication: JWT + bcrypt

## Features
- User registration and login
- JWT-protected CRUD API
- Responsive dashboard
- Create, read, update and delete records
- Search records
- Form validation and error handling
- SQLite persistence
- CORS configuration

## Demo credentials
The seed script creates:
- Email: `admin@example.com`
- Password: `Admin@123`

## Run locally

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:4000`.

### 2. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

The frontend is configured to call `http://localhost:4000/api` by default.

## Production build
```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm start
```

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/records`
- `POST /api/records`
- `PUT /api/records/:id`
- `DELETE /api/records/:id`
- `GET /api/health`

## Hosting
For deployment, host the Next.js frontend on Vercel and the Express backend on Render/Railway/Fly.io. Set `NEXT_PUBLIC_API_URL` on the frontend to the deployed backend URL and `FRONTEND_URL` on the backend to the deployed frontend URL.
