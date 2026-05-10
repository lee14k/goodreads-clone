import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-serif text-3xl text-ink">Bookshelf</h1>
      <p className="mt-1 text-ink-muted text-sm">Enter the password to continue.</p>

      <form action={loginAction} className="mt-8 space-y-3">
        <input type="hidden" name="next" value={next ?? "/"} />
        <input
          autoFocus
          required
          type="password"
          name="password"
          placeholder="Password"
          className="w-full rounded border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-accent">Incorrect password.</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent px-3 py-2 text-paper hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
