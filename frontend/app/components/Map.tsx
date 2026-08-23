"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

type MapProps = {
  selectedRoute?: number;
};

export default function Map({
  selectedRoute,
}: MapProps) {

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (map.current) return;

    console.log("Creating MapLibre map...");

    const newMap = new maplibregl.Map({
      container: mapContainer.current,

      style:
        "https://tiles.openfreemap.org/styles/liberty",

      center: [75.7873, 26.9124],

      zoom: 12
    });

    map.current = newMap;

    newMap.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    newMap.on("load", () => {
      console.log("✅ MAP LOADED");

      newMap.resize();
    });

    newMap.on("error", (event) => {
      console.error("❌ MAPLIBRE ERROR", event);
    });

    return () => {
      newMap.remove();
      map.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "600px"
      }}
    />
  );
}
