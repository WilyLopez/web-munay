import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { ReportarResena } from "@/features/administracion/controles-reporte";
import type { ListadoResenas, Resena } from "@/features/resenas/tipos";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { fechaVisita, type DestinoVisita } from "@/features/visitas/tipos";

type Consulta = { destino?: string; pagina?: string; orden?: string };

const ruta = "/administracion/resenas";
const numero = new Intl.NumberFormat("es-PE");
const decimal = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const panel = "min-w-0 rounded-2xl border border-[#d5e0d6] bg-white";
const distribucion = "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]";

function ResumenResenas({ datos }: { datos: ListadoResenas }) {
  const porCalificacion = new Map(
    datos.distribucion.map(({ calificacion, total }) => [calificacion, total]),
  );

  return (
    <aside className={`${panel} p-4 sm:p-5`} aria-labelledby="resumen-opiniones">
      <h2 id="resumen-opiniones" className="font-serif text-xl text-[#14382e]">
        Resumen de opiniones
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-xl bg-[#174238] p-4 text-white">
          <dt className="text-sm font-semibold text-teal-100">Calificación promedio</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {datos.promedio === null ? "Sin calificaciones" : (
              <>
                {decimal.format(datos.promedio)}
                <span className="ml-2 text-sm font-medium text-teal-100">de 5</span>
              </>
            )}
          </dd>
        </div>
        <div className="rounded-xl bg-[#f0f5ef] p-3">
          <dt className="text-sm text-[#426456]">Publicadas</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{numero.format(datos.total)}</dd>
        </div>
        <div className="rounded-xl bg-[#f0f5ef] p-3">
          <dt className="text-sm text-[#426456]">Verificadas</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{numero.format(datos.verificadas)}</dd>
        </div>
      </dl>
      {datos.total > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-[#14382e]">Distribución por estrellas</h3>
          <ul className="mt-2 space-y-2">
            {[5, 4, 3, 2, 1].map((estrellas) => {
              const total = porCalificacion.get(estrellas) ?? 0;
              return (
                <li key={estrellas} className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
                  <span>{estrellas}<span aria-hidden="true"> ★</span><span className="sr-only"> estrellas</span></span>
                  <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#e5eee7]">
                    <span className="block h-full rounded-full bg-[#447862]" style={{ width: `${(total / datos.total) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{numero.format(total)}<span className="sr-only"> reseñas</span></span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
}

function TarjetaResena({ resena }: { resena: Resena }) {
  return (
    <li className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="wrap-anywhere font-semibold text-[#14382e]">{resena.usuario.nombreCompleto}</h3>
          <time dateTime={resena.creadaEn} className="mt-1 block text-sm text-stone-600">
            {fechaVisita.format(new Date(resena.creadaEn))}
          </time>
        </div>
        <p className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-950">
          <span aria-hidden="true">★ </span>{resena.calificacion} de 5
        </p>
      </div>
      <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${resena.verificada ? "bg-emerald-50 text-emerald-950" : "bg-stone-100 text-stone-700"}`}>
        {resena.verificada ? "Visita verificada por QR" : "Sin verificación"}
      </span>
      <p className="mt-3 wrap-anywhere whitespace-pre-line text-sm leading-relaxed text-stone-800 sm:text-base">
        {resena.comentario}
      </p>
      <ReportarResena id={resena.id} />
    </li>
  );
}

async function ResultadosResenas({ filtro, pagina }: { filtro: string; pagina: number }) {
  const resultado = await solicitarVisitas<ListadoResenas>(
    `/resenas?${filtro}&pagina=${pagina}`,
  );

  if (!resultado.ok) {
    return (
      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
        <p role="alert">{resultado.mensaje}</p>
        {![401, 403, 404].includes(resultado.estado) && <BotonActualizarPanel reintentar />}
      </div>
    );
  }

  const datos = resultado.datos;
  const botonPagina = "inline-flex min-h-11 items-center rounded-lg border border-[#b8cbbb] bg-white px-3 text-sm font-semibold text-[#174238] hover:bg-[#edf4ed]";
  const primeraPagina = `${ruta}?${filtro}`;

  return (
    <div className={distribucion}>
      <section className={`${panel} xl:col-start-1 xl:row-start-1`} aria-labelledby="opiniones-publicadas">
        <h2 id="opiniones-publicadas" className="border-b border-[#d5e0d6] px-4 py-4 font-serif text-2xl text-[#14382e] sm:px-6">
          Opiniones publicadas
        </h2>
        {datos.resenas.length > 0 ? (
          <ul className="divide-y divide-[#d5e0d6]">
            {datos.resenas.map((resena) => <TarjetaResena key={resena.id} resena={resena} />)}
          </ul>
        ) : (
          <div className="space-y-2 p-4 text-sm text-stone-700 sm:p-6">
            <p>{datos.total > 0 ? "Esta página está vacía." : "Este atractivo todavía no tiene reseñas publicadas."}</p>
            {pagina > 1 && (
              <Link href={primeraPagina} className="inline-flex min-h-11 items-center font-semibold text-[#174238] underline underline-offset-4">
                Volver a la primera página
              </Link>
            )}
          </div>
        )}
        {(pagina > 1 || datos.hayMas) && (
          <nav aria-label="Páginas de reseñas" className="flex flex-wrap items-center gap-2 border-t border-[#d5e0d6] px-4 py-3 sm:px-6">
            {pagina > 1 && (
              <Link className={botonPagina} rel="prev" href={`${primeraPagina}&pagina=${pagina - 1}`}>
                Anterior
              </Link>
            )}
            <span aria-current="page" className="px-1 text-sm font-medium text-stone-700">
              Página {numero.format(pagina)}
            </span>
            {datos.hayMas && pagina < 99999 && (
              <Link className={botonPagina} rel="next" href={`${primeraPagina}&pagina=${pagina + 1}`}>
                Siguiente
              </Link>
            )}
          </nav>
        )}
      </section>
      <ResumenResenas datos={datos} />
    </div>
  );
}

async function ResenasAsignadas({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel())) return null;
  const [{ destino, pagina, orden }, acceso] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
  ]);
  if (!acceso.ok) {
    return (
      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
        <p role="alert">{acceso.mensaje}</p>
        {![401, 403, 404].includes(acceso.estado) && <BotonActualizarPanel reintentar />}
      </div>
    );
  }

  const elegido = destino
    ? acceso.datos.find(({ slug }) => slug === destino)
    : acceso.datos[0];
  if (!elegido) {
    return (
      <div className={`${panel} space-y-2 p-5`}>
        <p role="status">{acceso.datos.length ? "El atractivo no está disponible para tu cuenta." : "Tu cuenta aún no tiene un atractivo asignado."}</p>
        {acceso.datos.length > 0 && (
          <Link href={ruta} className="inline-flex min-h-11 items-center font-semibold text-[#174238] underline underline-offset-4">
            Ver reseñas del atractivo asignado
          </Link>
        )}
      </div>
    );
  }

  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const ordenActual = orden === "calificacion" ? "calificacion" : "recientes";
  const filtro = new URLSearchParams({ destino: elegido.slug, orden: ordenActual }).toString();
  const campo = "min-h-11 w-full rounded-xl border border-[#b8cbbb] bg-white px-3 font-medium";

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-[#d5e0d6] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <h2 className="min-w-0 wrap-anywhere font-serif text-2xl text-[#14382e] sm:text-3xl">
          {elegido.nombre}
        </h2>
        <Form key={filtro} action={ruta} className="grid items-end gap-3 sm:flex sm:flex-wrap">
          {acceso.datos.length > 1 ? (
            <label className="grid min-w-0 gap-1 text-sm font-semibold">
              Atractivo
              <select name="destino" defaultValue={elegido.slug} className={`${campo} sm:max-w-64`}>
                {acceso.datos.map(({ id, slug, nombre }) => <option key={id} value={slug}>{nombre}</option>)}
              </select>
            </label>
          ) : (
            <input type="hidden" name="destino" value={elegido.slug} />
          )}
          <label className="grid gap-1 text-sm font-semibold">
            Ordenar por
            <select name="orden" defaultValue={ordenActual} className={campo}>
              <option value="recientes">Más recientes</option>
              <option value="calificacion">Mayor calificación</option>
            </select>
          </label>
          <button className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#245649]">
            Aplicar
          </button>
        </Form>
      </div>
      <Suspense key={`${filtro}&pagina=${actual}`} fallback={<EsqueletoResenas />}>
        <ResultadosResenas filtro={filtro} pagina={actual} />
      </Suspense>
    </>
  );
}

function EsqueletoResenas() {
  return (
    <div role="status" className={`${distribucion} motion-safe:animate-pulse`}>
      <span className="sr-only">Cargando reseñas</span>
      <div aria-hidden="true" className="h-72 rounded-2xl bg-[#e5eee7]" />
      <div aria-hidden="true" className="h-56 rounded-2xl bg-[#e5eee7]" />
    </div>
  );
}

export default function PaginaResenas({ searchParams }: { searchParams: Promise<Consulta> }) {
  return (
    <main className="mx-auto w-full max-w-[100rem] space-y-5 py-2 text-[#14382e]">
      <h1 className="text-sm font-semibold text-[#426456]">Reseñas del atractivo</h1>
      <Suspense fallback={<EsqueletoResenas />}>
        <ResenasAsignadas consulta={searchParams} />
      </Suspense>
    </main>
  );
}
