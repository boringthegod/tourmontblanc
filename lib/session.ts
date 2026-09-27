// Lecture/écriture de la session côté Next (cookies). Sépare next/headers de lib/auth.
import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./auth";
import { getUserById, type User } from "./db";

const COOKIE = "tmb_session";

export async function setSessionCookie(userId: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (userId === null) return null;
  return getUserById(userId) ?? null;
}
