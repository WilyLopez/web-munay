"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleMarker, LatLngTuple, Map } from "leaflet";
import "leaflet/dist/leaflet.css";

const centroLambayeque: LatLngTuple = [-6.77137, -79.84088];

function extraerCoordenadas(texto: string): { lat: string; lng: string } | null {
  const normalizado = texto.trim();
  if (!normalizado) return null;
  const urlArroba = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(normalizado);
  if (urlArroba) {
    return {
      lat: Number(urlArroba[1]).toFixed(6),
      lng: Number(urlArroba[2]).toFixed(6),
    };
  }
  const urlParam = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(normalizado);
  if (urlParam) {
    return {
      lat: Number(urlParam[1]).toFixed(6),
      lng: Number(urlParam[2]).toFixed(6),
    };
  }
  const patronPar = /(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/.exec(
    normalizado,
  );
  if (patronPar) {
    const lat = Number(patronPar[1]);
    const lng = Number(patronPar[2]);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      };
    }
  }
  return null;
}

export function MapaUbicacion({
  inicial,
  latitud,
  longitud,
  elegir,
}: {
  inicial?: LatLngTuple;
  latitud?: number;
  longitud?: number;
  elegir?: (latitud: string, longitud: string) => void;
}) {
  const lienzo = useRef<HTMLDivElement>(null);
  const mapaInstancia = useRef<Map | null>(null);
  const marcadorInstancia = useRef<CircleMarker | null>(null);
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    void import("leaflet")
      .then((modulo) => {
        if (!vigente || !lienzo.current || mapaInstancia.current) return;
        const biblioteca = modulo.default ?? modulo;
        const latValida =
          latitud !== undefined && !isNaN(latitud) ? latitud : inicial?.[0];
        const lngValida =
          longitud !== undefined && !isNaN(longitud) ? longitud : inicial?.[1];
        const tieneCoordenadas =
          latValida !== undefined && lngValida !== undefined;
        const centro: LatLngTuple = tieneCoordenadas
          ? [latValida, lngValida]
          : centroLambayeque;

        const mapa = biblioteca
          .map(lienzo.current, { scrollWheelZoom: false })
          .setView(centro, tieneCoordenadas ? 14 : 11);

        biblioteca
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          })
          .addTo(mapa);

        let punto: CircleMarker | undefined;
        if (tieneCoordenadas) {
          punto = biblioteca
            .circleMarker(centro, {
              radius: 9,
              color: "#ffffff",
              weight: 3,
              fillColor: "#174238",
              fillOpacity: 1,
            })
            .addTo(mapa);
        }

        if (elegir) {
          mapa.on("click", ({ latlng }) => {
            if (!punto) {
              punto = biblioteca
                .circleMarker(latlng, {
                  radius: 9,
                  color: "#ffffff",
                  weight: 3,
                  fillColor: "#174238",
                  fillOpacity: 1,
                })
                .addTo(mapa);
              marcadorInstancia.current = punto;
            } else {
              punto.setLatLng(latlng);
            }
            elegir(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
          });
        }

        mapaInstancia.current = mapa;
        marcadorInstancia.current = punto ?? null;
      })
      .catch(() => {
        if (vigente) cambiarFallo(true);
      });

    return () => {
      vigente = false;
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
        marcadorInstancia.current = null;
      }
    };
  }, [elegir, inicial, latitud, longitud]);

  useEffect(() => {
    if (
      !mapaInstancia.current ||
      latitud === undefined ||
      longitud === undefined ||
      isNaN(latitud) ||
      isNaN(longitud)
    ) {
      return;
    }
    const destino: LatLngTuple = [latitud, longitud];
    mapaInstancia.current.setView(
      destino,
      Math.max(mapaInstancia.current.getZoom(), 14),
    );
    if (marcadorInstancia.current) {
      marcadorInstancia.current.setLatLng(destino);
    } else {
      void import("leaflet").then((modulo) => {
        if (!mapaInstancia.current) return;
        const biblioteca = modulo.default ?? modulo;
        const punto = biblioteca
          .circleMarker(destino, {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#174238",
            fillOpacity: 1,
          })
          .addTo(mapaInstancia.current);
        marcadorInstancia.current = punto;
      });
    }
  }, [latitud, longitud]);

  return fallo ? (
    <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">
      No pudimos cargar el mapa interactivo. Puedes escribir las coordenadas
      manualmente o pegar el enlace de Google Maps.
    </p>
  ) : (
    <div
      ref={lienzo}
      aria-label={
        elegir
          ? "Mapa interactivo para seleccionar la ubicación"
          : "Mapa con el punto de llegada"
      }
      className="relative isolate h-72 w-full rounded-2xl border border-[#dce3da] shadow-inner"
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
    coordenadas?.latitud !== undefined ? coordenadas.latitud.toString() : "",
  );
  const [longitud, cambiarLongitud] = useState(
    coordenadas?.longitud !== undefined ? coordenadas.longitud.toString() : "",
  );
  const [mostrarMapa, cambiarMostrarMapa] = useState(true);
  const [entradaGoogle, cambiarEntradaGoogle] = useState("");
  const [detectando, cambiarDetectando] = useState(false);
  const [mensajeEstado, cambiarMensajeEstado] = useState("");

  const actualizarCoordenadas = useCallback(
    (nuevaLat: string, nuevaLng: string) => {
      cambiarLatitud(nuevaLat);
      cambiarLongitud(nuevaLng);
      cambiarMensajeEstado("Coordenadas actualizadas desde el mapa.");
    },
    [],
  );

  const procesarPegadoGoogle = useCallback(
    (valor: string) => {
      cambiarEntradaGoogle(valor);
      const extraido = extraerCoordenadas(valor);
      if (extraido) {
        cambiarLatitud(extraido.lat);
        cambiarLongitud(extraido.lng);
        cambiarMensajeEstado(
          "Coordenadas importadas correctamente desde Google Maps.",
        );
      }
    },
    [],
  );

  const obtenerUbicacionGps = useCallback(() => {
    if (!navigator.geolocation) {
      cambiarMensajeEstado(
        "Tu navegador no soporta geolocalización automática.",
      );
      return;
    }
    cambiarDetectando(true);
    cambiarMensajeEstado("Obteniendo tu ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        cambiarDetectando(false);
        const lat = posicion.coords.latitude.toFixed(6);
        const lng = posicion.coords.longitude.toFixed(6);
        cambiarLatitud(lat);
        cambiarLongitud(lng);
        cambiarMensajeEstado("Ubicación actual detectada con éxito.");
      },
      () => {
        cambiarDetectando(false);
        cambiarMensajeEstado(
          "No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const numLat = Number(latitud);
  const numLng = Number(longitud);
  const coordenadasValidas =
    latitud !== "" &&
    longitud !== "" &&
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    Math.abs(numLat) <= 90 &&
    Math.abs(numLng) <= 180;

  const enlaceGoogleMaps = coordenadasValidas
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitud},${longitud}`)}`
    : null;

  return (
    <div className="space-y-4 rounded-2xl border border-[#dce3da] bg-[#fbfcfb] p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block text-sm font-semibold text-[#173b32]">
            Coordenadas geográficas
          </span>
          <p className="text-xs text-[#526a60]">
            Punto de referencia para el mapa y la verificación de visitas en el
            atractivo.
          </p>
        </div>
        {!soloLectura && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={detectando}
              onClick={obtenerUbicacionGps}
              className="rounded-xl border border-[#bdcfc2] bg-white px-3 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed] disabled:opacity-50"
            >
              {detectando ? "Detectando..." : "Usar mi ubicación actual"}
            </button>
            <button
              type="button"
              onClick={() => cambiarMostrarMapa((previo) => !previo)}
              className="rounded-xl border border-[#bdcfc2] bg-white px-3 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
            >
              {mostrarMapa ? "Ocultar mapa" : "Mostrar mapa"}
            </button>
          </div>
        )}
      </div>

      {!soloLectura && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#3b5449]">
            Pegar enlace o coordenadas de Google Maps
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={entradaGoogle}
              onChange={(evento) => procesarPegadoGoogle(evento.target.value)}
              placeholder="https://maps.google.com/... o -6.771234, -79.841234"
              className="min-w-0 flex-1 rounded-xl border border-[#bdcfc2] bg-white px-3 py-2 text-xs text-[#173b32]"
            />
            <button
              type="button"
              onClick={() => procesarPegadoGoogle(entradaGoogle)}
              className="rounded-xl bg-[#174238] px-3 py-2 text-xs font-semibold text-white hover:bg-[#23574a]"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {mensajeEstado && (
        <p className="rounded-xl bg-[#eef4ee] px-3 py-2 text-xs text-[#1e483d]">
          {mensajeEstado}
        </p>
      )}

      {mostrarMapa && (
        <div className="space-y-2">
          <MapaUbicacion
            latitud={coordenadasValidas ? numLat : undefined}
            longitud={coordenadasValidas ? numLng : undefined}
            elegir={soloLectura ? undefined : actualizarCoordenadas}
          />
          {!soloLectura && (
            <p className="text-center text-xs text-[#526a60]">
              Haz clic directamente en el mapa para marcar o ajustar la posición
              exacta.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-[#173b32]">
          Latitud
          <input
            name="latitud"
            type="number"
            step="any"
            required
            readOnly={soloLectura}
            value={latitud}
            min={-90}
            max={90}
            onChange={(evento) => cambiarLatitud(evento.target.value)}
            className="rounded-xl border border-[#bdcfc2] bg-white px-3 py-2 text-sm font-normal text-[#173b32] read-only:bg-[#f4f5ef]"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-[#173b32]">
          Longitud
          <input
            name="longitud"
            type="number"
            step="any"
            required
            readOnly={soloLectura}
            value={longitud}
            min={-180}
            max={180}
            onChange={(evento) => cambiarLongitud(evento.target.value)}
            className="rounded-xl border border-[#bdcfc2] bg-white px-3 py-2 text-sm font-normal text-[#173b32] read-only:bg-[#f4f5ef]"
          />
        </label>
      </div>

      {enlaceGoogleMaps && (
        <div className="flex items-center justify-between text-xs text-[#3b5449]">
          <span>Punto fijado: {latitud}, {longitud}</span>
          <a
            href={enlaceGoogleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#174238] underline hover:text-[#23574a]"
          >
            Abrir en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
