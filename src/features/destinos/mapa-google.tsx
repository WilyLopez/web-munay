"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import type { Destino } from "./catalogo";

const clave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let configurado = false;

export function MapaGoogle({
  destinos,
  seleccionado,
  seleccionar,
}: {
  destinos: Destino[];
  seleccionado?: Destino;
  seleccionar: (id: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [motor, cambiarMotor] = useState<{
    mapa: google.maps.Map;
    Marcador: typeof google.maps.marker.AdvancedMarkerElement;
  }>();
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    if (!clave) return;
    let activo = true;
    if (!configurado) {
      setOptions({ key: clave, v: "weekly" });
      configurado = true;
    }
    void Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(([{ Map }, { AdvancedMarkerElement }]) => {
        if (!activo || !contenedor.current) return;
        cambiarMotor({
          mapa: new Map(contenedor.current, {
            center: { lat: -6.53, lng: -79.83 },
            zoom: 10,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
            streetViewControl: false,
          }),
          Marcador: AdvancedMarkerElement,
        });
      })
      .catch(() => {
        if (activo) cambiarFallo(true);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!motor) return;
    const limites = new google.maps.LatLngBounds();
    const marcadores = destinos.map((destino) => {
      const position = { lat: destino.latitud, lng: destino.longitud };
      limites.extend(position);
      const marcador = new motor.Marcador({
        map: motor.mapa,
        position,
        title: destino.nombre,
        gmpClickable: true,
      });
      const elegir = () => seleccionar(destino.id);
      marcador.addEventListener("gmp-click", elegir);
      return { marcador, elegir };
    });
    if (destinos.length > 1) motor.mapa.fitBounds(limites, 32);
    else if (destinos.length === 1) {
      motor.mapa.setCenter(limites.getCenter());
      motor.mapa.setZoom(13);
    }
    return () => {
      for (const { marcador, elegir } of marcadores) {
        marcador.removeEventListener("gmp-click", elegir);
        marcador.map = null;
      }
    };
  }, [motor, destinos, seleccionar]);

  useEffect(() => {
    if (!motor || !seleccionado) return;
    motor.mapa.panTo({ lat: seleccionado.latitud, lng: seleccionado.longitud });
    motor.mapa.setZoom(15);
  }, [motor, seleccionado]);

  return (
    <div className="space-y-2">
      {!clave || fallo ? (
        <p role="status" className="rounded-xl border border-stone-300 p-4">
          Google Maps no está disponible. Puedes seguir explorando en Pines.
        </p>
      ) : (
        <>
          {!motor && <p role="status">Cargando Google Maps…</p>}
          <div
            ref={contenedor}
            role="region"
            aria-label="Google Maps de Lambayeque"
            className="h-96 overflow-hidden rounded-2xl border border-stone-200 sm:h-[32rem]"
          />
        </>
      )}
    </div>
  );
}
