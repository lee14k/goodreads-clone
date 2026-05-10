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
