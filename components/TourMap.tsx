"use client";

// Carte 2D d'ensemble : tracés réels de toutes les étapes, nuits, base.
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { downsample, loadTrail } from "@/lib/load-trail";

export type TourStage = {
  n: number;
  title: string;
  color: string;
  positions: [number, number][]; // repli waypoints [lat, lng]
};

export type TourNight = {
  label: string;
  sub: string;
  lat: number;
  lng: number;
  kind: "base" | "refuge";
};

export default function TourMap({
  stages,
  nights,
}: {
  stages: TourStage[];
  nights: TourNight[];
}) {
  const [trails, setTrails] = useState<Record<number, [number, number][]>>({});
  useEffect(() => {
    let alive = true;
    for (const s of stages) {
      loadTrail(s.n).then((t) => {
        if (alive && t) {
          setTrails((prev) => ({
            ...prev,
            [s.n]: downsample(t.coords, 500).map(([lng, lat]) => [lat, lng]),
          }));
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [stages]);

  const all = stages.flatMap((s) => s.positions);
  if (all.length < 2) return null;
  const bounds = new LatLngBounds(all).pad(0.12);
  return (
    <div>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        className="z-0 h-[65vh] min-h-96 w-full rounded-lg border border-line"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
        {stages.map((s) => (
          <Polyline
            key={`${s.n}-${trails[s.n] ? "trail" : "fallback"}`}
            positions={trails[s.n] ?? s.positions}
            pathOptions={{
              color: s.color,
              weight: 4,
              opacity: 0.9,
              dashArray: trails[s.n] ? undefined : "6 6",
            }}
          >
            <Tooltip sticky>{`Étape ${s.n} — ${s.title}`}</Tooltip>
          </Polyline>
        ))}
        {nights.map((night) => (
          <CircleMarker
            key={night.label}
            center={[night.lat, night.lng]}
            radius={night.kind === "base" ? 9 : 6}
            pathOptions={{
              color: "#2F3437",
              weight: 2,
              fillColor: night.kind === "base" ? "#2F3437" : "#FFFFFF",
              fillOpacity: 1,
            }}
          >
            <Tooltip>
              <span className="font-medium">{night.label}</span>
              <br />
              {night.sub}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <p className="mt-1 text-xs text-muted">
        Tracés réels le long des sentiers (routage OSM). Cercle plein : base à
        Chamonix · cercle blanc : nuit en refuge/gîte.
      </p>
    </div>
  );
}
