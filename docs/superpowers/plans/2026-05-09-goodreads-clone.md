# Goodreads Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user, lightweight book tracker (want / reading / read shelves, ratings, notes) with Open Library search, gated by a single password, deployable to Fly.io.

**Architecture:** One Next.js 15 (App Router) app. Server Components render shelves; Server Actions mutate state. SQLite via `better-sqlite3` for storage. Open Library API for search and cover art. `iron-session` cookie for auth. Tailwind for styling.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, better-sqlite3, iron-session, Open Library API, Fly.io.

**Note on testing:** The spec marks automated testing out of scope for the initial build. Each task ends with a manual verification step in the browser or CLI instead of unit tests.

---

## File Structure

```
package.json
tsconfig.json
next.config.ts
tailwind.config.ts          # if Tailwind 3 scaffolded; otherwise Tailwind 4 inline
postcss.config.mjs
.gitignore
.env.example
.env.local                  # gitignored
fly.toml
Dockerfile
middleware.ts

app/
  globals.css
  layout.tsx                # root layout, fonts, Nav
  page.tsx                  # home, three shelves
  login/page.tsx
  add/page.tsx
  book/[id]/page.tsx
  actions.ts                # all server actions
  api/search/route.ts       # live Open Library typeahead

lib/
  db.ts                     # better-sqlite3 + migrations + typed queries
  session.ts                # iron-session config
  auth.ts                   # password check, session helpers
  openlibrary.ts            # search + cover URL helpers

components/
  Nav.tsx
  StarRating.tsx
  BookCard.tsx
  Shelf.tsx
  StatsStrip.tsx
  SearchBox.tsx             # client component

data/                       # gitignored, holds books.db
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `next-env.d.ts`

- [ ] **Step 1: Run create-next-app in the current directory**

```bash
cd /Users/kailee/goodreads-clone
npx --yes create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --eslint \
  --import-alias "@/*" \
  --turbopack \
  --no-install \
  --use-npm \
  --yes
```

Expected: scaffolds Next.js app into the current directory, alongside the existing `docs/` folder. If `create-next-app` complains the directory is not empty, allow it — `docs/` is fine.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install better-sqlite3 iron-session
npm install --save-dev @types/better-sqlite3
```

Expected: installs without errors. `better-sqlite3` builds a native module — this is normal and may take ~30s.

- [ ] **Step 3: Add `data/` to .gitignore**

Append to `.gitignore`:

```
# Local SQLite database
/data
```

- [ ] **Step 4: Verify dev server boots**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000, default Next.js welcome page renders. Stop the server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "scaffold Next.js app with Tailwind, sqlite, iron-session"
```

---

## Task 2: Theme, fonts, and global styles

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts` (or `app/globals.css` for Tailwind 4)

- [ ] **Step 1: Replace `app/layout.tsx` with branded layout**

```tsx
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "A personal reading tracker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/globals.css` with theme tokens**

If the scaffolded Tailwind is v4 (uses `@import "tailwindcss";`), use this:

```css
@import "tailwindcss";

@theme {
  --color-paper: #FAF7F2;
  --color-ink: #1A1A1A;
  --color-ink-muted: #6B6B6B;
  --color-accent: #7A2E2E;
  --color-card: #FFFFFF;
  --color-line: #E8E2D6;
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-serif), ui-serif, Georgia, serif;
}

html, body { height: 100%; }
```

If Tailwind v3 was scaffolded instead (has `tailwind.config.ts` with `content`), keep the existing `@tailwind base; @tailwind components; @tailwind utilities;` directives and edit `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F2",
        ink: { DEFAULT: "#1A1A1A", muted: "#6B6B6B" },
        accent: "#7A2E2E",
        card: "#FFFFFF",
        line: "#E8E2D6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Replace `app/page.tsx` with a placeholder using the new theme**

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-4xl text-ink">Bookshelf</h1>
      <p className="mt-2 text-ink-muted">Coming together...</p>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser**

```bash
npm run dev
```

Open http://localhost:3000. Expected: warm off-white background, "Bookshelf" in a serif font, muted subtitle. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "add theme, fonts, and base layout"
```

---

## Task 3: SQLite database module

**Files:**
- Create: `lib/db.ts`

