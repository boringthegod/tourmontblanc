// Génération GPX 1.1 à partir des tracés réels.
import type { TrailPoint } from "./trails";

export type GpxTrack = { name: string; coords: TrailPoint[] };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGpx(name: string, tracks: GpxTrack[]): string {
  const trks = tracks
    .map((t) => {
      const pts = t.coords
        .map(
          ([lng, lat, alt]) =>
            `<trkpt lat="${lat}" lon="${lng}"><ele>${alt}</ele></trkpt>`,
        )
        .join("");
      return `<trk><name>${esc(t.name)}</name><trkseg>${pts}</trkseg></trk>`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<gpx version="1.1" creator="TMB 2026" xmlns="http://www.topografix.com/GPX/1/1">` +
    `<metadata><name>${esc(name)}</name></metadata>` +
    trks +
    `</gpx>`
  );
}
