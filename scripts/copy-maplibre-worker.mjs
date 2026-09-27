// Copie le worker MapLibre (et son module partagé) vers public/maplibre/.
// Lancé en postinstall pour suivre les mises à jour du paquet.
import { copyFileSync, mkdirSync } from "node:fs";

const dist = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const out = new URL("../public/maplibre/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(new URL(f, dist), new URL(f, out));
}
console.log("maplibre worker copié vers public/maplibre/");
