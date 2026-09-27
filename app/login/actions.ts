"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth";
import { getUserByName } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = getUserByName(name);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Prénom ou mot de passe incorrect." };
  }
  await setSessionCookie(user.id);
  redirect("/");
}
