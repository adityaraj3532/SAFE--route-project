"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

import type { Route } from "../data/demoRoutes";
import "maplibre-gl/dist/maplibre-gl.css";

const sourceId = "walking-routes";

export default function Map({ routes, selectedRoute }: { routes: Route[]; selectedRoute: number }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [75.7873, 26.9124],
      zoom: 12,
    });
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl(), "top-right");
    instance.once("load", () => {
      instance.resize();
      instance.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      instance.addLayer({
        id: sourceId,
        type: "line",
        source: sourceId,
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": ["get", "active"] },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["==", ["get", "active"], 1], 7, 4],
          "line-opacity": ["case", ["==", ["get", "active"], 1], 1, 0.65],
        },
      });
    });
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const draw = () => {
      instance.getSource<maplibregl.GeoJSONSource>(sourceId)?.setData({
        type: "FeatureCollection",
        features: routes.flatMap((route, index) => route.geometry ? [{
          type: "Feature",
          properties: { color: route.color, active: Number(index === selectedRoute) },
          geometry: route.geometry,
        }] : []),
      });

      const coordinates = routes[selectedRoute]?.geometry?.coordinates;
      if (!coordinates?.length) return;
      const bounds = coordinates.reduce(
        (area, point) => area.extend(point),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      instance.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 400 });
    };

    if (instance.getSource(sourceId)) draw();
    else instance.once("load", draw);
    return () => { instance.off("load", draw); };
  }, [routes, selectedRoute]);

  return <div ref={container} style={{ width: "100%", height: "600px" }} />;
}
