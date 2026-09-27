"use client";

// Vue 3D : terrain MapLibre GL (tuiles d'élévation Terrarium AWS, sans clé),
// imagerie satellite Esri, tracés réels drapés sur le relief.
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { downsample, loadTrail } from "@/lib/load-trail";

// Le bundler ne sait pas empaqueter le worker MapLibre : on sert une copie
// statique (public/maplibre/, rafraîchie en postinstall).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type Stage3D = { n: number; title: string; color: string };
export type Night3D = {
  label: string;
  lat: number;
  lng: number;
  kind: "base" | "refuge";
};

export default function Map3D({
  stages,
  nights,
  fallbacks,
}: {
  stages: Stage3D[];
  nights: Night3D[];
  // Repli si un fichier de tracé manque : polyligne waypoints [lng, lat][]
  fallbacks: Record<number, [number, number][]>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
          dem: {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 14,
            attribution: "Terrain: AWS Open Data / Mapzen",
          },
        },
        layers: [{ id: "satellite", type: "raster", source: "satellite" }],
      },
      center: [6.93, 45.85],
      zoom: 10,
      pitch: 62,
      bearing: -20,
      maxPitch: 80,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__tmbMap = map;
    }

    let disposed = false;

    // Cap (°) de a vers b pour orienter la caméra le long de l'itinéraire.
    const headingDeg = (a: [number, number], b: [number, number]) => {
      const rad = Math.PI / 180;
      const dLng = (b[0] - a[0]) * rad;
      const la1 = a[1] * rad;
      const la2 = b[1] * rad;
      const y = Math.sin(dLng) * Math.cos(la2);
      const x =
        Math.cos(la1) * Math.sin(la2) -
        Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
      return (Math.atan2(y, x) * 180) / Math.PI;
    };

    map.on("load", async () => {
      if (disposed) return;
      map.setTerrain({ source: "dem", exaggeration: 1.3 });

      const bounds = new maplibregl.LngLatBounds();
      let routeBearing = -20;

      for (const stage of stages) {
        const trail = await loadTrail(stage.n);
        if (disposed) return;
        const coords: [number, number][] = trail
          ? downsample(trail.coords, 600).map(([lng, lat]) => [lng, lat])
          : (fallbacks[stage.n] ?? []);
        if (coords.length < 2) continue;
        coords.forEach((c) => bounds.extend(c));
        if (stages.length === 1) {
          routeBearing = headingDeg(coords[0], coords[coords.length - 1]);
        }
        map.addSource(`trail-${stage.n}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        map.addLayer({
          id: `trail-casing-${stage.n}`,
          type: "line",
          source: `trail-${stage.n}`,
          paint: {
            "line-color": "#FFFFFF",
            "line-width": 6,
            "line-opacity": 0.5,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        map.addLayer({
          id: `trail-${stage.n}`,
          type: "line",
          source: `trail-${stage.n}`,
          paint: { "line-color": stage.color, "line-width": 3.5 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      }

      for (const night of nights) {
        const el = document.createElement("div");
        el.style.cssText = `width:${night.kind === "base" ? 16 : 12}px;height:${night.kind === "base" ? 16 : 12}px;border-radius:50%;background:${night.kind === "base" ? "#2F3437" : "#FFFFFF"};border:2px solid #2F3437;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:pointer;`;
        new maplibregl.Marker({ element: el })
          .setLngLat([night.lng, night.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 12, closeButton: false }).setText(
              night.label,
            ),
          )
          .addTo(map);
        bounds.extend([night.lng, night.lat]);
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 70,
          pitch: 60,
          bearing: routeBearing,
          duration: 0,
        });
      }
    });

    return () => {
      disposed = true;
      map.remove();
    };
  }, [stages, nights, fallbacks]);

  return (
    <div>
      <div
        ref={containerRef}
        className="z-0 h-[65vh] min-h-96 w-full rounded-lg border border-line bg-[#DFE5DD]"
      />
      <p className="mt-1 text-xs text-muted">
        Relief 3D — glisse pour tourner (clic droit ou deux doigts pour
        incliner), molette pour zoomer.
      </p>
    </div>
  );
}
