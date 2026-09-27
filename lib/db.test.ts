import { beforeAll, describe, expect, it } from "vitest";

process.env.TMB_DB_PATH = ":memory:";

import {
  addGearItem,
  getDay,
  getDays,
  getGearItems,
  getLodging,
  getTeamGear,
  getTotals,
  getUnclaimedSharedItems,
  getUserByName,
  getUserGear,
  listUsers,
  setUserGear,
} from "./db";
import { verifyPassword } from "./auth";

describe("tour data", () => {
  it("expose les 9 jours ordonnés", () => {
    const days = getDays();
    expect(days).toHaveLength(9);
    expect(days.map((d) => d.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(days[0].kind).toBe("travel");
    expect(days[8].kind).toBe("travel");
  });

  it("relie le jour 4 au Rifugio Elena confirmé", () => {
    const day = getDay(4);
    expect(day?.lodgingId).toBe("elena");
    const elena = getLodging("elena");
    expect(elena?.status).toBe("confirme");
    expect(elena?.phone).toBe("+39 0165 844688");
  });

  it("calcule des totaux plausibles", () => {
    const t = getTotals();
    expect(t.km).toBeGreaterThan(120);
    expect(t.km).toBeLessThan(160);
    expect(t.dplus).toBeGreaterThan(7000);
  });
});

describe("users", () => {
  it("seed les 6 comptes avec mdp initial <prenom>2026", () => {
    expect(listUsers().map((u) => u.name)).toEqual([
      "Alice",
      "Émile",
      "Bruno",
      "Chloé",
      "David",
      "Farid",
    ]);
    const alice = getUserByName("Alice");
    expect(alice).toBeDefined();
    expect(verifyPassword("alice2026", alice!.passwordHash)).toBe(true);
    expect(verifyPassword("mauvais", alice!.passwordHash)).toBe(false);
    const emile = getUserByName("Émile");
    expect(verifyPassword("émile2026", emile!.passwordHash)).toBe(true);
  });
});

describe("gear", () => {
  let aliceId: number;
  let rechaudId: number;

  beforeAll(() => {
    aliceId = getUserByName("Alice")!.id;
    rechaudId = getGearItems().find((i) => i.label === "Réchaud gaz")!.id;
  });

  it("expose la liste de base avec les items partagés", () => {
    const items = getGearItems();
    expect(items.length).toBeGreaterThanOrEqual(29);
    expect(items.find((i) => i.label === "Réchaud gaz")?.shared).toBe(true);
    expect(items.find((i) => i.label === "Sac de couchage")?.shared).toBe(false);
  });

  it("persiste les coches taking/packed par user", () => {
    expect(getUserGear(aliceId)[rechaudId]).toBeUndefined();
    setUserGear(aliceId, rechaudId, { taking: true });
    expect(getUserGear(aliceId)[rechaudId]).toEqual({ taking: true, packed: false });
    setUserGear(aliceId, rechaudId, { packed: true });
    expect(getUserGear(aliceId)[rechaudId]).toEqual({ taking: true, packed: true });
    setUserGear(aliceId, rechaudId, { taking: false });
    expect(getUserGear(aliceId)[rechaudId].taking).toBe(false);
  });

  it("signale les items partagés que personne ne prend", () => {
    setUserGear(aliceId, rechaudId, { taking: false });
    expect(getUnclaimedSharedItems().map((i) => i.id)).toContain(rechaudId);
    setUserGear(aliceId, rechaudId, { taking: true });
    expect(getUnclaimedSharedItems().map((i) => i.id)).not.toContain(rechaudId);
  });

  it("permet d'ajouter un item custom, cochable par tous", () => {
    const item = addGearItem("Jeu de cartes", false);
    expect(item.id).toBeGreaterThan(0);
    expect(getGearItems().some((i) => i.label === "Jeu de cartes")).toBe(true);
    setUserGear(aliceId, item.id, { taking: true });
    const row = getTeamGear().find((r) => r.item.id === item.id)!;
    expect(row.byUser["Alice"].taking).toBe(true);
    // doublon (même label, casse/espaces différentes) → item existant renvoyé
    const dup = addGearItem("  jeu de cartes ", true);
    expect(dup.id).toBe(item.id);
    // label vide → erreur
    expect(() => addGearItem("   ", false)).toThrow();
  });

  it("agrège la vue équipe", () => {
    setUserGear(aliceId, rechaudId, { taking: true });
    const row = getTeamGear().find((r) => r.item.id === rechaudId)!;
    expect(row.byUser["Alice"].taking).toBe(true);
    expect(row.byUser["Chloé"]).toEqual({ taking: false, packed: false });
  });
});
