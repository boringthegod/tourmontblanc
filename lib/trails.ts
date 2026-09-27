// Lecture serveur des tracés réels (public/trails/etape-N.json, GeoJSON BRouter).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Waypoint } from "./seed-data";

export type TrailPoint = [number, number, number]; // [lng, lat, alt]

type Trail = { coords: TrailPoint[]; km: number };

const cache = new Map<number, Trail | null>();

function haversineKm(a: TrailPoint, b: TrailPoint): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getTrail(n: number): Trail | null {
  if (cache.has(n)) return cache.get(n)!;
  let trail: Trail | null = null;
  try {
    const raw = readFileSync(
      join(process.cwd(), "public", "trails", `etape-${n}.json`),
      "utf8",
    );
    const geo = JSON.parse(raw);
    const coords = geo.geometry?.coordinates as TrailPoint[];
    if (coords?.length > 1) {
      trail = { coords, km: geo.properties?.distanceKm ?? 0 };
    }
  } catch {
    trail = null;
  }
  cache.set(n, trail);
  return trail;
}

export type Profile = {
  points: { km: number; alt: number }[];
  marks: { name: string; km: number; alt: number }[];
  totalKm: number;
};

// Profil réel : distances cumulées le long du tracé, repères = waypoints
// projetés sur le point du tracé le plus proche.
export function getProfile(n: number, waypoints: Waypoint[]): Profile | null {
  const trail = getTrail(n);
  if (!trail) return null;
  const { coords } = trail;
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]));
  }
  const totalKm = cum[cum.length - 1];

  const step = Math.max(1, Math.floor(coords.length / 400));
  const points: { km: number; alt: number }[] = [];
  for (let i = 0; i < coords.length; i += step) {
    points.push({ km: cum[i], alt: coords[i][2] });
  }
  const last = coords.length - 1;
  if (points[points.length - 1].km !== cum[last]) {
    points.push({ km: cum[last], alt: coords[last][2] });
  }

  const marks = waypoints.map((w) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = (coords[i][0] - w.lng) ** 2 + (coords[i][1] - w.lat) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return { name: w.name, km: cum[best], alt: coords[best][2] };
  });

  return { points, marks, totalKm };
}
