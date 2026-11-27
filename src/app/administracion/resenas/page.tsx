import {
  OpinionResumen,
  DetalleOpinion,
} from "@/features/administracion/opinion-encargado";
import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import type { ListadoResenas } from "@/features/resenas/tipos";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import type { DestinoVisita } from "@/features/visitas/tipos";

type Consulta = {
  destino?: string;
  pagina?: string;
  orden?: string;
  estrellas?: string;
  desde?: string;
  hasta?: string;
  foto?: string;
  respuesta?: string;
  resena?: string;
};

const ruta = "/administracion/resenas";
const numero = new Intl.NumberFormat("es-PE");
const decimal = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function TarjetasKpiCompactas({
  datos,
  slugDestino,
}: {
  datos: ListadoResenas;
  slugDestino: string;
}) {
  const porcentajeVerificadas =
    datos.total > 0 ? Math.round((datos.verificadas / datos.total) * 100) : 0;

  const calificacionTexto =
    datos.promedio === null
      ? "Sin opiniones"
      : datos.promedio >= 4.5
        ? "Excelente reputación"
        : datos.promedio >= 3.5
          ? "Buena valoración"
          : "Requiere atención";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center justify-between rounded-xl border border-[#d5e0d6] bg-white p-3.5 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526a60]">
            Calificación
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#14382e]">
              {datos.promedio === null ? "—" : decimal.format(datos.promedio)}
            </span>
            <span className="text-xs text-amber-500 font-bold">★</span>
            <span className="text-[11px] text-[#526a60]">/ 5</span>
          </div>
        </div>
        <span className="rounded-lg bg-[#edf4ed] px-2.5 py-1 text-xs font-semibold text-[#174238]">
          {calificacionTexto}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#d5e0d6] bg-white p-3.5 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526a60]">
            Total de opiniones
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#14382e]">
              {numero.format(datos.total)}
            </span>
            <span className="text-xs text-[#526a60]">reseñas</span>
          </div>
        </div>
        <span className="text-xs text-[#526a60] text-right font-medium">
          {porcentajeVerificadas}% con QR
        </span>
      </div>

      <Link
        href={`${ruta}?destino=${encodeURIComponent(slugDestino)}&respuesta=pendiente`}
        className="group flex items-center justify-between rounded-xl border border-[#d5e0d6] bg-white p-3.5 shadow-xs transition-colors hover:border-amber-400 hover:bg-amber-50/40"
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526a60] group-hover:text-amber-900">
              Por responder
            </span>
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-semibold text-amber-900">
              Ver pendientes
            </span>
            <span className="text-xs text-amber-800">↗</span>
          </div>
        </div>
        <span className="rounded-lg bg-amber-100/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
          Prioritario
        </span>
      </Link>
    </div>
  );
}

