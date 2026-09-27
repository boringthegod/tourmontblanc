// Identité d'un point météo. La grille (2 décimales ≈ 1,1 km, l'ordre de grandeur
// de la maille AROME) évite d'interroger l'API pour des points indiscernables,
// mais l'altitude entre dans la clé : deux points proches séparés par 600 m de
// dénivelé n'ont pas la même météo.
import type { Day, Waypoint } from "./seed-data";

export type Spot = { id: string; lat: number; lng: number; alt: number };

export function spotId(lat: number, lng: number, alt: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${Math.round(alt / 100)}`;
}

export function spotIdForWaypoint(w: Waypoint): string {
  return spotId(w.lat, w.lng, w.alt);
}

export function tourSpots(days: Day[]): Spot[] {
  const out = new Map<string, Spot>();
  for (const day of days) {
    for (const w of day.waypoints) {
      const id = spotIdForWaypoint(w);
      if (!out.has(id)) {
        out.set(id, { id, lat: w.lat, lng: w.lng, alt: Math.round(w.alt) });
      }
    }
  }
  return [...out.values()];
}
