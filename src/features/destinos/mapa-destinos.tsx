"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { obtenerUbicacion } from "@/features/visitas/ubicacion-visita";
import { categorias, enlaceFicha, type Destino } from "./catalogo";
import { CreditoFoto } from "./credito-foto";
import { MapaGoogle } from "./mapa-google";

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const kilometros = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

function distanciaEnLineaRecta(
  origen: google.maps.LatLngLiteral,
  destino: Destino,
) {
  const radianes = Math.PI / 180;
  const latitud = (destino.latitud - origen.lat) * radianes;
  const longitud = (destino.longitud - origen.lng) * radianes;
  const a =
    Math.sin(latitud / 2) ** 2 +
    Math.cos(origen.lat * radianes) *
      Math.cos(destino.latitud * radianes) *
      Math.sin(longitud / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function MapaDestinos({
  destinos,
  seleccionado,
  seleccionar,
  volver,
  volverFicha,
  limpiarFiltros,
}: {
  destinos: Destino[];
  seleccionado?: Destino;
  seleccionar: (id: string) => void;
  volver: string;
  volverFicha: string;
  limpiarFiltros: () => void;
}) {
  const [ubicacion, cambiarUbicacion] = useState<google.maps.LatLngLiteral>();
  const [avisoUbicacion, cambiarAviso] = useState("");
  const [buscandoUbicacion, cambiarBusquedaUbicacion] = useState(false);
  const [imagenFallida, cambiarImagenFallida] = useState<string>();

  async function mostrarPosicion() {
    cambiarBusquedaUbicacion(true);
    cambiarAviso("Buscando tu ubicación…");
    try {
      const { latitud, longitud } = await obtenerUbicacion();
      cambiarUbicacion({ lat: latitud, lng: longitud });
      cambiarAviso("Ubicación encontrada.");
    } catch (error) {
      cambiarAviso(
        error instanceof Error
          ? error.message
          : "No pudimos obtener tu ubicación.",
      );
    } finally {
      cambiarBusquedaUbicacion(false);
    }
  }

  const distancia =
    ubicacion && seleccionado
      ? distanciaEnLineaRecta(ubicacion, seleccionado)
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
            disabled={buscandoUbicacion}
            onClick={mostrarPosicion}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-teal-900 bg-white px-4 text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            Mi posición
          </button>
          <button
            type="button"
            onClick={() => {
              cambiarUbicacion(undefined);
              cambiarAviso("");
              limpiarFiltros();
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-teal-900 bg-white px-4 text-sm font-semibold active:scale-95 transition-transform"
          >
            Ver todos
          </button>
          <Link
            href={volver}
            className="inline-flex min-h-12 items-center px-3.5 text-sm font-semibold text-teal-800 underline underline-offset-4"
          >
            Volver al catálogo
          </Link>
        </div>
        {avisoUbicacion && (
          <p role="status" className="text-sm text-stone-700">
            {avisoUbicacion}
          </p>
        )}
        <MapaGoogle
          destinos={destinos}
          seleccionado={seleccionado}
          seleccionar={seleccionar}
          ubicacion={ubicacion}
          volver={volver}
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
                href={enlaceFicha(seleccionado.slug, volverFicha)}
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
                <span className="sr-only"> (abre en otra pestaña)</span>
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
