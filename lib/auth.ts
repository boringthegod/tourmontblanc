// Auth pure Node (pas d'import Next ici) : hash scrypt + tokens de session HMAC.
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SECRET = process.env.TMB_SECRET ?? "tmb-2026-dev-secret";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(
  userId: number,
  expiresAt: number = Date.now() + SESSION_TTL_MS,
): string {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, sig] = parts;
  const payload = `${userId}.${expiresAt}`;
  const expected = sign(payload);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  if (Number(expiresAt) < Date.now()) return null;
  const id = Number(userId);
  return Number.isInteger(id) ? id : null;
}
