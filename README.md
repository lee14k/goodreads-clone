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

## Deploy to Fly.io

```bash
fly launch --no-deploy --copy-config
fly volumes create bookshelf_data --size 1 --region iad
fly secrets set APP_PASSWORD=... SESSION_SECRET=...
fly deploy
```

Data lives on the `/data` volume as `books.db`.

## Stack

Next.js 16, TypeScript, Tailwind 4, better-sqlite3, iron-session, Open Library API.
