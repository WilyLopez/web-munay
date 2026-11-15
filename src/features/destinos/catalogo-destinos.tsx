"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  categorias,
  normalizarBusqueda,
  provincias,
  type Categoria,
  type Destino,
} from "./catalogo";
import { TarjetaDestino } from "./tarjeta-destino";

const MapaDestinos = dynamic(
  () => import("./mapa-destinos").then((m) => m.MapaDestinos),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30rem] items-center justify-center rounded-2xl border border-stone-200 bg-white">
        <p className="text-sm font-semibold text-stone-500">
          Cargando mapa interactivo…
        </p>
      </div>
    ),
  },
);

const comparador = new Intl.Collator("es-PE", { sensitivity: "base" });
const calificaciones = ["1", "2", "3", "3.5", "4", "4.5", "5"];
const formatoCalificacion = new Intl.NumberFormat("es-PE");

function rutaCatalogo(consulta: URLSearchParams) {
  return consulta.size ? `/destinos?${consulta}` : "/destinos";
}

function aplicarFiltro(campo: string, valor: string) {
  const consulta = new URLSearchParams(window.location.search);
  if (valor) consulta.set(campo, valor);
  else consulta.delete(campo);
  consulta.delete("destino");
  window.history.replaceState(null, "", rutaCatalogo(consulta));
}

