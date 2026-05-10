"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, checkPassword } from "@/lib/auth";

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
