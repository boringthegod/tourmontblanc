// Façade météo pour l'UI : assemble le cache, l'horaire estimé et les alertes.
import { getDay, getDays } from "./db";
import type { Day } from "./seed-data";
import { stageEta } from "./schedule";
import { getProfile } from "./trails";
import type { HourRow } from "./weather-api";
import {
  confidenceFor,
  stageAlerts,
  type Alert,
  type Confidence,
} from "./weather-alerts";
import { spotId } from "./weather-spots";
import { ensureFresh, readHours, type Freshness } from "./weather-store";

export type StagePoint = {
  name: string;
  alt: number;
  km: number;
  minutes: number;
  hourKey: string;
  hour: HourRow | null;
};

// Une heure de la bande, avec le nom du point de passage où l'on se trouve.
export type StageHour = HourRow & { at: string };

export type StageWeather = {
  day: Day;
  confidence: Confidence;
  points: StagePoint[];
  alerts: Alert[];
  hours: StageHour[];
};

// Bande horaire qui suit le marcheur : à chaque heure pleine, la météo du point
// de passage dont l'heure de passage estimée est la plus proche. Avant le départ
// c'est le point de départ, après l'arrivée le point d'arrivée. Une bande au
// point culminant surestimait le froid d'une dizaine de degrés en fin de journée.
export function walkerHours(
  points: Pick<StagePoint, "name" | "minutes">[],
  ids: string[],
  byId: Map<string, Map<string, HourRow>>,
  date: string,
  from: number,
  to: number,
): StageHour[] {
  const out: StageHour[] = [];
  if (points.length === 0) return out;
  for (let h = from; h <= to; h++) {
    const minutes = h * 60;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      // Strictement plus proche : à égalité on garde le point déjà atteint.
      if (
        Math.abs(points[i].minutes - minutes) <
        Math.abs(points[best].minutes - minutes)
      ) {
        best = i;
      }
    }
    const id = ids[best] ?? ids[ids.length - 1];
    const row = byId.get(id)?.get(`${date}T${String(h).padStart(2, "0")}:00`);
    if (row) out.push({ ...row, at: points[best].name });
  }
  return out;
}

// Plage de la bande horaire (heures pleines incluses).
export const STRIP_FROM = 8;
export const STRIP_TO = 18;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildStage(day: Day, today: string): StageWeather | null {
  if (day.kind !== "hike" || day.waypoints.length === 0) return null;

  const profile = getProfile(day.n, day.waypoints);
  const marks = profile?.marks ?? day.waypoints.map((w) => ({
    name: w.name,
    km: w.km,
    alt: w.alt,
  }));
  const etas = stageEta({
    date: day.date,
    duration: day.duration,
    marks,
    points: profile?.points ?? null,
  });

  // Les altitudes du tracé peuvent différer de celles des waypoints ; la clé du
  // point météo suit la position du waypoint, seule ancre commune.
  const ids = day.waypoints.map((w) => spotId(w.lat, w.lng, w.alt));
  const byId = readHours(ids, `${day.date}T00:00`, `${day.date}T23:00`);

  const points: StagePoint[] = etas.map((e, i) => {
    const id = ids[i] ?? ids[ids.length - 1];
    return {
      name: e.name,
      alt: e.alt,
      km: e.km,
      minutes: e.minutes,
      hourKey: e.hourKey,
      hour: byId.get(id)?.get(e.hourKey) ?? null,
    };
  });

  const confidence = confidenceFor(day.date, today);
  const alerts = stageAlerts(
    points.map((p) => ({
      name: p.name,
      alt: p.alt,
      hourKey: p.hourKey,
      hour: p.hour,
    })),
    confidence,
  );

  const hours = walkerHours(points, ids, byId, day.date, STRIP_FROM, STRIP_TO);

  return { day, confidence, points, alerts, hours };
}

export async function getTourWeather(
  today: string = todayIso(),
): Promise<{ stages: StageWeather[]; freshness: Freshness }> {
  const freshness = await ensureFresh();
  const stages = getDays()
    .map((d) => buildStage(d, today))
    .filter((s): s is StageWeather => s !== null);
  return { stages, freshness };
}

export async function getStageWeather(
  n: number,
  today: string = todayIso(),
): Promise<StageWeather | null> {
  await ensureFresh();
  const day = getDay(n);
  return day ? buildStage(day, today) : null;
}
