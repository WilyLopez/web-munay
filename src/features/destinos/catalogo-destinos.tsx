"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  categorias,
  provincias,
  type Categoria,
  type Destino,
} from "./catalogo";
import { MapaDestinos } from "./mapa-destinos";
import { TarjetaDestino } from "./tarjeta-destino";

const comparador = new Intl.Collator("es-PE", { sensitivity: "base" });

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
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
  const categoriaInicial = parametros.get("categoria");
  const provinciaInicial = parametros.get("provincia");
  const [busqueda, cambiarBusqueda] = useState(parametros.get("buscar") ?? "");
  const [categoria, cambiarCategoria] = useState<Categoria | "TODOS">(
    categoriaInicial && Object.hasOwn(categorias, categoriaInicial)
      ? (categoriaInicial as Categoria)
      : "TODOS",
  );
  const [provincia, cambiarProvincia] = useState(
    provinciaInicial && Object.hasOwn(provincias, provinciaInicial)
      ? provinciaInicial
      : "",
  );
  const [orden, cambiarOrden] = useState(
    parametros.get("orden") === "nombre" ? "nombre" : "recomendados",
  );
  const consulta = normalizar(busqueda.trim());
  const resultados = useMemo(
    () =>
      destinos
        .filter(
          (destino) =>
            (categoria === "TODOS" || destino.categoria === categoria) &&
            (!provincia || destino.provincia === provincia) &&
            (!consulta ||
              [destino.nombre, destino.ubicacion].some((texto) =>
                normalizar(texto).includes(consulta),
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
    [destinos, categoria, provincia, consulta, orden],
  );

  const enlace = useCallback(
    (mapa: boolean, id?: string) => {
      const consultaUrl = new URLSearchParams();
      if (mapa) consultaUrl.set("vista", "mapa");
      if (busqueda.trim()) consultaUrl.set("buscar", busqueda.trim());
      if (categoria !== "TODOS") consultaUrl.set("categoria", categoria);
      if (provincia) consultaUrl.set("provincia", provincia);
      if (orden === "nombre") consultaUrl.set("orden", orden);
      if (id) consultaUrl.set("destino", id);
      return consultaUrl.size ? `/destinos?${consultaUrl}` : "/destinos";
    },
    [busqueda, categoria, provincia, orden],
  );
  const seleccionar = useCallback(
    (id: string) => {
      window.history.replaceState(null, "", enlace(true, id));
    },
    [enlace],
  );

  function limpiarFiltros() {
    cambiarBusqueda("");
    cambiarCategoria("TODOS");
    cambiarProvincia("");
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
              onChange={(evento) => cambiarBusqueda(evento.target.value)}
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
              onChange={(evento) => cambiarOrden(evento.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal"
            >
              <option value="recomendados">Recomendados</option>
              <option value="nombre">Nombre (A–Z)</option>
            </select>
          </label>
        </div>
        <label
          className="grid max-w-60 gap-2 text-sm font-semibold"
          htmlFor="provincia-destinos"
        >
          Provincia
          <select
            id="provincia-destinos"
            value={provincia}
            onChange={(evento) => cambiarProvincia(evento.target.value)}
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
              onClick={() => cambiarCategoria(opcion)}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium aria-pressed:border-teal-900 aria-pressed:bg-teal-900 aria-pressed:text-white"
            >
              {opcion === "TODOS" ? "Todos" : categorias[opcion]}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className="text-sm font-medium text-stone-700">
        Catálogo cargado ·{" "}
        {resultados.length === 1
          ? "1 destino encontrado"
          : `${resultados.length} destinos encontrados`}
      </p>
      {vistaMapa ? (
        <MapaDestinos
          destinos={resultados}
          seleccionado={seleccionado}
          seleccionar={seleccionar}
          volver={enlace(false)}
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
          {busqueda || categoria !== "TODOS" || provincia ? (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-3 font-semibold text-teal-800 underline"
            >
              Limpiar filtros
            </button>
          ) : (
            <p className="mt-2 text-sm text-stone-600">
              Todavía no hay destinos publicados.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
