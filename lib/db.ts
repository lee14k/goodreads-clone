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
