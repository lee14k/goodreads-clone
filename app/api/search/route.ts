import { NextResponse } from "next/server";
import { searchBooks } from "@/lib/openlibrary";
import { isLoggedIn } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await searchBooks(q, 10);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "upstream", message: String(e) }, { status: 502 });
  }
}
