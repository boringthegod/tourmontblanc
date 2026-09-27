import { describe, expect, it } from "vitest";
import { DEPARTURE_HOUR, parseDuration, stageEta } from "./schedule";

describe("parseDuration", () => {
  it("lit les formats du topo", () => {
    expect(parseDuration("5h")).toBe(5);
    expect(parseDuration("9h30")).toBe(9.5);
    expect(parseDuration("10h30")).toBe(10.5);
  });

  it("renvoie null sur une durée absente ou illisible", () => {
    expect(parseDuration(undefined)).toBeNull();
    expect(parseDuration("une demi-journée")).toBeNull();
  });
});

describe("stageEta", () => {
  const marks = [
    { name: "Départ", km: 0, alt: 1000 },
    { name: "Col", km: 5, alt: 2000 },
    { name: "Arrivée", km: 10, alt: 1000 },
  ];
  // profil : montée régulière sur 5 km, puis descente régulière
  const points = [
    { km: 0, alt: 1000 },
    { km: 2.5, alt: 1500 },
    { km: 5, alt: 2000 },
    { km: 7.5, alt: 1500 },
    { km: 10, alt: 1000 },
  ];

  it("part à l'heure de départ", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "6h", marks, points });
    expect(eta[0].minutes).toBe(DEPARTURE_HOUR * 60);
    expect(eta[0].hourKey).toBe("2026-09-18T08:00");
  });

  it("arrive à l'heure de départ plus la durée annoncée", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "6h", marks, points });
    expect(eta[2].minutes).toBe((DEPARTURE_HOUR + 6) * 60);
    expect(eta[2].hourKey).toBe("2026-09-18T14:00");
  });

  it("consomme plus de temps en montée qu'en descente à distance égale", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "6h", marks, points });
    const montee = eta[1].minutes - eta[0].minutes;
    const descente = eta[2].minutes - eta[1].minutes;
    expect(montee).toBeGreaterThan(descente);
  });

  it("ne place pas le col au milieu chronologique — c'est tout l'intérêt", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "6h", marks, points });
    // un prorata kilométrique donnerait 11h00 pile
    expect(eta[1].minutes).toBeGreaterThan(11 * 60);
  });

  it("rend des heures strictement croissantes", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "9h30", marks, points });
    for (let i = 1; i < eta.length; i++) {
      expect(eta[i].minutes).toBeGreaterThan(eta[i - 1].minutes);
    }
  });

  it("retombe sur un prorata kilométrique sans profil", () => {
    const eta = stageEta({ date: "2026-09-18", duration: "6h", marks, points: null });
    expect(eta[1].minutes).toBe((DEPARTURE_HOUR + 3) * 60);
  });

  it("utilise l'estimation Naismith brute sans durée annoncée", () => {
    const eta = stageEta({ date: "2026-09-18", duration: undefined, marks, points });
    // 10 km / 4.5 + 1000 m / 600 ≈ 3.89 h
    expect(eta[2].minutes).toBeGreaterThan((DEPARTURE_HOUR + 3) * 60);
    expect(eta[2].minutes).toBeLessThan((DEPARTURE_HOUR + 5) * 60);
  });

  it("ne casse pas sur une étape à un seul point", () => {
    const eta = stageEta({
      date: "2026-09-18",
      duration: "6h",
      marks: [{ name: "Seul", km: 0, alt: 1000 }],
      points: null,
    });
    expect(eta).toHaveLength(1);
    expect(eta[0].hourKey).toBe("2026-09-18T08:00");
  });

  it("borne hourKey à 23h si l'étape déborde", () => {
    const eta = stageEta({
      date: "2026-09-18",
      duration: "20h",
      marks,
      points: null,
    });
    expect(eta[2].hourKey).toBe("2026-09-18T23:00");
  });
});
