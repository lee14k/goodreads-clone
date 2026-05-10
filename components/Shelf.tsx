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
