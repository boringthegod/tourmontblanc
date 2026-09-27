"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Waypoint } from "@/lib/seed-data";
import { stageColor } from "@/lib/stage-colors";
import { MapToggle } from "./MapToggle";

const loading = () => (
  <div className="h-80 w-full animate-pulse rounded-lg border border-line bg-white" />
);
const StageMap = dynamic(() => import("./StageMap"), { ssr: false, loading });
const Map3D = dynamic(() => import("./Map3D"), { ssr: false, loading });

export function StageMapView({
  n,
  title,
  waypoints,
  nightLabel,
}: {
  n: number;
  title: string;
  waypoints: Waypoint[];
  nightLabel?: string;
}) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const last = waypoints[waypoints.length - 1];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          Le tracé
        </p>
        <MapToggle mode={mode} onChange={setMode} />
      </div>
      {mode === "2d" ? (
        <StageMap n={n} waypoints={waypoints} />
      ) : (
        <Map3D
          stages={[{ n, title, color: stageColor(n) }]}
          nights={
            nightLabel && last
              ? [{ label: nightLabel, lat: last.lat, lng: last.lng, kind: "refuge" }]
              : []
          }
          fallbacks={{ [n]: waypoints.map((w) => [w.lng, w.lat]) }}
        />
      )}
    </div>
  );
}
