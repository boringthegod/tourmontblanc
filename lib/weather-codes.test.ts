import { describe, expect, it } from "vitest";
import { STORM_CODES, weatherFamily, weatherLabel } from "./weather-codes";

describe("codes WMO", () => {
  it("nomme les codes courants en français", () => {
    expect(weatherLabel(0)).toBe("Ciel clair");
    expect(weatherLabel(3)).toBe("Couvert");
    expect(weatherLabel(45)).toBe("Brouillard");
    expect(weatherLabel(63)).toBe("Pluie modérée");
    expect(weatherLabel(73)).toBe("Neige modérée");
    expect(weatherLabel(95)).toBe("Orage");
  });

  it("classe les codes par famille visuelle", () => {
    expect(weatherFamily(0)).toBe("clair");
    expect(weatherFamily(2)).toBe("nuageux");
    expect(weatherFamily(48)).toBe("brouillard");
    expect(weatherFamily(81)).toBe("pluie");
    expect(weatherFamily(86)).toBe("neige");
    expect(weatherFamily(99)).toBe("orage");
  });

  it("dégrade proprement sur un code absent ou inconnu", () => {
    expect(weatherLabel(null)).toBe("—");
    expect(weatherLabel(1234)).toBe("—");
    expect(weatherFamily(null)).toBe("nuageux");
  });

  it("expose les codes d'orage", () => {
    expect([...STORM_CODES]).toEqual([95, 96, 99]);
  });
});
