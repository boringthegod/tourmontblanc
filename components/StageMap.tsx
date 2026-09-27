"use client";

// Carte 2D de l'étape : tracé réel (fichier /trails) avec repli polyligne waypoints.
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Waypoint } from "@/lib/seed-data";
import { downsample, loadTrail } from "@/lib/load-trail";
import { stageColor } from "@/lib/stage-colors";

function FitTrail({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(new LatLngBounds(positions).pad(0.08));
    }
  }, [map, positions]);
  return null;
}

export default function StageMap({
  n,
  waypoints,
}: {
  n: number;
  waypoints: Waypoint[];
}) {
  const [trail, setTrail] = useState<[number, number][] | null>(null);
  useEffect(() => {
    let alive = true;
    loadTrail(n).then((t) => {
      if (alive && t) {
        setTrail(downsample(t.coords, 800).map(([lng, lat]) => [lat, lng]));
      }
    });
    return () => {
      alive = false;
    };
  }, [n]);

  if (waypoints.length < 2) return null;
  const fallback = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
  const positions = trail ?? fallback;
  const bounds = new LatLngBounds(fallback).pad(0.2);
  const last = waypoints.length - 1;
  return (
    <div>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        className="z-0 h-80 w-full rounded-lg border border-line"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          pathOptions={{
            color: stageColor(n),
            weight: 3.5,
            dashArray: trail ? undefined : "6 6",
          }}
        />
        <FitTrail positions={positions} />
        {waypoints.map((w, i) => (
          <CircleMarker
            key={`${w.name}-${w.km}`}
            center={[w.lat, w.lng]}
            radius={i === 0 || i === last ? 7 : 5}
            pathOptions={{
              color: "#2F3437",
              weight: 2,
              fillColor: i === 0 || i === last ? "#2F3437" : "#FFFFFF",
              fillOpacity: 1,
            }}
          >
            <Tooltip>{`${w.name} · ${w.alt} m`}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <p className="mt-1 text-xs text-muted">
        {trail
          ? "Tracé réel le long des sentiers (routage OSM/BRouter)."
          : "Tracé approximatif reliant les points de passage."}
      </p>
    </div>
  );
}
