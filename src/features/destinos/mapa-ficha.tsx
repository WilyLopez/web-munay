"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Destino } from "./catalogo";

const MapaGoogle = dynamic(
  () => import("./mapa-google").then((modulo) => modulo.MapaGoogle),
  {
    ssr: false,
    loading: EsqueletoMapaFicha,
  },
);

function EsqueletoMapaFicha() {
  return (
    <div
      role="status"
      className="grid h-64 place-items-center rounded-2xl border border-[#dedacf] bg-[#e8eee6] p-4 text-center text-sm sm:h-80"
    >
      Cargando mapa del punto de llegada…
    </div>
  );
}

export function MapaFicha({
  destino,
  punto,
  volver,
}: {
  destino: Destino;
  punto: [number, number];
  volver: string;
}) {
  const [visible, cambiarVisible] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const [latitud, longitud] = punto;
  const llegada = { ...destino, latitud, longitud };

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    if (typeof IntersectionObserver === "undefined") {
      const carga = requestAnimationFrame(() => cambiarVisible(true));
      return () => cancelAnimationFrame(carga);
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          cambiarVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={contenedor}>
      {visible ? (
        <MapaGoogle
          compacto
          destinos={[llegada]}
          seleccionado={llegada}
          volver={volver}
        />
      ) : (
        <EsqueletoMapaFicha />
      )}
    </div>
  );
}
