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
