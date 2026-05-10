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
