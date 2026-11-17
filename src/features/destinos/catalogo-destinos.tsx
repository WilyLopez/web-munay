"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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

export function CatalogoDestinos({
  destinos,
  tieneSesion,
}: {
  destinos: Destino[];
  tieneSesion: boolean;
}) {
  const parametros = useSearchParams();

  // Estados locales independientes para respuesta de interacción instantánea (0ms)
  const [esVistaMapa, setEsVistaMapa] = useState(
    parametros.get("vista") === "mapa",
  );
  const [destinoSeleccionadoId, setDestinoSeleccionadoId] = useState(
    parametros.get("destino") ?? "",
  );
  const [busqueda, setBusqueda] = useState(parametros.get("buscar") ?? "");
  const [categoria, setCategoria] = useState(
    Object.hasOwn(categorias, parametros.get("categoria") ?? "")
      ? (parametros.get("categoria") as string)
      : "TODOS",
  );
  const [provincia, setProvincia] = useState(
    Object.hasOwn(provincias, parametros.get("provincia") ?? "")
      ? (parametros.get("provincia") as string)
      : "",
  );
  const [calificacion, setCalificacion] = useState(
    calificaciones.includes(parametros.get("calificacion") ?? "")
      ? (parametros.get("calificacion") as string)
      : "",
  );
  const [orden, setOrden] = useState(
    parametros.get("orden") === "nombre" ? "nombre" : "recomendados",
  );

  const [, iniciarTransicion] = useTransition();

  // useDeferredValue asegura que el tipeo en el campo de búsqueda se mantenga a 60/120fps sin trabas
  const busquedaDiferida = useDeferredValue(busqueda);
  const consulta = normalizarBusqueda(busquedaDiferida.trim());

  const queryActual = parametros.toString();
  const [queryPrevia, setQueryPrevia] = useState(queryActual);

  // Sincronizar durante render si los parámetros de la URL cambian externamente (ej. navegación del navegador)
  if (queryActual !== queryPrevia) {
    setQueryPrevia(queryActual);
    setEsVistaMapa(parametros.get("vista") === "mapa");
    setDestinoSeleccionadoId(parametros.get("destino") ?? "");
    setBusqueda(parametros.get("buscar") ?? "");
    const cUrl = parametros.get("categoria") ?? "";
    setCategoria(Object.hasOwn(categorias, cUrl) ? cUrl : "TODOS");
    const pUrl = parametros.get("provincia") ?? "";
    setProvincia(Object.hasOwn(provincias, pUrl) ? pUrl : "");
    const calUrl = parametros.get("calificacion") ?? "";
    setCalificacion(calificaciones.includes(calUrl) ? calUrl : "");
    const oUrl = parametros.get("orden") ?? "recomendados";
    setOrden(oUrl === "nombre" ? "nombre" : "recomendados");
  }

  const minima = calificacion ? Number(calificacion) : null;
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

  const actualizarUrlRef = useRef<NodeJS.Timeout>(null);
  const actualizarUrl = useCallback(
    (nuevos: {
      vista?: boolean;
      buscar?: string;
      categoria?: string;
      provincia?: string;
      calificacion?: string;
      orden?: string;
      destino?: string;
    }) => {
      const vMapa = nuevos.vista !== undefined ? nuevos.vista : esVistaMapa;
      const b = nuevos.buscar !== undefined ? nuevos.buscar : busqueda;
      const c = nuevos.categoria !== undefined ? nuevos.categoria : categoria;
      const p = nuevos.provincia !== undefined ? nuevos.provincia : provincia;
      const cal =
        nuevos.calificacion !== undefined ? nuevos.calificacion : calificacion;
      const o = nuevos.orden !== undefined ? nuevos.orden : orden;
      const d =
        nuevos.destino !== undefined ? nuevos.destino : destinoSeleccionadoId;

      const q = new URLSearchParams();
      if (vMapa) q.set("vista", "mapa");
      if (b.trim()) q.set("buscar", b.trim());
      if (c !== "TODOS") q.set("categoria", c);
      if (p) q.set("provincia", p);
      if (cal) q.set("calificacion", cal);
      if (o === "nombre") q.set("orden", o);
      if (d) q.set("destino", d);

      window.history.replaceState(null, "", rutaCatalogo(q));
    },
    [
      esVistaMapa,
      busqueda,
      categoria,
      provincia,
      calificacion,
      orden,
      destinoSeleccionadoId,
    ],
  );

  // Debounced URL sync para el campo de búsqueda
  useEffect(() => {
    if (actualizarUrlRef.current) clearTimeout(actualizarUrlRef.current);
    actualizarUrlRef.current = setTimeout(() => {
      actualizarUrl({ buscar: busqueda });
    }, 250);
    return () => {
      if (actualizarUrlRef.current) clearTimeout(actualizarUrlRef.current);
    };
  }, [busqueda, actualizarUrl]);

  function alternarVista(mapa: boolean) {
    iniciarTransicion(() => {
      setEsVistaMapa(mapa);
    });
    actualizarUrl({ vista: mapa });
  }

  function cambiarCategoria(nueva: string) {
    iniciarTransicion(() => {
      setCategoria(nueva);
      setDestinoSeleccionadoId("");
    });
    actualizarUrl({ categoria: nueva, destino: "" });
  }

  function cambiarProvincia(nueva: string) {
    iniciarTransicion(() => {
      setProvincia(nueva);
      setDestinoSeleccionadoId("");
    });
    actualizarUrl({ provincia: nueva, destino: "" });
  }

  function cambiarCalificacion(nueva: string) {
    iniciarTransicion(() => {
      setCalificacion(nueva);
      setDestinoSeleccionadoId("");
    });
    actualizarUrl({ calificacion: nueva, destino: "" });
  }

  function cambiarOrden(nuevo: string) {
    iniciarTransicion(() => {
      setOrden(nuevo);
    });
    actualizarUrl({ orden: nuevo });
  }

  const seleccionar = useCallback(
    (id: string) => {
      setDestinoSeleccionadoId(id);
      actualizarUrl({ destino: id });
    },
    [actualizarUrl],
  );

  function limpiarFiltros() {
    iniciarTransicion(() => {
      setBusqueda("");
      setCategoria("TODOS");
      setProvincia("");
      setCalificacion("");
      setOrden("recomendados");
      setDestinoSeleccionadoId("");
    });
    window.history.replaceState(
      null,
      "",
      esVistaMapa ? "/destinos?vista=mapa" : "/destinos",
    );
  }

  const seleccionado =
    resultados.find(({ id }) => id === destinoSeleccionadoId) ??
    (consulta && resultados.length === 1 ? resultados[0] : undefined);

  const filtrosAvanzados =
    Number(Boolean(provincia)) + Number(Boolean(calificacion));
  const campo =
    "min-h-12 w-full min-w-0 rounded-lg border border-[#b9c4b9] bg-white px-3 text-base font-normal text-[#193b33] focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm";
  const pestana =
    "inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=page]:bg-[#174238] aria-[current=page]:text-white cursor-pointer";

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
              onChange={(evento) => setBusqueda(evento.target.value)}
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
              onClick={(evento) => {
                evento.preventDefault();
                alternarVista(false);
              }}
              aria-current={!esVistaMapa ? "page" : undefined}
              className={pestana}
            >
              Lista
            </Link>
            <Link
              href={enlace(true)}
              scroll={false}
              onClick={(evento) => {
                evento.preventDefault();
                alternarVista(true);
              }}
              aria-current={esVistaMapa ? "page" : undefined}
              className={pestana}
            >
              Mapa
            </Link>
          </nav>
        </div>

        <div
          className="flex overflow-x-auto pb-1 gap-2 no-scrollbar -mx-1 px-1 sm:flex-wrap"
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
              onClick={() => cambiarCategoria(opcion)}
              className="shrink-0 whitespace-nowrap min-h-12 rounded-full border border-[#b9c4b9] px-4.5 text-sm font-semibold hover:bg-[#e8eee6] focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-[#174238] aria-pressed:bg-[#174238] aria-pressed:text-white active:scale-95 transition-all cursor-pointer"
            >
              {opcion === "TODOS" ? "Todos" : categorias[opcion]}
            </button>
          ))}
        </div>

        <details className="group rounded-xl border border-[#dedacf] bg-[#fffdf6] px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
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
                onChange={(evento) => cambiarProvincia(evento.target.value)}
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
                onChange={(evento) => cambiarCalificacion(evento.target.value)}
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
                onChange={(evento) => cambiarOrden(evento.target.value)}
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
            className="min-h-11 rounded-sm text-sm font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {esVistaMapa ? (
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
