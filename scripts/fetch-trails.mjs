// Récupère le tracé pédestre réel de chaque étape via BRouter (routage OSM),
// en passant par les points de passage de lib/seed-data.ts.
// Usage : node scripts/fetch-trails.mjs [profil]   (défaut : hiking-mountain)
// Sortie : public/trails/etape-<n>.json (GeoJSON LineString, coords [lng, lat, alt])
import { mkdirSync, writeFileSync } from "node:fs";

const { DAYS } = await import("../lib/seed-data.ts").catch(async () => {
  // Node ne charge pas le .ts directement : extraction naïve via tsx absent → fallback regex
  return null;
});

async function loadDays() {
  if (DAYS) return DAYS;
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../lib/seed-data.ts", import.meta.url), "utf8");
  // Évalue le fichier TS comme JS après avoir retiré types et exports.
  const js = src
    .replace(/export type [\s\S]*?};\n/g, "")
    .replace(/export const/g, "const")
    .replace(/ as const/g, "")
    .replace(/: \{ label: string; shared: boolean \}\[\]/g, "")
    .replace(/: Lodging\[\]/g, "")
    .replace(/: Day\[\]/g, "")
    + "\nexport { DAYS };";
  const mod = await import(
    "data:text/javascript;base64," + Buffer.from(js).toString("base64")
  );
  return mod.DAYS;
}

const profile = process.argv[2] ?? "hiking-mountain";
const days = (await loadDays()).filter((d) => d.kind === "hike");
mkdirSync(new URL("../public/trails", import.meta.url), { recursive: true });

for (const day of days) {
  const lonlats = day.waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${profile}&alternativeidx=0&format=geojson`;
  process.stdout.write(`Étape ${day.n} (${day.title}) … `);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`ÉCHEC HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  const geo = await res.json();
  const feature = geo.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords?.length) {
    console.log("ÉCHEC: pas de géométrie");
    continue;
  }
  // Arrondit pour alléger le fichier (~1 m de précision).
  const slim = coords.map(([lng, lat, alt]) => [
    Number(lng.toFixed(5)),
    Number(lat.toFixed(5)),
    Math.round(alt ?? 0),
  ]);
  const out = {
    type: "Feature",
    properties: {
      n: day.n,
      title: day.title,
      distanceKm: Number(
        ((feature.properties?.["track-length"] ?? 0) / 1000).toFixed(1),
      ),
      dplus: Number(feature.properties?.["filtered ascend"] ?? 0),
      profile,
    },
    geometry: { type: "LineString", coordinates: slim },
  };
  writeFileSync(
    new URL(`../public/trails/etape-${day.n}.json`, import.meta.url),
    JSON.stringify(out),
  );
  console.log(
    `ok — ${slim.length} pts, ${out.properties.distanceKm} km, D+ ${out.properties.dplus} m`,
  );
  await new Promise((r) => setTimeout(r, 1200));
}
