// lib/weather-alerts.test.ts
import { describe, expect, it } from "vitest";
import type { HourRow } from "./weather-api";
import {
  confidenceFor,
  stageAlerts,
  THRESHOLDS,
  type Exposure,
} from "./weather-alerts";

function hour(patch: Partial<HourRow> = {}): HourRow {
  return {
    spotId: "X",
    time: "2026-09-18T12:00",
    temp: 12,
    feels: 11,
    precip: 0,
    precipProb: 5,
    snowfall: 0,
    wind: 10,
    gust: 20,
    cloud: 20,
    freezingLevel: 3500,
    visibility: 20000,
    code: 1,
    ...patch,
  };
}

function exposure(patches: Partial<HourRow>[], alt = 2000): Exposure[] {
  return patches.map((p, i) => ({
    name: `Point ${i}`,
    alt,
    hourKey: `2026-09-18T${String(8 + i).padStart(2, "0")}:00`,
    hour: hour({ time: `2026-09-18T${String(8 + i).padStart(2, "0")}:00`, ...p }),
  }));
}

describe("confidenceFor", () => {
  it("classe l'échéance en trois régimes", () => {
    expect(confidenceFor("2026-09-14", "2026-09-13")).toBe("haute");
    expect(confidenceFor("2026-09-15", "2026-09-13")).toBe("haute");
    expect(confidenceFor("2026-09-16", "2026-09-13")).toBe("fiable");
    expect(confidenceFor("2026-09-18", "2026-09-13")).toBe("fiable");
    expect(confidenceFor("2026-09-19", "2026-09-13")).toBe("tendance");
    expect(confidenceFor("2026-09-25", "2026-09-13")).toBe("tendance");
  });
});

