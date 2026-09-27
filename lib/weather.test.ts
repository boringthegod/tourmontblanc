import { describe, expect, it } from "vitest";
import type { HourRow } from "./weather-api";
import { walkerHours } from "./weather";

function row(spotId: string, time: string, temp: number): HourRow {
  return {
    spotId,
    time,
    temp,
    feels: null,
    precip: null,
    precipProb: null,
    snowfall: null,
    wind: null,
    gust: null,
    cloud: null,
    freezingLevel: null,
    visibility: null,
    code: 0,
  };
}

const DATE = "2026-09-22";

// Trois points : départ 8h, col 9h, arrivée 16h (étape de 8 h).
const points = [
  { name: "Refuge", alt: 2000, km: 0, minutes: 8 * 60, hourKey: `${DATE}T08:00` },
  { name: "Col", alt: 2500, km: 2.5, minutes: 9 * 60, hourKey: `${DATE}T09:00` },
  { name: "Village", alt: 1500, km: 23, minutes: 16 * 60, hourKey: `${DATE}T16:00` },
];
const ids = ["refuge", "col", "village"];

function series(spotId: string, base: number): Map<string, HourRow> {
  const m = new Map<string, HourRow>();
  for (let h = 0; h < 24; h++) {
    const t = `${DATE}T${String(h).padStart(2, "0")}:00`;
    m.set(t, row(spotId, t, base + h));
  }
  return m;
}
const byId = new Map([
  ["refuge", series("refuge", 0)],
  ["col", series("col", -10)],
  ["village", series("village", 10)],
]);

describe("walkerHours", () => {
  const hours = walkerHours(points, ids, byId, DATE, 8, 18);

  it("donne une case par heure de la plage", () => {
    expect(hours.map((h) => h.time.slice(11, 13))).toEqual([
      "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18",
    ]);
  });

  it("suit le point de passage le plus proche en temps", () => {
    const at = Object.fromEntries(hours.map((h) => [h.time.slice(11, 13), h.at]));
    expect(at["08"]).toBe("Refuge");
    expect(at["09"]).toBe("Col");
    expect(at["12"]).toBe("Col"); // 12h : 3 h après le col, 4 h avant le village
    expect(at["13"]).toBe("Village"); // 13h : 4 h après le col, 3 h avant le village
    expect(at["16"]).toBe("Village");
  });

  it("reste au point d'arrivée après l'arrivée", () => {
    const h18 = hours.find((h) => h.time.endsWith("T18:00"))!;
    expect(h18.at).toBe("Village");
    expect(h18.temp).toBe(10 + 18);
  });

  it("lit la valeur du bon point à la bonne heure", () => {
    const h09 = hours.find((h) => h.time.endsWith("T09:00"))!;
    expect(h09.spotId).toBe("col");
    expect(h09.temp).toBe(-10 + 9);
  });

  it("saute les heures sans donnée", () => {
    const partial = new Map(byId);
    partial.set("village", new Map());
    const out = walkerHours(points, ids, partial, DATE, 8, 18);
    expect(out.map((h) => h.time.slice(11, 13))).toEqual([
      "08", "09", "10", "11", "12",
    ]);
  });

  it("à égalité, préfère le point atteint plutôt que celui à venir", () => {
    // Col à 9h, village à 11h : 10h est à égale distance des deux.
    const pts = [points[0], points[1], { ...points[2], minutes: 11 * 60 }];
    const out = walkerHours(pts, ids, byId, DATE, 10, 10);
    expect(out[0].at).toBe("Col");
  });
});
