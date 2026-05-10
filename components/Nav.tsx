import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function Nav() {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl text-ink hover:text-accent">
          Bookshelf
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/add" className="text-ink hover:text-accent">
            + Add book
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-ink-muted hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
