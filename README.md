# Student Task Manager

A small Node.js + Express + PostgreSQL application for a cloud infrastructure assignment.

## Features

- Create tasks
- View tasks
- Change task status
- Delete tasks
- PostgreSQL persistence
- Health endpoint at `/api/health`

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Run locally

1. Install Node.js and PostgreSQL.
2. Create a PostgreSQL database and user (see `database-setup.sql`).
3. Copy `.env.example` to `.env`.
4. Update `DATABASE_URL` in `.env` with your own database password.
5. Run:

   ```bash
   npm install
   npm start
   ```

6. Open `http://localhost:3000`.

The app creates the `tasks` table automatically at startup.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check app and database connection |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task status |
| DELETE | `/api/tasks/:id` | Delete a task |

## Security notes

- Never commit `.env` or real passwords to GitHub.
- Use a dedicated PostgreSQL user, not the PostgreSQL superuser.
- In AWS, allow SSH only from your own IP address.
- Do not expose PostgreSQL port 5432 to the public internet.
- For a production deployment, add HTTPS and stronger authentication.
