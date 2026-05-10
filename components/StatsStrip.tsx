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