- [ ] **Step 1: Create `lib/db.ts` with schema, migration, and typed query helpers**

```ts
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Shelf = "want" | "reading" | "read";

export type Book = {
  id: number;
  olid: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  shelf: Shelf;
  rating: number | null;
  note: string | null;
  date_added: string;
  date_finished: string | null;
};

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "books.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      olid TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      shelf TEXT NOT NULL CHECK (shelf IN ('want','reading','read')),
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      note TEXT,
      date_added TEXT NOT NULL DEFAULT (datetime('now')),
      date_finished TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf);
  `);
  _db = db;
  return db;
}

export function listBooks(shelf?: Shelf): Book[] {
  const db = getDb();
  if (shelf) {
    return db
      .prepare("SELECT * FROM books WHERE shelf = ? ORDER BY date_added DESC")
      .all(shelf) as Book[];
  }
  return db.prepare("SELECT * FROM books ORDER BY date_added DESC").all() as Book[];
}

export function getBook(id: number): Book | undefined {
  return getDb().prepare("SELECT * FROM books WHERE id = ?").get(id) as Book | undefined;
}

export function insertBook(input: {
  olid?: string | null;
  title: string;
  author: string;
  cover_url?: string | null;
  shelf: Shelf;
}): number {
  const db = getDb();
  const dateFinished = input.shelf === "read" ? new Date().toISOString().slice(0, 10) : null;
  const result = db
    .prepare(
      `INSERT INTO books (olid, title, author, cover_url, shelf, date_finished)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.olid ?? null,
      input.title,
      input.author,
      input.cover_url ?? null,
      input.shelf,
      dateFinished
    );
  return Number(result.lastInsertRowid);
}

export function updateBook(
  id: number,
  patch: { shelf?: Shelf; rating?: number | null; note?: string | null; date_finished?: string | null }
): void {
  const db = getDb();
  const existing = getBook(id);
  if (!existing) throw new Error("Book not found");

  let dateFinished = patch.date_finished !== undefined ? patch.date_finished : existing.date_finished;
  if (patch.shelf === "read" && !existing.date_finished && patch.date_finished === undefined) {
    dateFinished = new Date().toISOString().slice(0, 10);
  }

  db.prepare(
    `UPDATE books SET
       shelf = COALESCE(?, shelf),
       rating = ?,
       note = ?,
       date_finished = ?
     WHERE id = ?`
  ).run(
    patch.shelf ?? null,
    patch.rating !== undefined ? patch.rating : existing.rating,
    patch.note !== undefined ? patch.note : existing.note,
    dateFinished,
    id
  );
}

export function deleteBook(id: number): void {
  getDb().prepare("DELETE FROM books WHERE id = ?").run(id);
}

export function shelfCounts(): { want: number; reading: number; read: number; readThisYear: number } {
  const db = getDb();
  const counts = db
    .prepare("SELECT shelf, COUNT(*) AS n FROM books GROUP BY shelf")
    .all() as { shelf: Shelf; n: number }[];
  const byShelf = { want: 0, reading: 0, read: 0 };
  for (const row of counts) byShelf[row.shelf] = row.n;
  const year = new Date().getFullYear();
  const readThisYear = (
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM books WHERE shelf = 'read' AND date_finished LIKE ?"
      )
      .get(`${year}-%`) as { n: number }
  ).n;
  return { ...byShelf, readThisYear };
}
```

- [ ] **Step 2: Smoke test from the CLI**

```bash
node -e "const db=require('./lib/db.ts');" 2>&1 | head -5
```

Expected: this will fail because `node` can't load `.ts` directly. Skip and rely on Next.js to compile it. Instead, do a quick TypeScript check:

```bash
npx tsc --noEmit
```

Expected: no type errors related to `lib/db.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "add sqlite database module with shelf queries"
```

---

## Task 4: Open Library client

**Files:**
- Create: `lib/openlibrary.ts`

- [ ] **Step 1: Create `lib/openlibrary.ts`**

```ts
export type SearchResult = {
  olid: string;
  title: string;
  author: string;
  cover_url: string | null;
};

const SEARCH_URL = "https://openlibrary.org/search.json";

export function coverUrl(coverId: number | null | undefined, size: "S" | "M" | "L" = "M"): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function searchBooks(query: string, limit = 10): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = `${SEARCH_URL}?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);
  const data = (await res.json()) as {
    docs: { key: string; title: string; author_name?: string[]; cover_i?: number }[];
  };
  return data.docs.map((d) => ({
    olid: d.key.replace("/works/", ""),
    title: d.title,
    author: d.author_name?.[0] ?? "Unknown",
    cover_url: coverUrl(d.cover_i),
  }));
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/openlibrary.ts
git commit -m "add Open Library search and cover helpers"
```

---

## Task 5: Session config and auth helpers

**Files:**
- Create: `lib/session.ts`, `lib/auth.ts`, `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
APP_PASSWORD=changeme
SESSION_SECRET=replace-with-32-plus-random-characters
DATABASE_PATH=./data/books.db
```

- [ ] **Step 2: Create `.env.local` for development**

```bash
cat > .env.local <<'EOF'
APP_PASSWORD=devpassword
SESSION_SECRET=dev-session-secret-must-be-at-least-32-characters
EOF
```

Verify `.env.local` is already in the scaffolded `.gitignore` (Next.js default). If not, add it.

- [ ] **Step 3: Create `lib/session.ts`**

```ts
import type { SessionOptions } from "iron-session";

export type SessionData = {
  loggedIn?: boolean;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "bookshelf_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};
```

- [ ] **Step 4: Create `lib/auth.ts`**

```ts
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./session";

export async function getSession() {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return session.loggedIn === true;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/session.ts lib/auth.ts .env.example
git commit -m "add session config and password auth helpers"
```

---

## Task 6: Auth middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./lib/session";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

`iron-session` v8 supports the `(req, res, options)` form in middleware — the response object is needed so iron-session can refresh the cookie if the session was rotated.

- [ ] **Step 2: Type-check and run dev server**

```bash
npx tsc --noEmit
npm run dev
```

Open http://localhost:3000. Expected: redirect to `/login?next=/`. The `/login` page doesn't exist yet, so you'll see a 404 — that's fine; we'll build it next. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "gate routes behind iron-session login"
```

---

## Task 7: Login page and login/logout actions

**Files:**
- Create: `app/login/page.tsx`, `app/actions.ts`

- [ ] **Step 1: Create `app/actions.ts` with login/logout**

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, checkPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!checkPassword(password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const session = await getSession();
  session.loggedIn = true;
  await session.save();
  redirect(next || "/");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  revalidatePath("/");
  redirect("/login");
}
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```tsx
import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-serif text-3xl text-ink">Bookshelf</h1>
      <p className="mt-1 text-ink-muted text-sm">Enter the password to continue.</p>

      <form action={loginAction} className="mt-8 space-y-3">
        <input type="hidden" name="next" value={next ?? "/"} />
        <input
          autoFocus
          required
          type="password"
          name="password"
          placeholder="Password"
          className="w-full rounded border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-accent">Incorrect password.</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent px-3 py-2 text-paper hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

```bash
npm run dev
```

Open http://localhost:3000. Expected: redirect to `/login`. Enter the wrong password — see "Incorrect password." Enter `devpassword` — redirect to `/` and see the placeholder home page. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/login app/actions.ts
git commit -m "add login page with password gate"
```

---

## Task 8: Nav with logout

**Files:**
- Create: `components/Nav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/Nav.tsx`**

```tsx
import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function Nav() {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl text-ink hover:text-accent">
          Bookshelf
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/add" className="text-ink hover:text-accent">
            + Add book
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-ink-muted hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Modify `app/layout.tsx` to include Nav**

Replace the body contents:

```tsx
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Nav } from "@/components/Nav";
import { isLoggedIn } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "A personal reading tracker.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const showNav = await isLoggedIn();
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {showNav && <Nav />}
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify in the browser**

```bash
npm run dev
```

Sign in, see the nav with "Bookshelf", "+ Add book", "Sign out". Click Sign out — back to login. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/Nav.tsx app/layout.tsx
git commit -m "add nav with logout"
```

---

## Task 9: Star rating component

**Files:**
- Create: `components/StarRating.tsx`

- [ ] **Step 1: Create `components/StarRating.tsx`**

```tsx
"use client";

import { useState } from "react";

type Props = {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  const px = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className={`inline-flex gap-0.5 ${px}`} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onClick={() => onChange?.(value === n ? null : n)}
          className={`leading-none ${readOnly ? "cursor-default" : "cursor-pointer"} ${
            n <= display ? "text-accent" : "text-line"
          }`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/StarRating.tsx
git commit -m "add star rating component"
```

---

## Task 10: BookCard and Shelf components

**Files:**
- Create: `components/BookCard.tsx`, `components/Shelf.tsx`

- [ ] **Step 1: Create `components/BookCard.tsx`**

```tsx
import Link from "next/link";
import type { Book } from "@/lib/db";
import { StarRating } from "./StarRating";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group block w-32 shrink-0 sm:w-36"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded border border-line bg-card shadow-sm transition group-hover:shadow-md">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-end p-3 bg-gradient-to-b from-line/30 to-line/10">
            <p className="font-serif text-sm leading-tight text-ink">{book.title}</p>
            <p className="mt-1 text-[11px] text-ink-muted">{book.author}</p>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-sm text-ink">{book.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{book.author}</p>
        {book.rating != null && (
          <div className="mt-1">
            <StarRating value={book.rating} readOnly size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `components/Shelf.tsx`**

```tsx
import type { Book } from "@/lib/db";
import { BookCard } from "./BookCard";

type Props = {
  title: string;
  books: Book[];
  emptyHint?: string;
};

export function Shelf({ title, books, emptyHint }: Props) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        <span className="text-xs text-ink-muted">{books.length}</span>
      </div>
      {books.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{emptyHint ?? "Nothing here yet."}</p>
      ) : (
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Allow Open Library cover hostnames in `next.config.ts`**

We're using a plain `<img>` tag in `BookCard`, so this is optional. Skip unless you switch to `next/image`.

- [ ] **Step 4: Commit**

```bash
git add components/BookCard.tsx components/Shelf.tsx
git commit -m "add book card and shelf components"
```

---

## Task 11: Stats strip and home page

**Files:**
- Create: `components/StatsStrip.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `components/StatsStrip.tsx`**

```tsx
import { shelfCounts } from "@/lib/db";

export function StatsStrip() {
  const c = shelfCounts();
  const year = new Date().getFullYear();
  return (
    <p className="text-sm text-ink-muted">
      <span className="text-ink">{c.readThisYear}</span> read in {year}
      <span className="mx-2">·</span>
      <span className="text-ink">{c.reading}</span> reading
      <span className="mx-2">·</span>
      <span className="text-ink">{c.want}</span> to read
    </p>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { listBooks } from "@/lib/db";
import { Shelf } from "@/components/Shelf";
import { StatsStrip } from "@/components/StatsStrip";

export const dynamic = "force-dynamic";

export default function Home() {
  const reading = listBooks("reading");
  const want = listBooks("want");
  const read = listBooks("read");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl text-ink">My shelves</h1>
        <StatsStrip />
      </div>

      <Shelf
        title="Reading"
        books={reading}
        emptyHint="Nothing in progress. Start a book from your wishlist or add a new one."
      />
      <Shelf
        title="Want to read"
        books={want}
        emptyHint="No wishlist yet — add a book to get started."
      />
      <Shelf
        title="Read"
        books={read}
        emptyHint="Finished books will land here."
      />
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

```bash
npm run dev
```

Sign in. Expected: home page shows three empty shelves with hints, stats strip reads "0 read in 2026 · 0 reading · 0 to read". Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/StatsStrip.tsx app/page.tsx
git commit -m "render shelves and stats on home page"
```

---

## Task 12: Live search API route

**Files:**
- Create: `app/api/search/route.ts`

- [ ] **Step 1: Create `app/api/search/route.ts`**

```ts
import { NextResponse } from "next/server";
import { searchBooks } from "@/lib/openlibrary";
import { isLoggedIn } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await searchBooks(q, 10);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "upstream", message: String(e) }, { status: 502 });
  }
}
```

- [ ] **Step 2: Update `middleware.ts` matcher to skip `/api/search`**

The session cookie check works fine for `/api/search` since it requires login, but the middleware redirects to `/login` on failure — for an API call we want a JSON 401 instead. Add `api/search` to the matcher exclusion. Replace the `config` export in `middleware.ts`:

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
```

The route handler enforces auth itself via `isLoggedIn()`.

- [ ] **Step 3: Verify in the browser (signed in)**

```bash
npm run dev
```

In a logged-in browser tab, visit http://localhost:3000/api/search?q=dune. Expected: JSON with up to 10 Dune-related books, each with `olid`, `title`, `author`, `cover_url`. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/api/search middleware.ts
git commit -m "add Open Library search API route"
```

---

## Task 13: SearchBox client component

**Files:**
- Create: `components/SearchBox.tsx`

- [ ] **Step 1: Create `components/SearchBox.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Result = {
  olid: string;
  title: string;
  author: string;
  cover_url: string | null;
};

type Props = {
  onPick: (result: Result) => void;
};

export function SearchBox({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError(null);
      return;
    }
    const myseq = ++seq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results: Result[] };
        if (seq.current === myseq) setResults(data.results);
      } catch {
        if (seq.current === myseq) setError("Couldn't reach Open Library — try again.");
      } finally {
        if (seq.current === myseq) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <input
        autoFocus
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title or author…"
        className="w-full rounded border border-line bg-card px-3 py-2 outline-none focus:border-accent"
      />
      {loading && <p className="mt-3 text-sm text-ink-muted">Searching…</p>}
      {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      {!loading && results.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded border border-line bg-card">
          {results.map((r) => (
            <li key={r.olid + r.title}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="flex w-full items-center gap-4 p-3 text-left hover:bg-paper"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-line bg-paper">
                  {r.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{r.title}</p>
                  <p className="truncate text-xs text-ink-muted">{r.author}</p>
                </div>
                <span className="text-sm text-accent">Pick →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/SearchBox.tsx
git commit -m "add debounced Open Library search box"
```

---

## Task 14: Add page

**Files:**
- Modify: `app/actions.ts`
- Create: `app/add/page.tsx`, `app/add/AddForm.tsx`

- [ ] **Step 1: Add `addBookAction` to `app/actions.ts`**

Add `import { insertBook, type Shelf } from "@/lib/db";` to the imports at the top of the file. Then append the function to the bottom:

```ts
export async function addBookAction(formData: FormData) {
  const olid = (formData.get("olid") as string) || null;
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const cover_url = (formData.get("cover_url") as string) || null;
  const shelf = String(formData.get("shelf") ?? "want") as Shelf;

  if (!title || !author) {
    redirect("/add?error=missing");
  }
  if (!["want", "reading", "read"].includes(shelf)) {
    redirect("/add?error=shelf");
  }

  const id = insertBook({ olid, title, author, cover_url, shelf });
  revalidatePath("/");
  redirect(`/book/${id}`);
}
```

(The `redirect` and `revalidatePath` imports are already at the top of `actions.ts` from Task 7.)

- [ ] **Step 2: Create `app/add/AddForm.tsx`** (client wrapper)

```tsx
"use client";

import { useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { addBookAction } from "@/app/actions";

type Picked = {
  olid: string;
  title: string;
  author: string;
  cover_url: string | null;
};

export function AddForm() {
  const [picked, setPicked] = useState<Picked | null>(null);

  if (!picked) {
    return <SearchBox onPick={setPicked} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setPicked(null)}
        className="text-sm text-ink-muted hover:text-accent"
      >
        ← Search again
      </button>

      <div className="mt-4 flex gap-4">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded border border-line bg-card">
          {picked.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picked.cover_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-serif text-lg text-ink">{picked.title}</p>
          <p className="text-sm text-ink-muted">{picked.author}</p>
        </div>
      </div>

      <form action={addBookAction} className="mt-6 space-y-4">
        <input type="hidden" name="olid" value={picked.olid} />
        <input type="hidden" name="title" value={picked.title} />
        <input type="hidden" name="author" value={picked.author} />
        <input type="hidden" name="cover_url" value={picked.cover_url ?? ""} />

        <fieldset>
          <legend className="text-sm text-ink">Add to which shelf?</legend>
          <div className="mt-2 flex gap-4 text-sm">
            {[
              { v: "want", label: "Want to read" },
              { v: "reading", label: "Reading" },
              { v: "read", label: "Read" },
            ].map((opt, i) => (
              <label key={opt.v} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="shelf"
                  value={opt.v}
                  defaultChecked={i === 0}
                  className="accent-accent"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-paper hover:opacity-90"
        >
          Add to shelf
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/add/page.tsx`**

```tsx
import { AddForm } from "./AddForm";

export default function AddPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-ink">Add a book</h1>
      <p className="mt-1 text-sm text-ink-muted">Search Open Library, then pick a shelf.</p>
      <div className="mt-6">
        <AddForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser**

```bash
npm run dev
```

Sign in, click "+ Add book". Search for "the hobbit". Pick a result. Choose "Reading" and submit. Expected: redirect to a `/book/<id>` page (will 404 until Task 15 — that's fine for now). Visit `/` — the book appears under "Reading" with its cover. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add app/add app/actions.ts
git commit -m "add page with Open Library search and shelf picker"
```

---

## Task 15: Book detail page with edit + delete

**Files:**
- Modify: `app/actions.ts`
- Create: `app/book/[id]/page.tsx`, `app/book/[id]/EditForm.tsx`

- [ ] **Step 1: Add `updateBookAction` and `deleteBookAction` to `app/actions.ts`**

Update the existing `import { insertBook, type Shelf } from "@/lib/db";` line to also pull in the update/delete helpers. After this task, that import should read:

```ts
import { insertBook, updateBook as dbUpdate, deleteBook as dbDelete, type Shelf } from "@/lib/db";
```

Then append the actions to the bottom of the file:

```ts
export async function updateBookAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) redirect("/");

  const shelf = String(formData.get("shelf") ?? "") as Shelf;
  const ratingRaw = String(formData.get("rating") ?? "");
  const note = String(formData.get("note") ?? "");
  const dateFinished = String(formData.get("date_finished") ?? "");

  const rating = ratingRaw === "" ? null : Number(ratingRaw);

  dbUpdate(id, {
    shelf: ["want", "reading", "read"].includes(shelf) ? shelf : undefined,
    rating: rating === null ? null : Math.max(1, Math.min(5, rating)),
    note: note || null,
    date_finished: dateFinished || null,
  });

  revalidatePath("/");
  revalidatePath(`/book/${id}`);
  redirect(`/book/${id}`);
}

export async function deleteBookAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (id) dbDelete(id);
  revalidatePath("/");
  redirect("/");
}
```

The `dbUpdate`/`dbDelete` aliases avoid name clashes with the `updateBookAction`/`deleteBookAction` exports.

- [ ] **Step 2: Create `app/book/[id]/EditForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { updateBookAction, deleteBookAction } from "@/app/actions";
import type { Book } from "@/lib/db";

export function EditForm({ book }: { book: Book }) {
  const [rating, setRating] = useState<number | null>(book.rating);

  return (
    <div className="space-y-6">
      <form action={updateBookAction} className="space-y-5">
        <input type="hidden" name="id" value={book.id} />
        <input type="hidden" name="rating" value={rating ?? ""} />

        <fieldset>
          <legend className="text-sm text-ink">Shelf</legend>
          <div className="mt-2 flex gap-4 text-sm">
            {[
              { v: "want", label: "Want to read" },
              { v: "reading", label: "Reading" },
              { v: "read", label: "Read" },
            ].map((opt) => (
              <label key={opt.v} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="shelf"
                  value={opt.v}
                  defaultChecked={book.shelf === opt.v}
                  className="accent-accent"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="text-sm text-ink">Rating</label>
          <div className="mt-1">
            <StarRating value={rating} onChange={setRating} />
            {rating != null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="ml-3 text-xs text-ink-muted hover:text-accent"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="note" className="text-sm text-ink">Note</label>
          <textarea
            id="note"
            name="note"
            defaultValue={book.note ?? ""}
            rows={4}
            className="mt-1 w-full rounded border border-line bg-card px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="date_finished" className="text-sm text-ink">Date finished</label>
          <input
            id="date_finished"
            type="date"
            name="date_finished"
            defaultValue={book.date_finished ?? ""}
            className="mt-1 rounded border border-line bg-card px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-paper hover:opacity-90"
        >
          Save
        </button>
      </form>

      <form action={deleteBookAction}>
        <input type="hidden" name="id" value={book.id} />
        <button
          type="submit"
          className="text-sm text-ink-muted hover:text-accent"
          onClick={(e) => {
            if (!confirm("Delete this book?")) e.preventDefault();
          }}
        >
          Delete book
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/book/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBook } from "@/lib/db";
import { EditForm } from "./EditForm";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBook(Number(id));
  if (!book) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-ink-muted hover:text-accent">
        ← Back to shelves
      </Link>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="h-72 w-48 shrink-0 overflow-hidden rounded border border-line bg-card shadow">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ink-muted">
              No cover
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-serif text-3xl text-ink">{book.title}</h1>
          <p className="mt-1 text-ink-muted">{book.author}</p>
          <p className="mt-4 text-xs text-ink-muted">
            Added {new Date(book.date_added).toLocaleDateString()}
          </p>

          <div className="mt-8">
            <EditForm book={book} />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser**

```bash
npm run dev
```

Add a book (Task 14 flow). On the resulting `/book/[id]` page: change shelf, set a rating, write a note, save. Confirm the home page reflects the changes (rating shows on the card, book moved shelves). Try Delete — confirm and check the home page. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add app/book app/actions.ts
git commit -m "add book detail page with edit and delete"
```

---

## Task 16: Polish — remove default Next.js favicon and unused files

**Files:**
- Remove: `public/next.svg`, `public/vercel.svg` (if scaffolded)

- [ ] **Step 1: Remove default Next.js public assets**

```bash
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

(`rm -f` won't error if a file is missing.)

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "remove unused default public assets"
```

---

## Task 17: Dockerfile and Fly.io config

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `fly.toml`
- Modify: `next.config.ts`

- [ ] **Step 1: Enable standalone output in `next.config.ts`**

Replace contents:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
.git
data
.env
.env.local
docs
```

- [ ] **Step 3: Create `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && npm ci \
  && apt-get purge -y --auto-remove python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/books.db
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 4: Create `fly.toml`**

```toml
app = "bookshelf"
primary_region = "iad"

[build]

[env]
  DATABASE_PATH = "/data/books.db"
  PORT = "3000"

[[mounts]]
  source = "bookshelf_data"
  destination = "/data"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

(Customize `app` name and `primary_region` if needed before deploying.)

- [ ] **Step 5: Verify the local build still works**

```bash
npm run build
```

Expected: `▲ Next.js 15.x` build output ends with `✓ Compiled successfully`. The `.next/standalone/server.js` exists.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore fly.toml next.config.ts
git commit -m "add Dockerfile and Fly.io config for deployment"
```

---

## Task 18: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
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

Next.js 15, TypeScript, Tailwind, better-sqlite3, iron-session, Open Library API.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "add README"
```

---

## Task 19: End-to-end manual smoke test

**Files:** none

- [ ] **Step 1: Start fresh-feeling**

```bash
rm -f data/books.db
npm run dev
```

- [ ] **Step 2: Walk through the full flow**

1. Visit http://localhost:3000 → redirected to `/login`.
2. Wrong password → "Incorrect password."
3. Right password → home page, three empty shelves.
4. Add → search "the great gatsby" → pick a result → "Want to read" → submit.
5. On detail page: change shelf to "Read", give 4 stars, add a note, save.
6. Home: book is on Read shelf, shows 4 stars, stats strip shows "1 read in 2026 · 0 reading · 0 to read".
7. Click the book → Delete book → confirm → back to home, gone from shelves.
8. Sign out → redirected to `/login`.

All eight steps pass.

- [ ] **Step 3: Final commit if anything fell out**

```bash
git status
# if clean, you're done. Otherwise commit any small fixes you made.
```

---

## Self-Review Notes

- Spec coverage: shelves ✓ (Task 11), Open Library search ✓ (Tasks 12–14), star rating + note + date finished ✓ (Task 15), single-password auth ✓ (Tasks 5–7), look & feel ✓ (Task 2, 10), deploy ✓ (Task 17), data model exactly matches Task 3 schema.
- Out-of-scope items (reading goals, tags, page tracking, CSV import) are not in any task.
- Type names are consistent: `Shelf` and `Book` exported from `lib/db.ts` and used in components/actions.
- Action names are consistent: `loginAction`, `logoutAction`, `addBookAction`, `updateBookAction`, `deleteBookAction`.
