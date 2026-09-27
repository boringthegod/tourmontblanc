// Connexion SQLite unique de l'app. db.ts (users, matos) et weather-store.ts
// (cache météo) partagent le même fichier WAL — deux connexions sur le même
// fichier se marcheraient dessus.
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let db: Database.Database | null = null;
const schemas: ((db: Database.Database) => void)[] = [];

// Déclare un bootstrap de schéma. Chaque module de données appelle ceci au
// chargement ; l'ordre d'import ne doit rien décider, donc on applique tous les
// schémas connus à l'ouverture, et immédiatement ceux déclarés après coup.
export function registerSchema(fn: (db: Database.Database) => void): void {
  schemas.push(fn);
  if (db) fn(db);
}

export function openDb(): Database.Database {
  if (db) return db;
  const path = process.env.TMB_DB_PATH ?? "data/tmb.db";
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  for (const fn of schemas) fn(db);
  return db;
}