function PildorasFiltros({
  parametros,
  slugDestino,
}: {
  parametros: Consulta;
  slugDestino: string;
}) {
  const activo = (clave: string, valor?: string) => {
    if (!valor) {
      return (
        !parametros.respuesta &&
        !parametros.foto &&
        !parametros.estrellas &&
        !parametros.desde &&
        !parametros.hasta
      );
    }
    return parametros[clave as keyof Consulta] === valor;
  };

  const crearUrl = (modificaciones: Partial<Consulta>) => {
    const params = new URLSearchParams();
    params.set("destino", slugDestino);
    if (parametros.orden) params.set("orden", parametros.orden);

    const merged = { ...parametros, ...modificaciones };
    for (const k of ["respuesta", "foto", "estrellas", "orden"] as const) {
      if (merged[k]) params.set(k, merged[k]!);
    }
    return `${ruta}?${params}`;
  };

  const hayFiltrosActivos = Boolean(
    parametros.respuesta ||
      parametros.foto ||
      parametros.estrellas ||
      parametros.desde ||
      parametros.hasta,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#d5e0d6] bg-white p-2.5">
      <nav aria-label="Filtros rápidos" className="flex flex-wrap items-center gap-1">
        <Link
          href={`${ruta}?destino=${encodeURIComponent(slugDestino)}`}
          aria-current={activo("todas") ? "page" : undefined}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed] text-[#426456]"
        >
          Todas
        </Link>
        <Link
          href={crearUrl({
            respuesta:
              parametros.respuesta === "pendiente" ? undefined : "pendiente",
          })}
          aria-current={activo("respuesta", "pendiente") ? "page" : undefined}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-amber-800 aria-[current=page]:text-white hover:bg-amber-50 text-amber-900 border border-amber-200"
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          Por responder
        </Link>
        <Link
          href={crearUrl({
            respuesta:
              parametros.respuesta === "respondida" ? undefined : "respondida",
          })}
          aria-current={activo("respuesta", "respondida") ? "page" : undefined}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed] text-[#426456]"
        >
          Respondidas
        </Link>
        <Link
          href={crearUrl({ foto: parametros.foto === "1" ? undefined : "1" })}
          aria-current={activo("foto", "1") ? "page" : undefined}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed] text-[#426456]"
        >
          Con fotos
        </Link>
        <Link
          href={crearUrl({
            estrellas: parametros.estrellas === "5" ? undefined : "5",
          })}
          aria-current={activo("estrellas", "5") ? "page" : undefined}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed] text-[#426456]"
        >
          5 estrellas
        </Link>
        <Link
          href={crearUrl({
            orden: parametros.orden === "menor" ? undefined : "menor",
          })}
          aria-current={parametros.orden === "menor" ? "page" : undefined}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed] text-[#426456]"
        >
          Menor nota
        </Link>
      </nav>

      {hayFiltrosActivos && (
        <Link
          href={`${ruta}?destino=${encodeURIComponent(slugDestino)}`}
          className="px-2 text-xs font-semibold text-rose-800 underline hover:text-rose-950"
        >
          Limpiar filtros
        </Link>
      )}
    </div>
  );
}

async function ResultadosResenas({
  filtro,
  pagina,
  seleccion,
  parametros,
  slugDestino,
}: {
  filtro: string;
  pagina: number;
  seleccion?: string;
  parametros: Consulta;
  slugDestino: string;
}) {
  const resultado = await solicitarVisitas<ListadoResenas>(
    `/resenas?${filtro}&pagina=${pagina}&administracion=1`,
  );

  if (!resultado.ok) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <p role="alert" className="text-sm font-semibold">
          {resultado.mensaje}
        </p>
        {![401, 403, 404].includes(resultado.estado) && (
          <BotonActualizarPanel reintentar />
        )}
      </div>
    );
  }

  const datos = resultado.datos;
  const primeraPagina = `${ruta}?${filtro}`;
  const volver = `${primeraPagina}&pagina=${pagina}`;
  const elegida = datos.resenas.find(({ id }) => id === seleccion);

  return (
    <div className="space-y-4">
      <TarjetasKpiCompactas datos={datos} slugDestino={slugDestino} />

      <PildorasFiltros parametros={parametros} slugDestino={slugDestino} />

      <section className="space-y-3" aria-labelledby="opiniones-publicadas">
        <div className="flex items-center justify-between px-1">
          <h2
            id="opiniones-publicadas"
            className="text-xs font-bold uppercase tracking-wider text-[#426456]"
          >
            Listado de opiniones ({numero.format(datos.total)})
          </h2>
          <span className="text-xs text-[#526a60]">
            Página {numero.format(pagina)} de{" "}
            {Math.max(1, Math.ceil(datos.total / 10))}
          </span>
        </div>

        {datos.resenas.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#d5e0d6] bg-white divide-y divide-[#edf3ec]">
            {datos.resenas.map((resena) => (
              <OpinionResumen
                key={resena.id}
                resena={resena}
                href={`${volver}&resena=${encodeURIComponent(resena.id)}`}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d5e0d6] bg-white py-12 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#edf4ed] text-[#174238]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-6"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h3 className="mt-3 font-serif text-base font-bold text-[#14382e]">
              No hay opiniones con los filtros seleccionados
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#526a60]">
              Prueba cambiando los filtros para ver otras reseñas de tus
              visitantes.
            </p>
            <Link
              href={`${ruta}?destino=${encodeURIComponent(slugDestino)}`}
              className="mt-3 rounded-lg border border-[#ccd9cf] px-3.5 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
            >
              Restablecer filtros
            </Link>
          </div>
        )}

        {(pagina > 1 || datos.hayMas) && (
          <nav
            aria-label="Páginas de reseñas"
            className="flex items-center justify-center gap-3 pt-2"
          >
            {pagina > 1 && (
              <Link
                className="rounded-lg border border-[#ccd9cf] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
                rel="prev"
                href={`${primeraPagina}&pagina=${pagina - 1}`}
              >
                Página anterior
              </Link>
            )}
            <span className="text-xs font-medium text-[#526a60]">
              Página {numero.format(pagina)}
            </span>
            {datos.hayMas && (
              <Link
                className="rounded-lg border border-[#ccd9cf] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
                rel="next"
                href={`${primeraPagina}&pagina=${pagina + 1}`}
              >
                Siguiente página
              </Link>
            )}
          </nav>
        )}
      </section>

      {elegida && (
        <DetalleOpinion key={elegida.id} resena={elegida} volver={volver} />
      )}
    </div>
  );
}

