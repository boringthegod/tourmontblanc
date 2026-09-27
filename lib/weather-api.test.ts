import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/open-meteo.json";
import { forecastUrl, parseForecast } from "./weather-api";
import type { Spot } from "./weather-spots";

const SPOTS: Spot[] = [
  { id: "45.89,6.81,10", lat: 45.89, lng: 6.81, alt: 1008 },
  { id: "45.78,6.80,25", lat: 45.78, lng: 6.8, alt: 2479 },
];

describe("forecastUrl", () => {
  it("groupe tous les points dans un seul appel", () => {
    const u = new URL(forecastUrl(SPOTS, "2026-09-17", "2026-09-25"));
    expect(u.searchParams.get("latitude")).toBe("45.89,45.78");
    expect(u.searchParams.get("longitude")).toBe("6.81,6.8");
    expect(u.searchParams.get("elevation")).toBe("1008,2479");
    expect(u.searchParams.get("start_date")).toBe("2026-09-17");
    expect(u.searchParams.get("end_date")).toBe("2026-09-25");
    expect(u.searchParams.get("timezone")).toBe("Europe/Paris");
  });

  it("demande les variables dont dépendent les règles d'alerte", () => {
    const hourly = new URL(forecastUrl(SPOTS, "2026-09-17", "2026-09-25"))
      .searchParams.get("hourly");
    for (const v of [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "snowfall",
      "weather_code",
      "wind_gusts_10m",
      "freezing_level_height",
      "visibility",
    ]) {
      expect(hourly).toContain(v);
    }
  });
});

describe("parseForecast", () => {
  it("aplatit la réponse en lignes horaires par point", () => {
    const rows = parseForecast(SPOTS, fixture);
    expect(rows).toHaveLength(48); // 2 points × 24 h
    expect(rows[0].spotId).toBe("45.89,6.81,10");
    expect(rows[0].time).toBe("2026-09-18T00:00");
    expect(rows[24].spotId).toBe("45.78,6.80,25");
  });

  it("rend des nombres exploitables", () => {
    const rows = parseForecast(SPOTS, fixture);
    const midi = rows.find(
      (r) => r.spotId === "45.78,6.80,25" && r.time === "2026-09-18T12:00",
    );
    expect(midi).toBeDefined();
    expect(typeof midi!.temp).toBe("number");
    expect(typeof midi!.code).toBe("number");
    expect(midi!.freezingLevel).toBeGreaterThan(0);
  });

  it("garde les trous en null plutôt que de les inventer", () => {
    // Clone délibérément non typé : on injecte un null que le type de la fixture
    // n'admet pas, et `@ts-expect-error` serait fragile ici (si TS ne signalait
    // rien, la directive elle-même deviendrait une erreur de compilation).
    const troué: [{ hourly: Record<string, (number | null)[]> }, unknown] =
      structuredClone(fixture) as never;
    troué[0].hourly.temperature_2m[3] = null;
    const rows = parseForecast(SPOTS, troué);
    expect(rows[3].temp).toBeNull();
  });

  it("refuse une réponse qui ne correspond pas aux points demandés", () => {
    expect(() => parseForecast([SPOTS[0]], fixture)).toThrow(/points/);
  });
});
