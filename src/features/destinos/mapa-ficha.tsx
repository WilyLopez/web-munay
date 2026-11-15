"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLngTuple } from "leaflet";
import { MapaUbicacion } from "./selector-ubicacion";

export function MapaFicha({ punto }: { punto: LatLngTuple }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [visible, cambiarVisible] = useState(false);
  useEffect(() => {
    if (!contenedor.current) return;
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada?.isIntersecting) {
        cambiarVisible(true);
        observador.disconnect();
      }
    });
    observador.observe(contenedor.current);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={contenedor}>
      {visible ? (
        <MapaUbicacion inicial={punto} />
      ) : (
        <div className="grid h-64 place-items-center rounded-xl border border-teal-900/15 bg-teal-50 text-sm text-teal-950">
          Mapa del punto de llegada
        </div>
      )}
    </div>
  );
}
