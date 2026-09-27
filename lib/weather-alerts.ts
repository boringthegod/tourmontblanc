// lib/weather-alerts.ts
// Règles d'arbitrage. On n'évalue que les heures d'exposition réelle (de l'ETA du
// premier point à celle du dernier) : la pluie de 3h du matin n'est pas une alerte.
//
// La règle neige justifie toute l'architecture — elle ne se calcule qu'en
// comparant l'isotherme 0 °C à l'altitude du point précis où l'on sera, à l'heure
// où l'on y sera. Aucune météo de vallée ne peut la produire.
import type { HourRow } from "./weather-api";
import { STORM_CODES } from "./weather-codes";

export const THRESHOLDS = Object.freeze({
  gustWarn: 60, // km/h
  gustAlert: 80, // km/h
  freezingMarginM: 200, // m au-dessus du point
  rainTotalMm: 5, // cumul sur l'étape
  rainProbPct: 60,
  rainProbHours: 3, // heures consécutives
  feelsColdC: -5,
  visibilityM: 500,
});

export type Severity = "attention" | "alerte";
export type Confidence = "haute" | "fiable" | "tendance";
export type Alert = { rule: string; severity: Severity; message: string };

export type Exposure = {
  name: string;
  alt: number;
  hourKey: string;
  hour: HourRow | null;
};

export function confidenceFor(dayDate: string, today: string): Confidence {
  const days = Math.round(
    (new Date(`${dayDate}T12:00:00`).getTime() -
      new Date(`${today}T12:00:00`).getTime()) /
      86_400_000,
  );
  if (days <= 2) return "haute";
  if (days <= 5) return "fiable";
  return "tendance";
}

function hourLabel(hourKey: string): string {
  return `${Number(hourKey.slice(11, 13))}h`;
}

export function stageAlerts(
  exposure: Exposure[],
  confidence: Confidence,
): Alert[] {
  const seen = exposure.filter(
    (e): e is Exposure & { hour: HourRow } => e.hour !== null,
  );
  if (seen.length === 0) return [];

  // Au-delà de J+5 on affaiblit la formulation, jamais le seuil.
  const attendu = confidence === "tendance" ? "possible" : "prévu";
  const attendue = confidence === "tendance" ? "possible" : "prévue";
  const alerts: Alert[] = [];

  const storm = seen.find((e) => e.hour.code !== null && STORM_CODES.includes(e.hour.code));
  if (storm) {
    alerts.push({
      rule: "orage",
      severity: "alerte",
      message: `Orage ${attendu} vers ${hourLabel(storm.hourKey)}, ${storm.name}`,
    });
  }

  const worstGust = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) =>
      (e.hour.gust ?? 0) > (best?.hour.gust ?? -1) ? e : best,
    null,
  );
  const gust = worstGust?.hour.gust ?? 0;
  if (gust >= THRESHOLDS.gustWarn) {
    alerts.push({
      rule: "rafales",
      severity: gust >= THRESHOLDS.gustAlert ? "alerte" : "attention",
      message: `Rafales à ${Math.round(gust)} km/h vers ${hourLabel(worstGust!.hourKey)}, ${worstGust!.name}`,
    });
  }

  // La plus significative doit être retenue, pas la première heure qui
  // dépasse le seuil (ex. -6 °C à 9h puis -15 °C à 10h : c'est -15 qui compte).
  const worstSnow = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) =>
      (e.hour.snowfall ?? 0) > (best?.hour.snowfall ?? -1) ? e : best,
    null,
  );
  const snowfall = worstSnow?.hour.snowfall ?? 0;

  const worstFreezing = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) => {
      const deficit =
        e.alt + THRESHOLDS.freezingMarginM - (e.hour.freezingLevel ?? Infinity);
      const bestDeficit = best
        ? best.alt +
          THRESHOLDS.freezingMarginM -
          (best.hour.freezingLevel ?? Infinity)
        : -Infinity;
      return deficit > bestDeficit ? e : best;
    },
    null,
  );
  const freezingDeficit = worstFreezing
    ? worstFreezing.alt +
      THRESHOLDS.freezingMarginM -
      (worstFreezing.hour.freezingLevel ?? Infinity)
    : -Infinity;

  if (snowfall > 0) {
    alerts.push({
      rule: "neige",
      severity: "attention",
      message: `Neige ${attendue} vers ${hourLabel(worstSnow!.hourKey)}, ${worstSnow!.name}`,
    });
  } else if (freezingDeficit > 0) {
    alerts.push({
      rule: "neige",
      severity: "attention",
      message: `Iso 0 °C à ${Math.round(worstFreezing!.hour.freezingLevel!)} m vers ${hourLabel(worstFreezing!.hourKey)}, sous ${worstFreezing!.name} (${Math.round(worstFreezing!.alt)} m) — neige ${attendue}`,
    });
  }

  const totalRain = seen.reduce((t, e) => t + (e.hour.precip ?? 0), 0);
  const worstRain = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) =>
      (e.hour.precip ?? 0) > (best?.hour.precip ?? -1) ? e : best,
    null,
  );

  // Suit non seulement la plus longue série d'heures à forte probabilité de
  // pluie, mais aussi son point de départ — pour pouvoir situer l'alerte.
  let run = 0;
  let runStart = -1;
  let longestRun = 0;
  let longestRunStart = -1;
  seen.forEach((e, i) => {
    if ((e.hour.precipProb ?? 0) >= THRESHOLDS.rainProbPct) {
      if (run === 0) runStart = i;
      run += 1;
      if (run > longestRun) {
        longestRun = run;
        longestRunStart = runStart;
      }
    } else {
      run = 0;
    }
  });

  if (totalRain > THRESHOLDS.rainTotalMm) {
    alerts.push({
      rule: "pluie",
      severity: "attention",
      message: `${totalRain.toFixed(0)} mm de pluie ${attendue} sur l'étape, le plus fort vers ${hourLabel(worstRain!.hourKey)}, ${worstRain!.name}`,
    });
  } else if (longestRun >= THRESHOLDS.rainProbHours) {
    const start = seen[longestRunStart];
    alerts.push({
      rule: "pluie",
      severity: "attention",
      message: `Pluie ${attendue} sur ${longestRun} h consécutives à partir de ${hourLabel(start.hourKey)}, ${start.name}`,
    });
  }

  const coldest = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) =>
      (e.hour.feels ?? Infinity) < (best?.hour.feels ?? Infinity) ? e : best,
    null,
  );
  const feels = coldest?.hour.feels ?? Infinity;
  if (feels <= THRESHOLDS.feelsColdC) {
    alerts.push({
      rule: "froid",
      severity: "attention",
      message: `Ressenti ${Math.round(coldest!.hour.feels!)} °C vers ${hourLabel(coldest!.hourKey)}, ${coldest!.name}`,
    });
  }

  const worstFog = seen.reduce<(Exposure & { hour: HourRow }) | null>(
    (best, e) =>
      (e.hour.visibility ?? Infinity) < (best?.hour.visibility ?? Infinity)
        ? e
        : best,
    null,
  );
  const visibility = worstFog?.hour.visibility ?? Infinity;
  if (visibility < THRESHOLDS.visibilityM) {
    alerts.push({
      rule: "visibilité",
      severity: "attention",
      message: `Visibilité sous ${THRESHOLDS.visibilityM} m vers ${hourLabel(worstFog!.hourKey)}, ${worstFog!.name}`,
    });
  }

  return alerts;
}
