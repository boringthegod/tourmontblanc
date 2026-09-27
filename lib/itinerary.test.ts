import { describe, expect, it } from "vitest";
import { DAYS, LODGINGS } from "./seed-data";
import { getTrail } from "./trails";

// Distance à vol d'oiseau en mètres.
function metres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const hikes = DAYS.filter((d) => d.kind === "hike");

function lodgingsOf(day: (typeof DAYS)[number]) {
  const ids = day.nights?.map((n) => n.lodgingId) ?? [day.lodgingId!];
  return ids.map((id) => {
    const l = LODGINGS.find((x) => x.id === id);
    if (!l) throw new Error(`logement inconnu : ${id}`);
    return l;
  });
}

// Le TMB s'est fait piéger : le GPX s'arrêtait au village alors que le refuge
// était deux heures plus haut. Chaque étape doit finir au logement de la nuit
// et repartir de celui de la veille.
describe("itinéraire cohérent avec les logements", () => {
  it("chaque logement d'étape est géolocalisé", () => {
    for (const day of hikes) {
      for (const l of lodgingsOf(day)) {
        expect(l.lat, `${l.name} sans lat`).toBeTypeOf("number");
        expect(l.lng, `${l.name} sans lng`).toBeTypeOf("number");
      }
    }
  });

  it("le dernier point de passage est au logement principal", () => {
    for (const day of hikes) {
      const main = lodgingsOf(day)[0];
      const last = day.waypoints[day.waypoints.length - 1];
      expect(
        metres(last, { lat: main.lat!, lng: main.lng! }),
        `J${day.n} finit à « ${last.name} », loin de ${main.name}`,
      ).toBeLessThan(150);
    }
  });

  it("chaque étape repart du logement principal de la veille", () => {
    for (let i = 1; i < hikes.length; i++) {
      const main = lodgingsOf(hikes[i - 1])[0];
      const first = hikes[i].waypoints[0];
      expect(
        metres(first, { lat: main.lat!, lng: main.lng! }),
        `J${hikes[i].n} part de « ${first.name} », loin de ${main.name}`,
      ).toBeLessThan(150);
    }
  });
});

describe("tracés réels alignés sur le seed", () => {
  it("chaque tracé part et arrive aux points de passage extrêmes", () => {
    for (const day of hikes) {
      const trail = getTrail(day.n);
      expect(trail, `pas de tracé J${day.n}`).not.toBeNull();
      const c = trail!.coords;
      const toPt = ([lng, lat]: number[]) => ({ lat, lng });
      expect(
        metres(toPt(c[0]), day.waypoints[0]),
        `départ J${day.n}`,
      ).toBeLessThan(150);
      expect(
        metres(toPt(c[c.length - 1]), day.waypoints[day.waypoints.length - 1]),
        `arrivée J${day.n}`,
      ).toBeLessThan(150);
    }
  });

  it("chaque point de passage est sur le tracé", () => {
    for (const day of hikes) {
      const c = getTrail(day.n)!.coords;
      for (const w of day.waypoints) {
        const d = Math.min(...c.map(([lng, lat]) => metres({ lat, lng }, w)));
        expect(d, `J${day.n} « ${w.name} » à ${Math.round(d)} m du tracé`).toBeLessThan(250);
      }
    }
  });

  it("distance et D+ annoncés collent au tracé", () => {
    for (const day of hikes) {
      const c = getTrail(day.n)!.coords;
      let km = 0;
      for (let i = 1; i < c.length; i++) {
        km +=
          metres(
            { lat: c[i - 1][1], lng: c[i - 1][0] },
            { lat: c[i][1], lng: c[i][0] },
          ) / 1000;
      }
      // D+ lissé : on ignore les oscillations de moins de 10 m.
      let up = 0;
      let ref = c[0][2];
      for (const p of c) {
        const d = p[2] - ref;
        if (Math.abs(d) >= 10) {
          if (d > 0) up += d;
          ref = p[2];
        }
      }
      expect(
        Math.abs(day.distanceKm! - km),
        `J${day.n} : ${day.distanceKm} km annoncés, ${km.toFixed(1)} km tracés`,
      ).toBeLessThan(1.5);
      expect(
        Math.abs(day.dplus! - up),
        `J${day.n} : D+ ${day.dplus} annoncé, ${up} tracé`,
      ).toBeLessThan(150);
    }
  });
});
