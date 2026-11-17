"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cargarGoogleMaps, googleMapsDisponible } from "./cargar-google-maps";

const centroLambayeque = { lat: -6.77137, lng: -79.84088 };

function extraerCoordenadas(
  texto: string,
): { lat: string; lng: string } | null {
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

function MapaUbicacion({
  latitud,
  longitud,
  elegir,
}: {
  latitud?: number;
  longitud?: number;
  elegir?: (latitud: string, longitud: string) => void;
}) {
  const lienzo = useRef<HTMLDivElement>(null);
  const [motor, cambiarMotor] = useState<{
    mapa: google.maps.Map;
    Marcador: typeof google.maps.marker.AdvancedMarkerElement;
  }>();
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    if (!googleMapsDisponible) return;
    const elemento = lienzo.current;
    if (!elemento) return;
    let vigente = true;
    void cargarGoogleMaps()
      .then(([{ Map }, { AdvancedMarkerElement }]) => {
        if (!vigente) return;
        cambiarMotor({
          mapa: new Map(elemento, {
            center: centroLambayeque,
            zoom: 11,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
            mapTypeControl: false,
            streetViewControl: false,
            gestureHandling: "cooperative",
          }),
          Marcador: AdvancedMarkerElement,
        });
      })
      .catch(() => {
        if (vigente) cambiarFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (!motor || !elegir) return;
    const evento = motor.mapa.addListener(
      "click",
      (clic: google.maps.MapMouseEvent) => {
        if (clic.latLng)
          elegir(clic.latLng.lat().toFixed(6), clic.latLng.lng().toFixed(6));
      },
    );
    return () => evento.remove();
  }, [motor, elegir]);

  useEffect(() => {
    if (!motor || latitud === undefined || longitud === undefined) return;
    const position = { lat: latitud, lng: longitud };
    motor.mapa.panTo(position);
    const marcador = new motor.Marcador({
      map: motor.mapa,
      position,
      title: "Ubicación del atractivo",
    });
    return () => {
      marcador.map = null;
    };
  }, [motor, latitud, longitud]);

  if (!googleMapsDisponible || fallo) {
    return (
      <p
        role="status"
        className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
      >
        Google Maps no está disponible. Puedes pegar las coordenadas o
        ingresarlas manualmente.
      </p>
    );
  }

  return (
    <div className="relative isolate min-w-0 overflow-hidden rounded-xl border border-[#dce3da] bg-[#edf4ed]">
      {!motor && (
        <p
          role="status"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-3 text-center text-sm"
        >
          Cargando Google Maps…
        </p>
      )}
      <div
        ref={lienzo}
        role="region"
        aria-label="Google Maps para seleccionar el atractivo"
        className="h-[clamp(16rem,45dvh,24rem)] w-full"
      />
    </div>
  );
}
export function SelectorUbicacion({
  coordenadas,
  soloLectura = false,
  mapaActivo = true,
}: {
  coordenadas?: { latitud: number; longitud: number };
  soloLectura?: boolean;
  mapaActivo?: boolean;
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

  const procesarPegadoGoogle = useCallback((valor: string) => {
    cambiarEntradaGoogle(valor);
    const extraido = extraerCoordenadas(valor);
    if (extraido) {
      cambiarLatitud(extraido.lat);
      cambiarLongitud(extraido.lng);
      cambiarMensajeEstado(
        "Coordenadas importadas correctamente desde Google Maps.",
      );
    }
  }, []);

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
    <div className="min-w-0 space-y-4 rounded-2xl border border-[#dce3da] bg-[#fbfcfb] p-3 sm:col-span-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block text-sm font-semibold text-[#173b32]">
            Punto de ingreso al atractivo
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
          <label className="block text-xs font-semibold text-[#3b5449]">
            Pegar enlace o coordenadas de Google Maps
            <input
              type="text"
              value={entradaGoogle}
              onChange={(evento) => cambiarEntradaGoogle(evento.target.value)}
              placeholder="Ej. -6.771234, -79.841234…"
              className="mt-1 min-h-11 w-full rounded-xl border border-[#bdcfc2] bg-white px-3 py-2 text-base font-normal text-[#173b32]"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (extraerCoordenadas(entradaGoogle))
                procesarPegadoGoogle(entradaGoogle);
              else
                cambiarMensajeEstado(
                  "Pega un enlace que contenga las coordenadas o escribe la latitud y la longitud.",
                );
            }}
            className="min-h-11 rounded-xl border border-[#bdcfc2] bg-white px-3 text-sm font-semibold hover:bg-[#edf4ed]"
          >
            Aplicar
          </button>
        </div>
      )}

      {mensajeEstado && (
        <p
          role="status"
          className="rounded-xl bg-[#eef4ee] px-3 py-2 text-xs text-[#1e483d]"
        >
          {mensajeEstado}
        </p>
      )}

      {mostrarMapa && mapaActivo && (
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

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
            className="min-h-11 w-full min-w-0 rounded-xl border border-[#bdcfc2] bg-white px-2 py-2 text-base font-normal text-[#173b32] read-only:bg-[#f4f5ef]"
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
            className="min-h-11 w-full min-w-0 rounded-xl border border-[#bdcfc2] bg-white px-2 py-2 text-base font-normal text-[#173b32] read-only:bg-[#f4f5ef]"
          />
        </label>
      </div>

      {enlaceGoogleMaps && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#3b5449]">
          <span>
            Punto fijado: {latitud}, {longitud}
          </span>
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
