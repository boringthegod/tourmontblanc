// Cache SQLite des prévisions. Chaque récolte écrase la précédente : le volume
// reste stable (~37 points × 216 h ≈ 8 000 lignes) et on n'a pas besoin
// d'historique (cf. spec, « Pas d'historique des récoltes »).
import type Database from "better-sqlite3";
import { DAYS } from "./seed-data";
import { openDb, registerSchema } from "./sqlite";
import { fetchForecast, type HourRow } from "./weather-api";
import { tourSpots } from "./weather-spots";

export const TTL_MINUTES = 60;

function schema(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS weather_spots (
      id TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      alt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS weather_hourly (
      spot_id TEXT NOT NULL,
      time TEXT NOT NULL,
      temp REAL, feels REAL, precip REAL, precip_prob INTEGER,
      snowfall REAL, wind REAL, gust REAL, cloud INTEGER,
      freezing_level REAL, visibility REAL, code INTEGER,
      PRIMARY KEY (spot_id, time)
    );
    CREATE TABLE IF NOT EXISTS weather_meta (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL
    );
  `);
}

// Déclaré au chargement : importer ce module suffit à garantir les tables météo,
// que db.ts ait été importé avant ou non.
registerSchema(schema);

function db(): Database.Database {
  return openDb();
}

export function saveForecast(rows: HourRow[], fetchedAt: string): void {
  const d = db();
  const spots = tourSpots(DAYS);
  const insertSpot = d.prepare(
    "INSERT OR REPLACE INTO weather_spots (id, lat, lng, alt) VALUES (?, ?, ?, ?)",
  );
  const insertHour = d.prepare(
    `INSERT OR REPLACE INTO weather_hourly
     (spot_id, time, temp, feels, precip, precip_prob, snowfall, wind, gust,
      cloud, freezing_level, visibility, code)
     VALUES (@spotId, @time, @temp, @feels, @precip, @precipProb, @snowfall,
             @wind, @gust, @cloud, @freezingLevel, @visibility, @code)`,
  );
  const setMeta = d.prepare(
    "INSERT OR REPLACE INTO weather_meta (k, v) VALUES ('fetched_at', ?)",
  );
  d.transaction(() => {
    for (const s of spots) insertSpot.run(s.id, s.lat, s.lng, s.alt);
    for (const r of rows) insertHour.run(r);
    setMeta.run(fetchedAt);
  })();
}

export function getFetchedAt(): string | null {
  const row = db()
    .prepare("SELECT v FROM weather_meta WHERE k = 'fetched_at'")
    .get() as { v: string } | undefined;
  return row?.v ?? null;
}

export function readHours(
  spotIds: string[],
  from: string,
  to: string,
): Map<string, Map<string, HourRow>> {
  const out = new Map<string, Map<string, HourRow>>();
  if (spotIds.length === 0) return out;
  const placeholders = spotIds.map(() => "?").join(",");
  const rows = db()
    .prepare(
      `SELECT spot_id, time, temp, feels, precip, precip_prob, snowfall, wind,
              gust, cloud, freezing_level, visibility, code
       FROM weather_hourly
       WHERE spot_id IN (${placeholders}) AND time >= ? AND time <= ?`,
    )
    .all(...spotIds, from, to) as Record<string, number | string | null>[];
  for (const r of rows) {
    const spotId = r.spot_id as string;
    if (!out.has(spotId)) out.set(spotId, new Map());
    out.get(spotId)!.set(r.time as string, {
      spotId,
      time: r.time as string,
      temp: r.temp as number | null,
      feels: r.feels as number | null,
      precip: r.precip as number | null,
      precipProb: r.precip_prob as number | null,
      snowfall: r.snowfall as number | null,
      wind: r.wind as number | null,
      gust: r.gust as number | null,
      cloud: r.cloud as number | null,
      freezingLevel: r.freezing_level as number | null,
      visibility: r.visibility as number | null,
      code: r.code as number | null,
    });
  }
  return out;
}

export type Freshness = {
  fetchedAt: string | null;
  ageMinutes: number | null;
  stale: boolean;
  error: string | null;
};

function ageMinutes(fetchedAt: string | null, now: Date): number | null {
  if (!fetchedAt) return null;
  // Borné à 0 : une horloge qui recule ne doit pas produire un âge négatif, qui
  // passerait silencieusement le test de fraîcheur.
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(fetchedAt).getTime()) / 60_000),
  );
}

// Verrou en mémoire : deux requêtes concurrentes ne doivent pas déclencher deux
// appels à l'API.
let inFlight: Promise<void> | null = null;

export async function ensureFresh(
  now: Date = new Date(),
  force = false,
): Promise<Freshness> {
  const current = getFetchedAt();
  const age = ageMinutes(current, now);
  if (!force && age !== null && age < TTL_MINUTES) {
    return { fetchedAt: current, ageMinutes: age, stale: false, error: null };
  }

  if (!inFlight) {
    const spots = tourSpots(DAYS);
    const dates = DAYS.map((d) => d.date).sort();
    inFlight = fetchForecast(spots, dates[0], dates[dates.length - 1])
      .then((rows) => {
        saveForecast(rows, new Date().toISOString());
      })
      .finally(() => {
        inFlight = null;
      });
  }

  try {
    await inFlight;
    const fetchedAt = getFetchedAt();
    return {
      fetchedAt,
      ageMinutes: ageMinutes(fetchedAt, new Date()),
      stale: false,
      error: null,
    };
  } catch (e) {
    // Dégradation : on sert le cache périmé plutôt que de casser la page.
    // Un cache vide est signalé par fetchedAt === null, l'UI affiche un état vide.
    return {
      fetchedAt: current,
      ageMinutes: age,
      stale: true,
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}
