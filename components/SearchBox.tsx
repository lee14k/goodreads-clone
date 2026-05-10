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