describe("stageAlerts", () => {
  it("ne signale rien par beau temps", () => {
    expect(stageAlerts(exposure([{}, {}, {}]), "fiable")).toEqual([]);
  });

  it("signale l'orage avec le lieu et l'heure", () => {
    const a = stageAlerts(exposure([{}, { code: 95 }, {}]), "fiable");
    expect(a).toHaveLength(1);
    expect(a[0].rule).toBe("orage");
    expect(a[0].severity).toBe("alerte");
    expect(a[0].message).toContain("Point 1");
    expect(a[0].message).toContain("9h");
    expect(a[0].message).toContain("prévu");
  });

  it("passe au conditionnel au-delà de J+5", () => {
    const a = stageAlerts(exposure([{ code: 99 }]), "tendance");
    expect(a[0].message).toContain("possible");
    expect(a[0].message).not.toContain("prévu");
  });

  it("garde le même seuil quelle que soit l'échéance", () => {
    const fiable = stageAlerts(exposure([{ gust: 85 }]), "fiable");
    const tendance = stageAlerts(exposure([{ gust: 85 }]), "tendance");
    expect(fiable[0].severity).toBe(tendance[0].severity);
  });

  it("gradue les rafales", () => {
    expect(stageAlerts(exposure([{ gust: 50 }]), "fiable")).toEqual([]);
    expect(stageAlerts(exposure([{ gust: 65 }]), "fiable")[0].severity).toBe(
      "attention",
    );
    expect(stageAlerts(exposure([{ gust: 85 }]), "fiable")[0].severity).toBe(
      "alerte",
    );
  });

  it("signale la neige quand l'isotherme passe sous le point", () => {
    // point à 2500 m, iso 0 °C à 2300 m → sous 2500 + marge
    const a = stageAlerts(exposure([{ freezingLevel: 2300 }], 2500), "fiable");
    expect(a.map((x) => x.rule)).toContain("neige");
    expect(a.find((x) => x.rule === "neige")!.message).toContain("2300");
    expect(a.find((x) => x.rule === "neige")!.message).toContain("2500");
  });

  it("ne signale pas la neige quand l'isotherme est largement au-dessus", () => {
    const a = stageAlerts(exposure([{ freezingLevel: 3500 }], 2500), "fiable");
    expect(a.map((x) => x.rule)).not.toContain("neige");
  });

  it("signale la neige sur chute effective même isotherme haut", () => {
    const a = stageAlerts(exposure([{ snowfall: 1.2, freezingLevel: 4000 }]), "fiable");
    expect(a.map((x) => x.rule)).toContain("neige");
  });

  it("signale la pluie au cumul", () => {
    const a = stageAlerts(exposure([{ precip: 3 }, { precip: 3 }]), "fiable");
    expect(a.map((x) => x.rule)).toContain("pluie");
    expect(a.find((x) => x.rule === "pluie")!.message).toContain("6");
  });

  it("signale la pluie sur une probabilité durable", () => {
    const a = stageAlerts(
      exposure([{ precipProb: 70 }, { precipProb: 80 }, { precipProb: 65 }]),
      "fiable",
    );
    expect(a.map((x) => x.rule)).toContain("pluie");
  });

  it("ignore une probabilité élevée trop brève", () => {
    const a = stageAlerts(
      exposure([{ precipProb: 70 }, { precipProb: 80 }, { precipProb: 10 }]),
      "fiable",
    );
    expect(a.map((x) => x.rule)).not.toContain("pluie");
  });

  it("signale le froid ressenti", () => {
    const a = stageAlerts(exposure([{ feels: -7 }]), "fiable");
    expect(a.map((x) => x.rule)).toContain("froid");
  });

  it("signale le brouillard", () => {
    const a = stageAlerts(exposure([{ visibility: 300 }]), "fiable");
    expect(a.map((x) => x.rule)).toContain("visibilité");
  });

  it("n'évalue que les heures d'exposition — il pleut la nuit, on dort", () => {
    // aucune heure d'exposition ne contient de pluie : l'orage de 3h du matin
    // n'est tout simplement pas dans la liste passée en entrée
    const journee = exposure([{}, {}, {}]);
    expect(stageAlerts(journee, "fiable")).toEqual([]);
  });

  it("ne casse pas sur des heures manquantes en base", () => {
    const trous: Exposure[] = [
      { name: "Point 0", alt: 2000, hourKey: "2026-09-18T08:00", hour: null },
      { name: "Point 1", alt: 2000, hourKey: "2026-09-18T09:00", hour: null },
    ];
    expect(stageAlerts(trous, "fiable")).toEqual([]);
  });

  it("ne produit qu'une alerte par règle", () => {
    const a = stageAlerts(exposure([{ gust: 90 }, { gust: 95 }, { gust: 88 }]), "fiable");
    expect(a.filter((x) => x.rule === "rafales")).toHaveLength(1);
  });

  it("retient la pire heure pour la neige (chute), pas la première", () => {
    const a = stageAlerts(exposure([{ snowfall: 0.3 }, { snowfall: 2.5 }]), "fiable");
    const neige = a.find((x) => x.rule === "neige")!;
    expect(neige.message).toContain("Point 1");
    expect(neige.message).toContain("9h");
  });

  it("retient la pire heure pour la neige (isotherme), pas la première", () => {
    const a = stageAlerts(
      exposure([{ freezingLevel: 2600 }, { freezingLevel: 2000 }], 2500),
      "fiable",
    );
    const neige = a.find((x) => x.rule === "neige")!;
    expect(neige.message).toContain("2000");
    expect(neige.message).not.toContain("2600");
  });

  it("retient la pire heure pour le froid, pas la première", () => {
    const a = stageAlerts(exposure([{ feels: -6 }, { feels: -15 }]), "fiable");
    expect(a.find((x) => x.rule === "froid")!.message).toContain("-15");
  });

  it("retient la pire heure pour la visibilité, pas la première", () => {
    const a = stageAlerts(
      exposure([{ visibility: 400 }, { visibility: 100 }]),
      "fiable",
    );
    const vis = a.find((x) => x.rule === "visibilité")!;
    expect(vis.message).toContain("Point 1");
    expect(vis.message).toContain("9h");
  });

  it("le message de pluie au cumul porte le lieu et l'heure du plus fort épisode", () => {
    const a = stageAlerts(exposure([{ precip: 2 }, { precip: 4 }]), "fiable");
    const pluie = a.find((x) => x.rule === "pluie")!;
    expect(pluie.message).toContain("Point 1");
    expect(pluie.message).toContain("9h");
  });

  it("le message de pluie en durée porte le lieu et l'heure de début de la série", () => {
    const a = stageAlerts(
      exposure([
        { precipProb: 20 },
        { precipProb: 70 },
        { precipProb: 80 },
        { precipProb: 65 },
      ]),
      "fiable",
    );
    const pluie = a.find((x) => x.rule === "pluie")!;
    expect(pluie.message).toContain("Point 1");
    expect(pluie.message).toContain("9h");
  });

  it("expose ses seuils", () => {
    expect(THRESHOLDS.gustAlert).toBe(80);
    expect(THRESHOLDS.freezingMarginM).toBe(200);
  });
});
