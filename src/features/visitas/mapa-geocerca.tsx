"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Coordenadas } from "./tipos";
import "leaflet/dist/leaflet.css";

export function MapaGeocerca({
  destino,
  ubicacion,
  radio,
}: {
  destino: Coordenadas;
  ubicacion: Coordenadas;
  radio: number;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [fallo, informarFallo] = useState(false);
  const { latitud, longitud } = destino;
  const { latitud: visitanteLat, longitud: visitanteLng } = ubicacion;

  useEffect(() => {
    let desmontado = false;
    let mapa: Leaflet.Map | undefined;
    void import("leaflet")
      .then((L) => {
        if (desmontado || !contenedor.current) return;
        mapa = L.map(contenedor.current, {
          attributionControl: false,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
          zoomSnap: 0,
        });
        const centro: Leaflet.LatLngTuple = [latitud, longitud];
        mapa.setView(centro, 18);
        const circulo = L.circle(centro, {
          radius: radio,
          color: "#176452",
          fillOpacity: 0.19,
          interactive: false,
        }).addTo(mapa);
        L.circleMarker(centro, {
          radius: 5,
          color: "#176452",
          fillOpacity: 1,
          interactive: false,
        }).addTo(mapa);
        L.circleMarker([visitanteLat, visitanteLng], {
          radius: 7,
          color: "#fff",
          fillColor: "#1d4ed8",
          fillOpacity: 1,
          interactive: false,
        }).addTo(mapa);
        mapa.fitBounds(circulo.getBounds(), {
          padding: [20, 20],
          animate: false,
        });
      })
      .catch(() => {
        if (!desmontado) informarFallo(true);
      });
    return () => {
      desmontado = true;
      mapa?.remove();
    };
  }, [latitud, longitud, visitanteLat, visitanteLng, radio]);

  if (fallo)
    return <p className="text-sm">No pudimos dibujar el mapa de proximidad.</p>;
  return (
    <figure className="space-y-2">
      <div
        ref={contenedor}
        role="img"
        aria-label="Mapa de proximidad con tu ubicación dentro del radio permitido"
        className="isolate h-48 rounded-2xl border border-teal-200 !bg-teal-100"
      />
      <figcaption className="text-xs text-teal-950">
        Círculo verde: radio del atractivo. Punto azul: tu ubicación.
      </figcaption>
    </figure>
  );
}
