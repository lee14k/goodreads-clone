# Goodreads Clone — Design

**Date:** 2026-05-09
**Status:** Approved

## Overview

A lightweight, single-user web app for tracking books read, currently reading, and want to read. Pulls real book metadata and cover art from Open Library so the UI is cover-forward and visually pleasant. Deployable to Fly.io with persistent SQLite storage. Gated by a single shared password.

## Goals

- Track books across three shelves: Want to Read, Reading, Read
- Add books via Open Library search (real titles, authors, covers)
- Rate (1–5 stars) and optionally note each book
- Auto-record date finished when a book moves to Read
- Look "nicer than a list view" — bookish, mobile-friendly
- Lightweight to develop, run, and deploy

## Non-Goals

- Multi-user accounts, friends, social features
- Reading goals / yearly targets
- Tags, genres, custom shelves
- Page-count or reading-session tracking
- Goodreads CSV import
- Full-text search inside notes

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS; serif headings (Lora via `next/font`), clean sans body
- **Database:** SQLite via `better-sqlite3`, single file at `./data/books.db` (overridable via env)
- **External:** Open Library Search + Covers API (no key required)
- **Auth:** `iron-session` cookie, password compared against `APP_PASSWORD` env var
- **Deploy:** Fly.io, 1 GB persistent volume mounted at `/data`, single region

## Architecture

Single Next.js app. No separate API service.

```
Browser ──► Next.js (Server Components + Server Actions) ──► SQLite file
                          │
                          └─► Open Library API (search, covers)
```

- **Server Components** render shelves and book details (no client fetching for the main views).
- **Server Actions** mutate state: add/remove book, change shelf, set rating, edit note, log in/out.
- **One client component** for the Open Library search box (debounced typeahead with results).
- **Auth middleware** redirects unauthenticated requests to `/login`, except for `/login` itself and static assets.

## Data Model

One table. Migrations run on startup if the schema isn't present.

```sql
CREATE TABLE books (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  olid          TEXT,                     -- Open Library work or edition id, nullable for manually-added books
  title         TEXT NOT NULL,
  author        TEXT NOT NULL,
  cover_url     TEXT,                     -- resolved Open Library cover URL, nullable
  shelf         TEXT NOT NULL CHECK (shelf IN ('want', 'reading', 'read')),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  note          TEXT,
  date_added    TEXT NOT NULL DEFAULT (datetime('now')),
  date_finished TEXT                      -- ISO date, set when shelf becomes 'read'
);

CREATE INDEX idx_books_shelf ON books(shelf);
```

Behavior:
- Moving a book to `read` sets `date_finished` to today if it's null. Moving away from `read` does not clear it.
- `rating` is only meaningful for `read` books but allowed on any shelf (not enforced).
- `olid` is informational only; not unique. The same book can be added twice (we don't dedupe — small price for simplicity).

## Routes

| Route        | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| `/`          | Home — three shelves, cover grids, stats strip on top       |
| `/book/[id]` | Detail view — edit shelf, rating, note, date finished       |
| `/add`       | Search Open Library, pick a result, choose initial shelf    |
| `/login`     | Password form                                               |

Server actions (not routes, but listed for completeness):
- `addBook(olid?, title, author, coverUrl?, shelf)`
- `updateBook(id, { shelf?, rating?, note?, dateFinished? })`
- `deleteBook(id)`
- `login(password)`, `logout()`

## Open Library Integration

- Search: `https://openlibrary.org/search.json?q=<query>&limit=10` — returns title, author_name, cover_i, key.
- Covers: `https://covers.openlibrary.org/b/id/<cover_i>-M.jpg` (medium). We store this URL in `cover_url`.
- No caching layer; the search box debounces (~300 ms) and the results list is small.

## Auth Flow

1. `APP_PASSWORD` is set as an env var (Fly secret in prod, `.env.local` in dev).
2. `/login` posts the password to a server action; on match, `iron-session` sets a `loggedIn: true` cookie (30-day expiry, httpOnly, secure in prod).
3. Middleware checks the cookie on every non-login, non-asset request.
4. `logout` action clears the cookie.

Session secret comes from `SESSION_SECRET` env var.

## Look & Feel

- **Palette:** warm off-white background (`#FAF7F2`), near-black text, muted accent (e.g. burgundy `#7A2E2E`) for CTAs and stars.
- **Typography:** Lora (serif) for the site title and book titles in detail view; Inter (sans) for everything else.
- **Layout:** max width ~960px, generous whitespace.
- **Shelves on home:** three sections stacked, each a horizontally-scrollable cover row on mobile / wrap-grid on desktop. Empty shelves show a one-line placeholder.
- **Stats strip:** small inline numbers above the shelves — "12 read this year · 2 reading · 7 to read".
- **Book card:** cover (with a placeholder if missing), title, author, star rating overlay if rated.

## Project Layout

```
app/
  layout.tsx
  page.tsx              # home, three shelves
  login/page.tsx
  add/page.tsx
  book/[id]/page.tsx
  actions.ts            # all server actions
lib/
  db.ts                 # better-sqlite3 setup, migrations
  session.ts            # iron-session config
  openlibrary.ts        # search + cover URL helpers
components/
  BookCard.tsx
  Shelf.tsx
  StarRating.tsx
  SearchBox.tsx         # client component
middleware.ts
data/
  books.db              # gitignored
docs/superpowers/specs/2026-05-09-goodreads-clone-design.md
```

## Deployment

- `Dockerfile` runs `next start` and ensures `/data` is writable.
- `fly.toml` mounts a 1 GB volume at `/data`. `DATABASE_PATH=/data/books.db` env var.
- Secrets via `fly secrets set APP_PASSWORD=… SESSION_SECRET=…`.
- Single region, single machine — fine for a personal app.

## Error Handling

- Open Library failures: the search box shows "Couldn't reach Open Library — try again." The rest of the app keeps working (the DB doesn't depend on it).
- DB write failures: server action returns an error; the page surfaces it inline. No silent failures.
- Missing covers: card falls back to a styled tile with title + author.

## Testing

Out of scope for the initial build. Manual verification in the browser before deploy. (Can revisit if the app grows.)

## Open Questions

None — all decisions made during brainstorming are reflected above.
