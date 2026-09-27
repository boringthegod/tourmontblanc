"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { TourNight, TourStage } from "./TourMap";
import { MapToggle } from "./MapToggle";

const loading = () => (
  <div className="h-[65vh] min-h-96 w-full animate-pulse rounded-lg border border-line bg-white" />
);
const TourMap = dynamic(() => import("./TourMap"), { ssr: false, loading });
const Map3D = dynamic(() => import("./Map3D"), { ssr: false, loading });

export function TourMapView({
  stages,
  nights,
}: {
  stages: TourStage[];
  nights: TourNight[];
}) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <MapToggle mode={mode} onChange={setMode} />
      </div>
      {mode === "2d" ? (
        <TourMap stages={stages} nights={nights} />
      ) : (
        <Map3D
          stages={stages.map((s) => ({ n: s.n, title: s.title, color: s.color }))}
          nights={nights.map((n) => ({
            label: n.label,
            lat: n.lat,
            lng: n.lng,
            kind: n.kind,
          }))}
          fallbacks={Object.fromEntries(
            stages.map((s) => [
              s.n,
              s.positions.map(([lat, lng]) => [lng, lat] as [number, number]),
            ]),
          )}
        />
      )}
    </div>
  );
}
