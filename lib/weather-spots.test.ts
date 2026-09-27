import { describe, expect, it } from "vitest";
import { DAYS } from "./seed-data";
import { spotId, spotIdForWaypoint, tourSpots } from "./weather-spots";

describe("spotId", () => {
  it("regroupe deux points de la même maille et de la même tranche d'altitude", () => {
    expect(spotId(45.7841, 6.8003, 2470)).toBe(spotId(45.7847, 6.8008, 2479));
  });

  it("sépare deux points proches mais à des altitudes différentes", () => {
    // même position, 600 m de dénivelé : ce n'est pas la même météo
    expect(spotId(45.78, 6.8, 1200)).not.toBe(spotId(45.78, 6.8, 1800));
  });

  it("sépare deux points éloignés horizontalement à la même altitude", () => {
    expect(spotId(45.78, 6.8, 2000)).not.toBe(spotId(45.9, 6.8, 2000));
  });
});

describe("tourSpots", () => {
  it("dédoublonne les waypoints du tour", () => {
    const spots = tourSpots(DAYS);
    const waypoints = DAYS.flatMap((d) => d.waypoints);
    expect(waypoints.length).toBe(45);
    expect(spots.length).toBe(39);
  });

  it("produit des identifiants uniques", () => {
    const spots = tourSpots(DAYS);
    expect(new Set(spots.map((s) => s.id)).size).toBe(spots.length);
  });

  it("permet à chaque waypoint de retrouver son point", () => {
    const ids = new Set(tourSpots(DAYS).map((s) => s.id));
    for (const d of DAYS) {
      for (const w of d.waypoints) {
        expect(ids.has(spotIdForWaypoint(w))).toBe(true);
      }
    }
  });
});
