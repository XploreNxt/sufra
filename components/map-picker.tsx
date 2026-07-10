"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LMap, Marker as LMarker, Circle as LCircle } from "leaflet";

interface Props {
  lat: number;
  lng: number;
  /** Draw a delivery-radius circle (km) around the pin. */
  radiusKm?: number;
  /** Let the user drag the pin / click to move it. */
  draggable?: boolean;
  onChange?: (lat: number, lng: number) => void;
  className?: string;
}

// A pin drawn as an emoji so we don't depend on Leaflet's image assets
// (which break under bundlers without extra config).
const PIN_HTML = `<span style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">📍</span>`;

export function MapPicker({
  lat,
  lng,
  radiusKm,
  draggable = false,
  onChange,
  className,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const circleRef = useRef<LCircle | null>(null);
  // Keep the latest onChange without re-initialising the map.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Init once.
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, {
        center: [lat, lng],
        zoom: 14,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        html: PIN_HTML,
        className: "sufra-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      const marker = L.marker([lat, lng], { draggable, icon }).addTo(map);

      if (radiusKm != null) {
        circleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: "#059669",
          weight: 1,
          fillColor: "#10b981",
          fillOpacity: 0.12,
        }).addTo(map);
      }

      function move(la: number, ln: number) {
        marker.setLatLng([la, ln]);
        circleRef.current?.setLatLng([la, ln]);
        onChangeRef.current?.(la, ln);
      }
      if (draggable) {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          move(p.lat, p.lng);
        });
        map.on("click", (e: L.LeafletMouseEvent) => move(e.latlng.lat, e.latlng.lng));
      }

      mapRef.current = map;
      markerRef.current = marker;
      // Leaflet mis-measures if the container sized after init.
      setTimeout(() => map.invalidateSize(), 0);

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to external lat/lng changes (e.g. "locate me", geocode result).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lng]);
    circleRef.current?.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);

  // React to radius changes.
  useEffect(() => {
    if (circleRef.current && radiusKm != null) {
      circleRef.current.setRadius(radiusKm * 1000);
    }
  }, [radiusKm]);

  return <div ref={elRef} className={className} />;
}
