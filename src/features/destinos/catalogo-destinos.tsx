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
    consulta ||
    categoria !== "TODOS" ||
    provincia ||
    calificacion ||
    orden === "nombre",
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

  const filtrosAvanzados =
    Number(Boolean(provincia)) + Number(Boolean(calificacion));
  const campo =
    "min-h-11 w-full min-w-0 rounded-lg border border-[#b9c4b9] bg-white px-3 text-base font-normal text-[#193b33] focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm";
  const pestana =
    "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=page]:bg-[#174238] aria-[current=page]:text-white";

  return (
    <section
      aria-label="Catálogo de destinos"
      className="space-y-5 py-5 sm:py-7"
    >
      <div className="space-y-4">
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label
            className="grid min-w-0 gap-1.5 text-sm font-semibold"
            htmlFor="buscar-destinos"
          >
            Buscar destinos
            <input
              id="buscar-destinos"
              name="buscar"
              type="search"
              autoComplete="off"
              value={busqueda}
              onChange={(evento) =>
                aplicarFiltro("buscar", evento.target.value)
              }
              placeholder="Nombre o ubicación…"
              className={campo}
            />
          </label>
          <nav
            aria-label="Vista de destinos"
            className="grid grid-cols-2 gap-1 rounded-xl border border-[#dedacf] bg-[#eee9dc] p-1"
          >
            <Link
              href={enlace(false)}
              scroll={false}
              prefetch={false}
              aria-current={!vistaMapa ? "page" : undefined}
              className={pestana}
            >
              Lista
            </Link>
            <Link
              href={enlace(true)}
              scroll={false}
              prefetch={false}
              aria-current={vistaMapa ? "page" : undefined}
              className={pestana}
            >
              Mapa
            </Link>
          </nav>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Tipo de experiencia"
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
              className="min-h-11 rounded-full border border-[#b9c4b9] px-4 text-sm font-semibold hover:bg-[#e8eee6] focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-[#174238] aria-pressed:bg-[#174238] aria-pressed:text-white"
            >
              {opcion === "TODOS" ? "Todos" : categorias[opcion]}
            </button>
          ))}
        </div>

        <details className="group rounded-xl border border-[#dedacf] bg-[#fffdf6] px-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
            <span>
              Más filtros{filtrosAvanzados > 0 ? ` (${filtrosAvanzados})` : ""}
            </span>
            <span aria-hidden="true" className="group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="grid gap-3 border-t border-[#dedacf] py-4 sm:grid-cols-3">
            <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
              Provincia
              <select
                name="provincia"
                value={provincia}
                onChange={(evento) =>
                  aplicarFiltro("provincia", evento.target.value)
                }
                className={campo}
              >
                <option value="">Todas las provincias</option>
                {Object.entries(provincias).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
              Calificación mínima
              <select
                name="calificacion"
                value={calificacion}
                onChange={(evento) =>
                  aplicarFiltro("calificacion", evento.target.value)
                }
                className={campo}
              >
                <option value="">Cualquier calificación</option>
                {calificaciones.map((valor) => (
                  <option key={valor} value={valor}>
                    {formatoCalificacion.format(Number(valor))} de 5 o más
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
              Ordenar por
              <select
                name="orden"
                value={orden}
                onChange={(evento) =>
                  aplicarFiltro(
                    "orden",
                    evento.target.value === "nombre" ? "nombre" : "",
                  )
                }
                className={campo}
              >
                <option value="recomendados">Recomendados</option>
                <option value="nombre">Nombre (A–Z)</option>
              </select>
            </label>
          </div>
        </details>
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
            className="min-h-11 rounded-sm text-sm font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
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
              ? "Cambia la búsqueda o ajusta los filtros para ver más lugares."
              : "Todavía no hay destinos publicados."}
          </p>
        </div>
      )}
    </section>
  );
}
