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
