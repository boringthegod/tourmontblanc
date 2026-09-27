import { beforeAll, describe, expect, it } from "vitest";

process.env.TMB_DB_PATH = ":memory:";

import type { HourRow } from "./weather-api";
import { ensureFresh, getFetchedAt, readHours, saveForecast } from "./weather-store";

function row(spotId: string, time: string, temp: number): HourRow {
  return {
    spotId,
    time,
    temp,
    feels: temp - 1,
    precip: 0,
    precipProb: 5,
    snowfall: 0,
    wind: 10,
    gust: 20,
    cloud: 30,
    freezingLevel: 3000,
    visibility: 20000,
    code: 1,
  };
}

describe("weather-store", () => {
  beforeAll(() => {
    saveForecast(
      [
        row("A", "2026-09-18T08:00", 10),
        row("A", "2026-09-18T09:00", 12),
        row("B", "2026-09-18T08:00", 4),
      ],
      "2026-09-13T15:00:00.000Z",
    );
  });

  it("relit ce qu'il a écrit, indexé par point puis par heure", () => {
    const hours = readHours(["A", "B"], "2026-09-18T00:00", "2026-09-18T23:00");
    expect(hours.get("A")?.get("2026-09-18T09:00")?.temp).toBe(12);
    expect(hours.get("B")?.get("2026-09-18T08:00")?.temp).toBe(4);
  });

  it("ignore les points non demandés", () => {
    const hours = readHours(["A"], "2026-09-18T00:00", "2026-09-18T23:00");
    expect(hours.has("B")).toBe(false);
  });

  it("borne la fenêtre horaire demandée", () => {
    const hours = readHours(["A"], "2026-09-18T09:00", "2026-09-18T23:00");
    expect(hours.get("A")?.has("2026-09-18T08:00")).toBe(false);
    expect(hours.get("A")?.has("2026-09-18T09:00")).toBe(true);
  });

  it("mémorise la date de récolte", () => {
    expect(getFetchedAt()).toBe("2026-09-13T15:00:00.000Z");
  });

  it("écrase la récolte précédente au lieu d'accumuler", () => {
    saveForecast([row("A", "2026-09-18T08:00", 99)], "2026-09-13T16:00:00.000Z");
    const hours = readHours(["A"], "2026-09-18T00:00", "2026-09-18T23:00");
    expect(hours.get("A")?.get("2026-09-18T08:00")?.temp).toBe(99);
    expect(getFetchedAt()).toBe("2026-09-13T16:00:00.000Z");
  });

  it("préserve les null au lieu de les transformer en zéro", () => {
    const creux = { ...row("C", "2026-09-18T08:00", 0), temp: null, code: null };
    saveForecast([creux], "2026-09-13T17:00:00.000Z");
    const hours = readHours(["C"], "2026-09-18T00:00", "2026-09-18T23:00");
    expect(hours.get("C")?.get("2026-09-18T08:00")?.temp).toBeNull();
    expect(hours.get("C")?.get("2026-09-18T08:00")?.code).toBeNull();
  });

  // Ces deux cas court-circuitent avant tout appel réseau : ils vérifient
  // précisément que la récolte N'EST PAS déclenchée.
  it("sert le cache sans toucher au réseau tant qu'il est frais", async () => {
    saveForecast([row("A", "2026-09-18T08:00", 10)], "2026-09-13T12:00:00.000Z");
    const f = await ensureFresh(new Date("2026-09-13T12:30:00.000Z"));
    expect(f.stale).toBe(false);
    expect(f.error).toBeNull();
    expect(f.ageMinutes).toBe(30);
  });

  it("ne rend jamais un âge négatif si l'horloge recule", async () => {
    saveForecast([row("A", "2026-09-18T08:00", 10)], "2026-09-13T12:00:00.000Z");
    const f = await ensureFresh(new Date("2026-09-13T11:00:00.000Z"));
    expect(f.ageMinutes).toBe(0);
    expect(f.stale).toBe(false);
  });
});
