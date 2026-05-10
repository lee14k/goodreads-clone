import { AddForm } from "./AddForm";

export default function AddPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-3xl text-ink">Add a book</h1>
      <p className="mt-1 text-sm text-ink-muted">Search Open Library, then pick a shelf.</p>
      <div className="mt-6">
        <AddForm />
      </div>
    </main>
  );
}
