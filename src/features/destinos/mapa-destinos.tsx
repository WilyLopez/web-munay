"use client";

import type * as Leaflet from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { enlaceFicha } from "./catalogo";
import { useEffect, useRef, useState } from "react";
import { categorias, type Destino } from "./catalogo";
import { CreditoFoto } from "./credito-foto";
import "leaflet/dist/leaflet.css";

const centroLambayeque: Leaflet.LatLngTuple = [-6.53, -79.83];
const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const kilometros = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

type MotorMapa = { mapa: Leaflet.Map; biblioteca: typeof Leaflet };

function coordenadas(destino: Destino): Leaflet.LatLngTuple {
  return [destino.latitud, destino.longitud];
}

function encuadrar({ mapa }: MotorMapa, destinos: Destino[]) {
  if (destinos.length === 0) {
    mapa.setView(centroLambayeque, 10);
  } else {
    mapa.fitBounds(destinos.map(coordenadas), {
      padding: [28, 28],
      maxZoom: 13,
    });
  }
}

export function MapaDestinos({
  destinos,
  seleccionado,
  seleccionar,
  volver,
  limpiarFiltros,
}: {
  destinos: Destino[];
  seleccionado?: Destino;
  seleccionar: (id: string) => void;
  volver: string;
  limpiarFiltros: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const marcadores = useRef(new Map<string, Leaflet.Marker>());
  const [motor, cambiarMotor] = useState<MotorMapa | null>(null);
  const [mapaNoDisponible, cambiarDisponibilidad] = useState(false);
  const [ubicacion, cambiarUbicacion] = useState<Leaflet.LatLngTuple>();
  const [avisoUbicacion, cambiarAviso] = useState("");
  const [imagenFallida, cambiarImagenFallida] = useState<string>();

  useEffect(() => {
    let desmontado = false;
    let mapa: Leaflet.Map | undefined;
    let observador: ResizeObserver | undefined;

    async function iniciar() {
      const modulo = await import("leaflet");
      const biblioteca = modulo.default ?? modulo;
      await import("leaflet.markercluster");

      if (desmontado || !contenedor.current) return;

      mapa = biblioteca
        .map(contenedor.current, { scrollWheelZoom: false })
        .setView(centroLambayeque, 10);
      let teselasCargadas = 0;
      const teselas = biblioteca.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      );
      teselas.on("loading", () => {
        teselasCargadas = 0;
      });
      teselas.on("tileload", () => {
        teselasCargadas++;
      });
      teselas.on("load", () => cambiarDisponibilidad(teselasCargadas === 0));
      teselas.addTo(mapa);

      observador = new ResizeObserver(() => mapa?.invalidateSize());
      observador.observe(contenedor.current);
      cambiarMotor({ mapa, biblioteca });
    }

    void iniciar().catch(() => {
      if (!desmontado) cambiarDisponibilidad(true);
    });

    return () => {
      desmontado = true;
      observador?.disconnect();
      mapa?.remove();
    };
  }, []);

  useEffect(() => {
    if (!motor) return;

    const { mapa, biblioteca } = motor;
    const grupo = biblioteca.markerClusterGroup({
      showCoverageOnHover: false,
      iconCreateFunction: (agrupacion) =>
        biblioteca.divIcon({
          className: "",
          html: `<span class="flex size-9 items-center justify-center rounded-full border-2 border-white bg-teal-900 text-sm font-bold text-white shadow">${agrupacion.getChildCount()}</span>`,
          iconSize: [36, 36],
        }),
    });
    const icono = biblioteca.divIcon({
      className: "",
      html: '<span class="block size-5 rounded-full border-2 border-white bg-teal-700 shadow"></span>',
      iconSize: [20, 20],
    });

    for (const destino of destinos) {
      const marcador = biblioteca
        .marker(coordenadas(destino), {
          icon: icono,
          title: destino.nombre,
        })
        .on("click", () => seleccionar(destino.id));
      marcadores.current.set(destino.id, marcador);
      grupo.addLayer(marcador);
    }

    grupo.addTo(mapa);
    const actuales = marcadores.current;
    return () => {
      mapa.removeLayer(grupo);
      actuales.clear();
    };
  }, [motor, destinos, seleccionar]);

  useEffect(() => {
    if (!motor) return;

    if (seleccionado) {
      motor.mapa.setView(coordenadas(seleccionado), 15);
      const marcador = marcadores.current.get(seleccionado.id);
      const icono = motor.biblioteca.divIcon({
        className: "",
        html: '<span class="block size-6 rounded-full border-2 border-white bg-orange-600 shadow"></span>',
        iconSize: [24, 24],
      });
      const anterior = marcador?.getIcon();
      marcador?.setIcon(icono);
      return () => {
        if (anterior) marcador?.setIcon(anterior);
      };
    }

    encuadrar(motor, destinos);
  }, [motor, destinos, seleccionado, seleccionar]);

  useEffect(() => {
    if (!motor || !ubicacion) return;

    const punto = motor.biblioteca
      .circleMarker(ubicacion, {
        color: "white",
        fillColor: "#2563eb",
        fillOpacity: 1,
        weight: 2,
        radius: 8,
      })
      .bindTooltip("Mi posición")
      .addTo(motor.mapa);

    return () => {
      punto.remove();
    };
  }, [motor, ubicacion]);

  function mostrarPosicion() {
    if (!motor || !navigator.geolocation) {
      cambiarAviso("Tu navegador no puede obtener la ubicación.");
      return;
    }

    cambiarAviso("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!contenedor.current) return;
        const punto: Leaflet.LatLngTuple = [coords.latitude, coords.longitude];
        cambiarUbicacion(punto);
        motor.mapa.setView(punto, 14);
        cambiarAviso("");
      },
      ({ code }) =>
        cambiarAviso(
          code === 1
            ? "Permite el acceso a tu ubicación para ver tu posición."
            : "No pudimos obtener tu ubicación. Puedes seguir usando el mapa.",
        ),
      { timeout: 10000 },
    );
  }

  const distancia =
    motor && ubicacion && seleccionado
      ? motor.mapa.distance(ubicacion, coordenadas(seleccionado)) / 1000
      : null;

  return (
    <section
      aria-label="Mapa y destinos"
      className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!motor}
            onClick={mostrarPosicion}
            className="rounded-lg border border-teal-900 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Mi posición
          </button>
          <button
            type="button"
            disabled={!motor}
            onClick={() => {
              if (motor) encuadrar(motor, destinos);
              limpiarFiltros();
            }}
            className="rounded-lg border border-teal-900 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Ver todos
          </button>
          <Link
            href={volver}
            className="px-3 py-2 text-sm font-semibold text-teal-800 underline"
          >
            Volver al catálogo
          </Link>
        </div>
        {avisoUbicacion && (
          <p role="status" className="text-sm text-stone-700">
            {avisoUbicacion}
          </p>
        )}
        {mapaNoDisponible && (
          <p
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
          >
            No pudimos cargar el mapa. Revisa tu conexión o{" "}
            <Link href={volver} className="font-semibold underline">
              consulta la lista de destinos
            </Link>
            .
          </p>
        )}
        {!motor && !mapaNoDisponible && (
          <p role="status" className="text-sm">
            Cargando mapa…
          </p>
        )}
        <div
          ref={contenedor}
          role="region"
          aria-label="Mapa interactivo de Lambayeque"
          className="relative z-0 h-[24rem] overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 sm:h-[32rem]"
        />
      </div>
      <div className="space-y-4">
        {seleccionado && (
          <article
            aria-label="Atractivo seleccionado"
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
          >
            {seleccionado.imagenUrl &&
              seleccionado.imagenUrl !== imagenFallida && (
                <div className="relative aspect-[16/9] bg-stone-100">
                  <Image
                    src={seleccionado.imagenUrl}
                    alt={seleccionado.nombre}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                    onError={() =>
                      cambiarImagenFallida(seleccionado.imagenUrl ?? undefined)
                    }
                  />
                </div>
              )}
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-teal-800">
                {categorias[seleccionado.categoria]}
              </p>
              <h2 className="text-xl font-bold">{seleccionado.nombre}</h2>
              <p className="text-sm text-stone-700">{seleccionado.ubicacion}</p>
              <p className="text-sm text-stone-700">
                {seleccionado.calificacionPromedio === null
                  ? "Sin calificaciones"
                  : `${seleccionado.calificacionPromedio} de 5`}
              </p>
              <p className="text-sm text-stone-700">
                {seleccionado.descripcion}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {distancia !== null && (
                  <>
                    <dt className="font-medium">Distancia en línea recta</dt>
                    <dd>{kilometros.format(distancia)} km</dd>
                  </>
                )}
                <dt className="font-medium">Horario</dt>
                <dd>{seleccionado.horario ?? "Por confirmar"}</dd>
                <dt className="font-medium">Tarifa general</dt>
                <dd>
                  {seleccionado.tarifaGeneral == null
                    ? "Por confirmar"
                    : soles.format(seleccionado.tarifaGeneral)}
                </dd>
                <dt className="font-medium">Tarifa estudiantes</dt>
                <dd>
                  {seleccionado.tarifaEstudiantes == null
                    ? "Por confirmar"
                    : soles.format(seleccionado.tarifaEstudiantes)}
                </dd>
              </dl>
              <Link
                href={enlaceFicha(seleccionado.slug, volver)}
                className="block font-semibold text-teal-900 underline"
              >
                Ficha completa
              </Link>
              <Link
                href={`/verificar-visita?destino=${encodeURIComponent(seleccionado.slug)}`}
                className="block font-semibold text-teal-900 underline"
              >
                Verificar visita
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${seleccionado.latitud}%2C${seleccionado.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block pt-1 text-sm font-semibold text-teal-800 underline"
              >
                Abrir en Google Maps
              </a>
              {seleccionado.imagenUrl !== imagenFallida && (
                <CreditoFoto imagenUrl={seleccionado.imagenUrl} />
              )}
            </div>
          </article>
        )}
        {destinos.length ? (
          <ul
            aria-label="Destinos del mapa"
            className="max-h-72 space-y-2 overflow-y-auto"
          >
            {destinos.map((destino) => (
              <li key={destino.id}>
                <button
                  type="button"
                  aria-pressed={destino.id === seleccionado?.id}
                  onClick={() => seleccionar(destino.id)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left aria-pressed:border-teal-800 aria-pressed:bg-teal-50"
                >
                  <span className="block text-sm font-semibold">
                    {destino.nombre}
                  </span>
                  <span className="block text-xs text-stone-600">
                    {destino.ubicacion}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            No se encontraron destinos.
          </p>
        )}
      </div>
    </section>
  );
}
