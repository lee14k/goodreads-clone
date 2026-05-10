# Bookshelf

A personal reading tracker. Three shelves (Want / Reading / Read), star ratings, notes, and Open Library search for real covers and metadata. Single-password gate.

## Run locally

```bash
cp .env.example .env.local
# edit .env.local: set APP_PASSWORD and a 32+ char SESSION_SECRET
npm install
npm run dev
```

Open http://localhost:3000 and sign in with `APP_PASSWORD`.

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway, **New Project → Deploy from GitHub** and pick the repo. Railway detects the `Dockerfile` automatically.
3. **Variables** — add:
   - `APP_PASSWORD` — your password
   - `SESSION_SECRET` — 32+ random characters
   - `DATABASE_PATH=/data/books.db`
4. **Volumes** — attach a new volume to the service, mount path `/data`. (1 GB is plenty.)
5. **Networking** — generate a public domain. Railway sets `PORT` for you; the Dockerfile already listens on it.
6. Deploy.

Data lives on the `/data` volume as `books.db` and survives redeploys.

## Stack

Next.js 16, TypeScript, Tailwind 4, better-sqlite3, iron-session, Open Library API.
