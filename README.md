# fedexr-v1

Full FedEx-style site: **React frontend** (`app/`) + **API backend** (`api/`) + **Neon Postgres**.

Built from the original [fedexr](https://github.com/Phillipjr9/fedexr) codebase with admin Neon wiring, tracking, and fixed routes.

## Structure

```
app/          # Vite + React + TypeScript frontend
api/          # Serverless API (Vercel) — track, admin, images
migrations/   # SQL for Neon
scripts/      # migrate helpers
```

## Setup

```bash
cd app
npm install
cp ../.env.example ../.env.local
# fill DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD
npm run dev
```

## Admin

- URL: `/admin`
- Username / password from env: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
