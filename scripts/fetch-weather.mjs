// Récolte météo en ligne de commande — pour un crontab horaire si on en veut un :
//   0 * * * * cd /chemin/vers/le/repo && node scripts/fetch-weather.mjs
// L'app n'en a pas besoin : elle rafraîchit à la lecture au-delà d'une heure.
import { register as registerCjs } from "tsx/cjs/api";
import { register as registerEsm } from "tsx/esm/api";

// lib/*.ts est chargé en CommonJS (pas de "type": "module") : il faut les deux.
registerEsm();
registerCjs();

const { ensureFresh } = await import("../lib/weather-store.ts");
const f = await ensureFresh(new Date(), true); // force, quel que soit le TTL
if (f.error) {
  console.error("Échec de la récolte :", f.error);
  process.exit(1);
}
console.log(`Récolte OK — ${f.fetchedAt}`);
