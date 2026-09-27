"use client";

// Chargement client des tracés réels (fichiers statiques /trails/etape-N.json).
export type ClientTrail = {
  n: number;
  coords: [number, number, number][]; // [lng, lat, alt]
};

const cache = new Map<number, Promise<ClientTrail | null>>();

export function loadTrail(n: number): Promise<ClientTrail | null> {
  if (!cache.has(n)) {
    cache.set(
      n,
      fetch(`/trails/etape-${n}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((geo) =>
          geo?.geometry?.coordinates?.length > 1
            ? { n, coords: geo.geometry.coordinates }
            : null,
        )
        .catch(() => null),
    );
  }
  return cache.get(n)!;
}

export function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[Math.floor(i)]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}