async function ResenasAsignadas({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel())) return null;
  const [parametros, acceso] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
  ]);

  if (!acceso.ok) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <p role="alert" className="text-sm font-semibold">
          {acceso.mensaje}
        </p>
        {![401, 403, 404].includes(acceso.estado) && (
          <BotonActualizarPanel reintentar />
        )}
      </div>
    );
  }

  const { destino, pagina, orden } = parametros;
  const elegido = destino
    ? acceso.datos.find(({ slug }) => slug === destino)
    : acceso.datos[0];

  if (!elegido) {
    return (
      <div className="rounded-2xl border border-[#d5e0d6] bg-white p-6 space-y-3 text-center">
        <p className="text-sm text-[#4d665b]">
          {acceso.datos.length
            ? "El atractivo solicitado no está disponible para tu cuenta."
            : "Tu cuenta aún no tiene un atractivo asignado."}
        </p>
        {acceso.datos.length > 0 && (
          <Link
            href={ruta}
            className="inline-flex items-center text-xs font-semibold text-[#173b32] underline"
          >
            Ver reseñas del atractivo asignado
          </Link>
        )}
      </div>
    );
  }

  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const ordenActual = ["calificacion", "menor"].includes(orden ?? "")
    ? orden!
    : "recientes";

  const filtros = new URLSearchParams({
    destino: elegido.slug,
    orden: ordenActual,
  });

  for (const clave of [
    "estrellas",
    "desde",
    "hasta",
    "foto",
    "respuesta",
  ] as const) {
    if (parametros[clave]) filtros.set(clave, parametros[clave]!);
  }

  const filtro = filtros.toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d5e0d6] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14382e]">
            {elegido.nombre}
          </h1>
          <p className="mt-0.5 text-xs text-[#526a60]">
            Reseñas y atención a visitantes.
          </p>
        </div>

        {acceso.datos.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#526a60]">Cambiar:</span>
            <div className="flex flex-wrap gap-1">
              {acceso.datos.map(({ id, slug, nombre }) => (
                <Link
                  key={id}
                  href={`${ruta}?destino=${encodeURIComponent(slug)}`}
                  aria-current={slug === elegido.slug ? "page" : undefined}
                  className="rounded-lg border border-[#ccd9cf] px-2.5 py-1 text-xs font-semibold transition-colors aria-[current=page]:border-[#174238] aria-[current=page]:bg-[#174238] aria-[current=page]:text-white hover:bg-[#edf4ed]"
                >
                  {nombre}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Suspense
        key={`${filtro}&pagina=${actual}`}
        fallback={<EsqueletoResenas />}
      >
        <ResultadosResenas
          filtro={filtro}
          pagina={actual}
          seleccion={parametros.resena}
          parametros={parametros}
          slugDestino={elegido.slug}
        />
      </Suspense>
    </div>
  );
}

function EsqueletoResenas() {
  return (
    <div role="status" className="space-y-4 animate-pulse">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-[#d5e0d6] bg-white"
          />
        ))}
      </div>
      <div className="h-10 rounded-xl border border-[#d5e0d6] bg-white" />
      <div className="h-64 rounded-2xl border border-[#d5e0d6] bg-white" />
    </div>
  );
}

export default function PaginaResenas({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 py-2 text-[#14382e]">
      <Suspense fallback={<EsqueletoResenas />}>
        <ResenasAsignadas consulta={searchParams} />
      </Suspense>
    </main>
  );
}
