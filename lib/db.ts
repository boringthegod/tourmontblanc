// Point d'accès unique aux données. Le contenu du tour (jours, logements) est
// statique dans seed-data.ts ; SQLite ne stocke que l'état : users et matos coché.
import type Database from "better-sqlite3";
import { hashPassword } from "./auth";
import { openDb, registerSchema } from "./sqlite";
import {
  DAYS,
  GEAR_ITEMS,
  LODGINGS,
  USERS,
  type Day,
  type Lodging,
} from "./seed-data";

export type User = { id: number; name: string; passwordHash: string };
export type GearItem = { id: number; label: string; shared: boolean };
export type GearState = { taking: boolean; packed: boolean };

// Déclaré au chargement du module : l'ordre d'import entre db.ts et
// weather-store.ts ne doit pas décider quelles tables existent.
registerSchema((d) => {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gear_items (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      shared INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS user_gear (
      user_id INTEGER NOT NULL REFERENCES users(id),
      item_id INTEGER NOT NULL REFERENCES gear_items(id),
      taking INTEGER NOT NULL DEFAULT 0,
      packed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, item_id)
    );
  `);
  const insertUser = d.prepare(
    "INSERT OR IGNORE INTO users (name, password_hash) VALUES (?, ?)",
  );
  for (const name of USERS) {
    insertUser.run(name, hashPassword(`${name.toLowerCase()}2026`));
  }
  const insertItem = d.prepare(
    "INSERT OR IGNORE INTO gear_items (label, shared) VALUES (?, ?)",
  );
  for (const item of GEAR_ITEMS) {
    insertItem.run(item.label, item.shared ? 1 : 0);
  }
});

function getDb(): Database.Database {
  return openDb();
}

// --- Tour (statique) ---

export function getDays(): Day[] {
  return DAYS;
}

export function getDay(n: number): Day | undefined {
  return DAYS.find((d) => d.n === n);
}

export function getLodging(id: string): Lodging | undefined {
  return LODGINGS.find((l) => l.id === id);
}

// Les nuits d'un jour : éclatées (nights) ou logement unique.
export function getNights(
  day: Day,
): { lodging: Lodging; who?: string }[] {
  if (day.nights?.length) {
    return day.nights
      .map((n) => ({ lodging: getLodging(n.lodgingId), who: n.who }))
      .filter((n): n is { lodging: Lodging; who: string } => !!n.lodging);
  }
  const lodging = day.lodgingId ? getLodging(day.lodgingId) : undefined;
  return lodging ? [{ lodging }] : [];
}

export function getTotals(): { km: number; dplus: number; dminus: number } {
  return DAYS.reduce(
    (t, d) => ({
      km: t.km + (d.distanceKm ?? 0),
      dplus: t.dplus + (d.dplus ?? 0),
      dminus: t.dminus + (d.dminus ?? 0),
    }),
    { km: 0, dplus: 0, dminus: 0 },
  );
}

// --- Users ---

function rowToUser(row: { id: number; name: string; password_hash: string }): User {
  return { id: row.id, name: row.name, passwordHash: row.password_hash };
}

export function listUsers(): User[] {
  const rows = getDb()
    .prepare("SELECT id, name, password_hash FROM users ORDER BY id")
    .all() as { id: number; name: string; password_hash: string }[];
  return rows.map(rowToUser);
}

export function getUserByName(name: string): User | undefined {
  const row = getDb()
    .prepare("SELECT id, name, password_hash FROM users WHERE name = ?")
    .get(name) as { id: number; name: string; password_hash: string } | undefined;
  return row ? rowToUser(row) : undefined;
}

export function getUserById(id: number): User | undefined {
  const row = getDb()
    .prepare("SELECT id, name, password_hash FROM users WHERE id = ?")
    .get(id) as { id: number; name: string; password_hash: string } | undefined;
  return row ? rowToUser(row) : undefined;
}

// --- Matos ---

export function getGearItems(): GearItem[] {
  const rows = getDb()
    .prepare("SELECT id, label, shared FROM gear_items ORDER BY id")
    .all() as { id: number; label: string; shared: number }[];
  return rows.map((r) => ({ id: r.id, label: r.label, shared: r.shared === 1 }));
}

export function addGearItem(label: string, shared: boolean): GearItem {
  const clean = label.trim().replace(/\s+/g, " ");
  if (!clean) throw new Error("Label vide");
  const d = getDb();
  const existing = d
    .prepare("SELECT id, label, shared FROM gear_items WHERE label = ? COLLATE NOCASE")
    .get(clean) as { id: number; label: string; shared: number } | undefined;
  if (existing) {
    return { id: existing.id, label: existing.label, shared: existing.shared === 1 };
  }
  const res = d
    .prepare("INSERT INTO gear_items (label, shared) VALUES (?, ?)")
    .run(clean, shared ? 1 : 0);
  return { id: Number(res.lastInsertRowid), label: clean, shared };
}

export function getUserGear(userId: number): Record<number, GearState> {
  const rows = getDb()
    .prepare("SELECT item_id, taking, packed FROM user_gear WHERE user_id = ?")
    .all(userId) as { item_id: number; taking: number; packed: number }[];
  const out: Record<number, GearState> = {};
  for (const r of rows) {
    out[r.item_id] = { taking: r.taking === 1, packed: r.packed === 1 };
  }
  return out;
}

export function setUserGear(
  userId: number,
  itemId: number,
  patch: Partial<GearState>,
): void {
  const d = getDb();
  d.prepare(
    "INSERT OR IGNORE INTO user_gear (user_id, item_id) VALUES (?, ?)",
  ).run(userId, itemId);
  if (patch.taking !== undefined) {
    // Ne plus prendre un item = il n'est plus dans le sac non plus.
    d.prepare(
      "UPDATE user_gear SET taking = ?, packed = CASE WHEN ? = 0 THEN 0 ELSE packed END WHERE user_id = ? AND item_id = ?",
    ).run(patch.taking ? 1 : 0, patch.taking ? 1 : 0, userId, itemId);
  }
  if (patch.packed !== undefined) {
    d.prepare(
      "UPDATE user_gear SET packed = ? WHERE user_id = ? AND item_id = ?",
    ).run(patch.packed ? 1 : 0, userId, itemId);
  }
}

export type TeamGearRow = {
  item: GearItem;
  byUser: Record<string, GearState>;
};

export function getTeamGear(): TeamGearRow[] {
  const users = listUsers();
  const gearByUser = new Map(users.map((u) => [u.id, getUserGear(u.id)]));
  return getGearItems().map((item) => {
    const byUser: Record<string, GearState> = {};
    for (const u of users) {
      byUser[u.name] =
        gearByUser.get(u.id)?.[item.id] ?? { taking: false, packed: false };
    }
    return { item, byUser };
  });
}

export function getUnclaimedSharedItems(): GearItem[] {
  const rows = getDb()
    .prepare(
      `SELECT id, label, shared FROM gear_items
       WHERE shared = 1 AND id NOT IN (
         SELECT item_id FROM user_gear WHERE taking = 1
       ) ORDER BY id`,
    )
    .all() as { id: number; label: string; shared: number }[];
  return rows.map((r) => ({ id: r.id, label: r.label, shared: true }));
}
