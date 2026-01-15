# my-backend — Node.js API (fake DB demo)

Overview
- Minimal Express API implementing: auth (register/login), projects, tasks, comments, time logs, and a progress report endpoint.
- Uses a file-backed fake database at `db.json` to make local development simple. Later you can replace this with MongoDB by providing `MONGO_URI` and adding models.

Files of interest
- `server.js` — API implementation and routes.
- `db.js` — small file-backed persistence helpers (reads/writes `db.json`).
- `db.json` — seed data (users, projects, tasks).

Seeded demo accounts
- `admin@example.com` / `password` (role: admin)
- `pm@example.com` / `password` (role: pm)
- `member@example.com` / `password` (role: member)

Run locally (Windows / PowerShell)
1. Install dependencies:

```powershell
cd my-backend
npm install
```

2. Start the server (fake DB used by default):

```powershell
npm run dev   # requires nodemon
# or
npm start
```

3. Optional environment variables
- `USE_FAKE_DB=true` — force fake DB (default when no `MONGO_URI`).
- `MONGO_URI` — if you set this, code currently still uses fake DB until Mongoose models are added.
- `JWT_SECRET` — change default JWT secret for production.

API endpoints (selected)
- `POST /auth/register` { name, email, password } → { user, token }
- `POST /auth/login` { email, password } → { user, token }
- `GET /projects` → list projects
- `POST /projects` (auth) { name, description } → create project
- `GET /projects/:id` → project + tasks
- `POST /projects/:id/tasks` (auth) { title, description, assigneeId }
- `PATCH /tasks/:id` (auth) → update fields (status, title...)
- `POST /tasks/:id/comments` (auth) { text }
- `POST /tasks/:id/logs` (auth) { hours, notes }
- `GET /reports/progress` → progress summary per project

Switching to MongoDB
1. Add `MONGO_URI` to `.env`.
2. Replace or extend `db.js` logic with Mongoose models and calls.
3. Update seed logic if desired.

Security note
- Passwords in `db.json` are hashed; seeded accounts use default password `password` for demo convenience. Change them for any real deployment.
