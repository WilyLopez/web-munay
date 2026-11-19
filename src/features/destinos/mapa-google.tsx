"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Destino } from "./catalogo";
import { cargarGoogleMaps, googleMapsDisponible } from "./cargar-google-maps";

export function MapaGoogle({
  destinos,
  seleccionado,
  seleccionar,
  ubicacion,
  volver,
  compacto = false,
}: {
  destinos: Destino[];
  seleccionado?: Destino;
  seleccionar?: (id: string) => void;
  ubicacion?: google.maps.LatLngLiteral;
  volver: string;
  compacto?: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [motor, cambiarMotor] = useState<{
    mapa: google.maps.Map;
    Marcador: typeof google.maps.marker.AdvancedMarkerElement;
  }>();
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    if (!googleMapsDisponible) return;
    let activo = true;
    void cargarGoogleMaps()
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
    const marcadores = destinos.map((destino) => {
      const position = { lat: destino.latitud, lng: destino.longitud };
      const marcador = new motor.Marcador({
        map: motor.mapa,
        position,
        title: destino.nombre,
        gmpClickable: Boolean(seleccionar),
      });
      const elegir = seleccionar ? () => seleccionar(destino.id) : undefined;
      if (elegir) marcador.addEventListener("gmp-click", elegir);
      return { marcador, elegir };
    });
    return () => {
      for (const { marcador, elegir } of marcadores) {
        if (elegir) marcador.removeEventListener("gmp-click", elegir);
        marcador.map = null;
      }
    };
  }, [motor, destinos, seleccionar]);

  useEffect(() => {
    if (!motor) return;
    if (seleccionado) {
      motor.mapa.panTo({
        lat: seleccionado.latitud,
        lng: seleccionado.longitud,
      });
      motor.mapa.setZoom(15);
    } else if (destinos.length > 1) {
      const limites = new google.maps.LatLngBounds();
      for (const { latitud, longitud } of destinos) {
        limites.extend({ lat: latitud, lng: longitud });
      }
      motor.mapa.fitBounds(limites, 32);
    } else {
      const [destino] = destinos;
      motor.mapa.setCenter(
        destino
          ? { lat: destino.latitud, lng: destino.longitud }
          : { lat: -6.53, lng: -79.83 },
      );
      motor.mapa.setZoom(destino ? 13 : 10);
    }
  }, [motor, destinos, seleccionado, ubicacion]);

  useEffect(() => {
    if (!motor || !ubicacion) return;
    const indicador = new google.maps.marker.PinElement({
      background: "#2563eb",
      borderColor: "#fff",
      glyphColor: "#fff",
    });
    const marcador = new motor.Marcador({
      map: motor.mapa,
      position: ubicacion,
      title: "Mi posición",
    });
    marcador.append(indicador);
    motor.mapa.panTo(ubicacion);
    motor.mapa.setZoom(14);
    return () => {
      marcador.map = null;
    };
  }, [motor, ubicacion]);

  return (
    <div className="space-y-2">
      {!googleMapsDisponible || fallo ? (
        <p role="status" className="rounded-xl border border-stone-300 p-4">
          Google Maps no está disponible. Puedes{" "}
          <Link href={volver} className="font-semibold underline">
            consultar la lista de destinos
          </Link>
          .
        </p>
      ) : (
        <>
          {!motor && <p role="status">Cargando Google Maps…</p>}
          <div
            ref={contenedor}
            role="region"
            aria-label="Google Maps de Lambayeque"
            className={
              compacto
                ? "h-64 overflow-hidden rounded-2xl border border-stone-200 sm:h-80"
                : "h-96 overflow-hidden rounded-2xl border border-stone-200 sm:h-[32rem]"
            }
          />
        </>
      )}
    </div>
  );
}
