// Accès à l'API Open-Meteo. Un seul appel HTTP pour tous les points du tour :
// l'API accepte des listes parallèles latitude/longitude/elevation et répond par
// un tableau dans le même ordre. `elevation` force la correction d'altitude —
// sans lui, un col à 2500 m hérite de la météo de la maille, souvent 1000 m plus bas.
import type { Spot } from "./weather-spots";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const HOURLY_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation",
  "precipitation_probability",
  "snowfall",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
  "cloud_cover",
  "freezing_level_height",
  "visibility",
] as const;

export type HourRow = {
  spotId: string;
  time: string;
  temp: number | null;
  feels: number | null;
  precip: number | null;
  precipProb: number | null;
  snowfall: number | null;
  wind: number | null;
  gust: number | null;
  cloud: number | null;
  freezingLevel: number | null;
  visibility: number | null;
  code: number | null;
};

export function forecastUrl(
  spots: Spot[],
  startDate: string,
  endDate: string,
): string {
  const p = new URLSearchParams({
    latitude: spots.map((s) => s.lat).join(","),
    longitude: spots.map((s) => s.lng).join(","),
    elevation: spots.map((s) => Math.round(s.alt)).join(","),
    hourly: HOURLY_VARS.join(","),
    timezone: "Europe/Paris",
    start_date: startDate,
    end_date: endDate,
  });
  return `${ENDPOINT}?${p}`;
}

type Series = Record<string, (number | null)[]> & { time: string[] };

function num(series: Series, key: string, i: number): number | null {
  const v = series[key]?.[i];
  return typeof v === "number" ? v : null;
}

export function parseForecast(spots: Spot[], payload: unknown): HourRow[] {
  // Un point unique peut être renvoyé comme objet plutôt que comme tableau.
  const list = Array.isArray(payload) ? payload : [payload];
  if (list.length !== spots.length) {
    throw new Error(
      `Réponse Open-Meteo : ${list.length} points reçus pour ${spots.length} demandés`,
    );
  }
  const rows: HourRow[] = [];
  for (let s = 0; s < spots.length; s++) {
    const hourly = (list[s] as { hourly?: Series }).hourly;
    if (!hourly?.time) {
      throw new Error(`Réponse Open-Meteo sans série horaire pour ${spots[s].id}`);
    }
    for (let i = 0; i < hourly.time.length; i++) {
      rows.push({
        spotId: spots[s].id,
        time: hourly.time[i],
        temp: num(hourly, "temperature_2m", i),
        feels: num(hourly, "apparent_temperature", i),
        precip: num(hourly, "precipitation", i),
        precipProb: num(hourly, "precipitation_probability", i),
        snowfall: num(hourly, "snowfall", i),
        wind: num(hourly, "wind_speed_10m", i),
        gust: num(hourly, "wind_gusts_10m", i),
        cloud: num(hourly, "cloud_cover", i),
        freezingLevel: num(hourly, "freezing_level_height", i),
        visibility: num(hourly, "visibility", i),
        code: num(hourly, "weather_code", i),
      });
    }
  }
  return rows;
}

export async function fetchForecast(
  spots: Spot[],
  startDate: string,
  endDate: string,
): Promise<HourRow[]> {
  const res = await fetch(forecastUrl(spots, startDate, endDate), {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo a répondu ${res.status}`);
  }
  return parseForecast(spots, await res.json());
}
