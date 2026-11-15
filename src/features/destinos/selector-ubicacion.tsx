"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleMarker, LatLngTuple, Map } from "leaflet";
import "leaflet/dist/leaflet.css";

const lambayeque: LatLngTuple = [-6.53, -79.83];

function MapaUbicacion({
  inicial,
  elegir,
}: {
  inicial: LatLngTuple;
  elegir: (latitud: string, longitud: string) => void;
}) {
  const lienzo = useRef<HTMLDivElement>(null);
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    let mapa: Map | undefined;
    let punto: CircleMarker | undefined;
    void import("leaflet")
      .then((modulo) => {
        if (!vigente || !lienzo.current) return;
        const biblioteca = modulo.default ?? modulo;
        mapa = biblioteca
          .map(lienzo.current, { scrollWheelZoom: false })
          .setView(inicial, 12);
        biblioteca
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          })
          .addTo(mapa);
        mapa.on("click", ({ latlng }) => {
          if (!mapa) return;
          punto ??= biblioteca
            .circleMarker(latlng, { radius: 8, color: "#134e4a" })
            .addTo(mapa);
          punto.setLatLng(latlng);
          elegir(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
        });
      })
      .catch(() => {
        if (vigente) cambiarFallo(true);
      });
    return () => {
      vigente = false;
      mapa?.remove();
    };
  }, [inicial, elegir]);

  return fallo ? (
    <p role="alert">
      No pudimos abrir el mapa. Puedes escribir las coordenadas.
    </p>
  ) : (
    <div
      ref={lienzo}
      className="relative isolate h-64 rounded-xl border border-teal-900/15"
    />
  );
}

export function SelectorUbicacion({
  coordenadas,
  soloLectura = false,
}: {
  coordenadas?: { latitud: number; longitud: number };
  soloLectura?: boolean;
}) {
  const [latitud, cambiarLatitud] = useState(
    coordenadas?.latitud.toString() ?? "",
  );
  const [longitud, cambiarLongitud] = useState(
    coordenadas?.longitud.toString() ?? "",
  );
  const [centro, cambiarCentro] = useState<LatLngTuple>();
  const actualizar = useCallback((latitud: string, longitud: string) => {
    cambiarLatitud(latitud);
    cambiarLongitud(longitud);
  }, []);

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["latitud", "Latitud", latitud, cambiarLatitud, 90],
            ["longitud", "Longitud", longitud, cambiarLongitud, 180],
          ] as const
        ).map(([nombre, etiqueta, valor, cambiar, limite]) => (
          <label key={nombre} className="grid gap-1.5 text-sm font-semibold">
            {etiqueta}
            <input
              name={nombre}
              value={valor}
              required
              type="number"
              step="any"
              min={-limite}
              max={limite}
              className="min-w-0 rounded-xl border border-teal-900/20 bg-white px-3 py-2 font-normal"
              onChange={(evento) => cambiar(evento.target.value)}
            />
          </label>
        ))}
      </div>
      {!soloLectura && (
        <button
          type="button"
          className="font-semibold text-teal-900 underline"
          onClick={() =>
            cambiarCentro(
              centro
                ? undefined
                : latitud &&
                    longitud &&
                    Math.abs(Number(latitud)) <= 90 &&
                    Math.abs(Number(longitud)) <= 180
                  ? [Number(latitud), Number(longitud)]
                  : lambayeque,
            )
          }
        >
          {centro ? "Cerrar mapa" : "Elegir punto en el mapa"}
        </button>
      )}
      {centro && !soloLectura && (
        <>
          <p className="text-sm text-stone-600">
            Pulsa en el mapa para seleccionar el punto o escribe las
            coordenadas.
          </p>
          <MapaUbicacion inicial={centro} elegir={actualizar} />
        </>
      )}
    </div>
  );
}
