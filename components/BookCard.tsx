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
