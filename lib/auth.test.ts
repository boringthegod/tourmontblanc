import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "./auth";

describe("passwords", () => {
  it("hash + verify round-trip", () => {
    const hash = hashPassword("alice2026");
    expect(verifyPassword("alice2026", hash)).toBe(true);
    expect(verifyPassword("ALICE2026", hash)).toBe(false);
    expect(verifyPassword("", hash)).toBe(false);
  });

  it("sel aléatoire : deux hashs du même mdp diffèrent", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });
});

describe("session tokens", () => {
  it("round-trip valide", () => {
    const token = createSessionToken(3);
    expect(verifySessionToken(token)).toBe(3);
  });

  it("rejette un token falsifié", () => {
    const token = createSessionToken(3);
    expect(verifySessionToken(token.slice(0, -2) + "aa")).toBeNull();
    const tampered = token.replace(/^3\./, "4.");
    expect(verifySessionToken(tampered)).toBeNull();
    expect(verifySessionToken("n'importe quoi")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });

  it("rejette un token expiré", () => {
    const token = createSessionToken(3, Date.now() - 1000);
    expect(verifySessionToken(token)).toBeNull();
  });
});
