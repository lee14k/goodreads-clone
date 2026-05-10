"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, checkPassword } from "@/lib/auth";
import { insertBook, updateBook as dbUpdate, deleteBook as dbDelete, type Shelf } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!checkPassword(password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const session = await getSession();
  session.loggedIn = true;
  await session.save();
  redirect(next || "/");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  revalidatePath("/");
  redirect("/login");
}

export async function addBookAction(formData: FormData) {
  const olid = (formData.get("olid") as string) || null;
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const cover_url = (formData.get("cover_url") as string) || null;
  const shelf = String(formData.get("shelf") ?? "want") as Shelf;

  if (!title || !author) {
    redirect("/add?error=missing");
  }
  if (!["want", "reading", "read"].includes(shelf)) {
    redirect("/add?error=shelf");
  }

  const id = insertBook({ olid, title, author, cover_url, shelf });
  revalidatePath("/");
  redirect(`/book/${id}`);
}

export async function updateBookAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) redirect("/");

  const shelf = String(formData.get("shelf") ?? "") as Shelf;
  const ratingRaw = String(formData.get("rating") ?? "");
  const note = String(formData.get("note") ?? "");
  const dateFinished = String(formData.get("date_finished") ?? "");

  const rating = ratingRaw === "" ? null : Number(ratingRaw);

  dbUpdate(id, {
    shelf: ["want", "reading", "read"].includes(shelf) ? shelf : undefined,
    rating: rating === null ? null : Math.max(1, Math.min(5, rating)),
    note: note || null,
    date_finished: dateFinished || null,
  });

  revalidatePath("/");
  revalidatePath(`/book/${id}`);
  redirect(`/book/${id}`);
}

export async function deleteBookAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (id) dbDelete(id);
  revalidatePath("/");
  redirect("/");
}