export function CatalogoDestinos({
  destinos,
  tieneSesion,
}: {
  destinos: Destino[];
  tieneSesion: boolean;
}) {
  const parametros = useSearchParams();
  const vistaMapa = parametros.get("vista") === "mapa";
  const destinoId = parametros.get("destino");
  const busqueda = parametros.get("buscar") ?? "";
  const categoriaUrl = parametros.get("categoria") ?? "";
  const provinciaUrl = parametros.get("provincia") ?? "";
  const calificacionUrl = parametros.get("calificacion") ?? "";
  const categoria = Object.hasOwn(categorias, categoriaUrl)
    ? categoriaUrl
    : "TODOS";
  const provincia = Object.hasOwn(provincias, provinciaUrl) ? provinciaUrl : "";
  const calificacion = calificaciones.includes(calificacionUrl)
    ? calificacionUrl
    : "";
  const minima = calificacion ? Number(calificacion) : null;
  const orden =
    parametros.get("orden") === "nombre" ? "nombre" : "recomendados";
  const consulta = normalizarBusqueda(busqueda.trim());
  const tieneFiltros = Boolean(
    consulta || categoria !== "TODOS" || provincia || calificacion,
  );
  const resultados = useMemo(
    () =>
      destinos
        .filter(
          (destino) =>
            (categoria === "TODOS" || destino.categoria === categoria) &&
            (!provincia || destino.provincia === provincia) &&
            (minima === null ||
              (destino.calificacionPromedio !== null &&
                destino.calificacionPromedio >= minima)) &&
            (!consulta ||
              [destino.nombre, destino.ubicacion].some((texto) =>
                normalizarBusqueda(texto).includes(consulta),
              )),
        )
        .sort((primero, segundo) => {
          const porNombre = comparador.compare(primero.nombre, segundo.nombre);

          if (orden === "nombre") return porNombre;

          const porCalificacion =
            (segundo.calificacionPromedio ?? 0) -
            (primero.calificacionPromedio ?? 0);
          return (
            Number(segundo.verificado) - Number(primero.verificado) ||
            porCalificacion ||
            porNombre
          );
        }),
    [destinos, categoria, provincia, minima, consulta, orden],
  );

  const enlace = useCallback(
    (mapa: boolean, id?: string) => {
      const consultaUrl = new URLSearchParams();
      if (mapa) consultaUrl.set("vista", "mapa");
      if (busqueda.trim()) consultaUrl.set("buscar", busqueda.trim());
      if (categoria !== "TODOS") consultaUrl.set("categoria", categoria);
      if (provincia) consultaUrl.set("provincia", provincia);
      if (calificacion) consultaUrl.set("calificacion", calificacion);
      if (orden === "nombre") consultaUrl.set("orden", orden);
      if (id) consultaUrl.set("destino", id);
      return rutaCatalogo(consultaUrl);
    },
    [busqueda, categoria, provincia, calificacion, orden],
  );
  const seleccionar = useCallback(
    (id: string) => {
      window.history.replaceState(null, "", enlace(true, id));
    },
    [enlace],
  );

  function limpiarFiltros() {
    window.history.replaceState(
      null,
      "",
      vistaMapa ? "/destinos?vista=mapa" : "/destinos",
    );
  }

  const seleccionado =
    resultados.find(({ id }) => id === destinoId) ??
    (consulta && resultados.length === 1 ? resultados[0] : undefined);

  return (
    <section aria-label="Catálogo de destinos" className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <nav
          aria-label="Vista de destinos"
          className="flex flex-wrap gap-3 text-sm font-semibold"
        >
          <Link
            href={enlace(false)}
            scroll={false}
            aria-current={!vistaMapa ? "page" : undefined}
            className="rounded-lg border border-teal-900 px-3 py-2 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white"
          >
            Lista
          </Link>
          <Link
            href={enlace(true)}
            scroll={false}
            aria-current={vistaMapa ? "page" : undefined}
            className="rounded-lg border border-teal-900 px-3 py-2 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white"
          >
            Mapa
          </Link>
        </nav>
        <div className="grid gap-4 sm:grid-cols-[1fr_13rem]">
          <label
            className="grid gap-2 text-sm font-semibold"
            htmlFor="buscar-destinos"
          >
            Buscar destinos
            <input
              id="buscar-destinos"
              type="search"
              value={busqueda}
              onChange={(evento) =>
                aplicarFiltro("buscar", evento.target.value)
              }
              placeholder="Nombre o ubicación"
              className="min-w-0 rounded-xl border border-stone-300 px-4 py-3 font-normal"
            />
          </label>
          <label
            className="grid gap-2 text-sm font-semibold"
            htmlFor="orden-destinos"
          >
            Ordenar por
            <select
              id="orden-destinos"
              value={orden}
              onChange={(evento) =>
                aplicarFiltro(
                  "orden",
                  evento.target.value === "nombre" ? "nombre" : "",
                )
              }
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal"
            >
              <option value="recomendados">Recomendados</option>
              <option value="nombre">Nombre (A–Z)</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label
            className="grid gap-2 text-sm font-semibold"
            htmlFor="provincia-destinos"
          >
            Provincia
            <select
              id="provincia-destinos"
              value={provincia}
              onChange={(evento) =>
                aplicarFiltro("provincia", evento.target.value)
              }
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 font-normal"
            >
              <option value="">Todas las provincias</option>
              {Object.entries(provincias).map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <label
            className="grid gap-2 text-sm font-semibold"
            htmlFor="calificacion-destinos"
          >
            Calificación mínima
            <select
              id="calificacion-destinos"
              value={calificacion}
              onChange={(evento) =>
                aplicarFiltro("calificacion", evento.target.value)
              }
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 font-normal"
            >
              <option value="">Cualquier calificación</option>
              {calificaciones.map((valor) => (
                <option key={valor} value={valor}>
                  {formatoCalificacion.format(Number(valor))} de 5 o más
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          role="group"
          aria-label="Tipo de experiencia"
          className="flex flex-wrap gap-2"
        >
          {(
            ["TODOS", ...Object.keys(categorias)] as (Categoria | "TODOS")[]
          ).map((opcion) => (
            <button
              key={opcion}
              type="button"
              aria-pressed={categoria === opcion}
              onClick={() =>
                aplicarFiltro("categoria", opcion === "TODOS" ? "" : opcion)
              }
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium aria-pressed:border-teal-900 aria-pressed:bg-teal-900 aria-pressed:text-white"
            >
              {opcion === "TODOS" ? "Todos" : categorias[opcion]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-medium text-stone-700">
          {resultados.length === 1
            ? "1 destino encontrado"
            : `${resultados.length} destinos encontrados`}
        </p>
        {tieneFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-sm font-semibold text-teal-800 underline underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {vistaMapa ? (
        <MapaDestinos
          destinos={resultados}
          seleccionado={seleccionado}
          seleccionar={seleccionar}
          volver={enlace(false)}
          volverFicha={enlace(true, seleccionado?.id)}
          limpiarFiltros={limpiarFiltros}
        />
      ) : resultados.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((destino) => (
            <TarjetaDestino
              key={destino.id}
              destino={destino}
              tieneSesion={tieneSesion}
              enlaceMapa={enlace(true, destino.id)}
              volver={enlace(false)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold">No se encontraron destinos</h2>
          <p className="mt-2 text-sm text-stone-600">
            {tieneFiltros
              ? "Prueba con una calificación menor o cambia los filtros."
              : "Todavía no hay destinos publicados."}
          </p>
        </div>
      )}
    </section>
  );
}
