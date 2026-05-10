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
