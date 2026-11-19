import { ContenidoResena } from "@/features/resenas/contenido-resena";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { PantallaQr } from "@/features/visitas/pantalla-qr";
import { fechaVisita, type DestinoVisita } from "@/features/visitas/tipos";
import type { Resena } from "@/features/resenas/tipos";
import { ReportarResena } from "@/features/administracion/controles-reporte";
import { accesoPanel } from "@/features/administracion/acceso";
import { leerPeriodo } from "@/features/administracion/lectura-periodo";

type Consulta = {
  destino?: string;
  meses?: string;
  seccion?: string;
};
type Estadisticas = {
  totalVisitas: number;
  totalResenas: number;
  promedio: number | null;
  tendencia: { mes: string; total: number }[];
  recientes: Pick<
    Resena,
    "id" | "usuario" | "comentario" | "calificacion" | "creadaEn" | "verificada"
  >[];
  actualizadoEn: string;
};

const campoFiltro = "min-h-11 w-full rounded-xl border border-[#b8cbbb] bg-white px-3 font-medium";
const tarjeta = "min-w-0 rounded-2xl border border-[#d5e0d6] bg-white p-4 sm:p-6";
const distribucionDetalle = "grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]";

const formatoMes = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

async function Panel({ consulta }: { consulta: Promise<Consulta> }) {
  await connection();
  const [parametros, acceso, perfil] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
    accesoPanel(),
  ]);
  if (!acceso.ok) {
    if (acceso.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className="space-y-2">
        <p role="alert">
          {acceso.estado === 403
            ? "Esta pantalla requiere una cuenta administradora."
            : acceso.mensaje}
        </p>
        {acceso.estado !== 403 && <BotonActualizarPanel reintentar />}
      </div>
    );
  }
  const destino = parametros.destino
    ? acceso.datos.find(({ slug }) => slug === parametros.destino)
    : acceso.datos[0];
  if (!destino)
    return (
      <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-5">
        <p role="status">
          {acceso.datos.length
            ? "El destino seleccionado no está disponible para tu cuenta."
            : "Tu cuenta todavía no tiene un destino asignado."}
        </p>
        {acceso.datos.length > 0 && (
          <Link
            href="/administracion/estadisticas"
            className="font-semibold underline"
          >
            Ver estadísticas de un destino asignado
          </Link>
        )}
      </div>
    );
  const meses = ["3", "12"].includes(parametros.meses ?? "")
    ? (parametros.meses as string)
    : "6";
  const slug = encodeURIComponent(destino.slug);
  const filtro = new URLSearchParams({ destino: destino.slug, meses });
  const ruta = "/administracion/estadisticas";
  const vistaQr = parametros.seccion === "qr";
  const navegacion = (
    <nav
      aria-label="Panel del encargado"
      className={`${perfil?.rol === "SUPER_ADMIN" ? "flex" : "hidden md:flex"} flex-wrap gap-4 rounded-xl bg-teal-50 p-3 text-sm font-semibold`}
    >
      <Link
        className="py-2"
        href={`${ruta}?${filtro}`}
        aria-current={vistaQr ? undefined : "page"}
      >
        Estadísticas
      </Link>
      <Link
        className="py-2"
        href={
          perfil?.rol === "SUPER_ADMIN"
            ? "/superadmin/destinos"
            : "/administracion"
        }
        aria-label="Ver atractivos"
      >
        Atractivos
      </Link>
      <Link
        className="py-2"
        href={`${ruta}?${filtro}&seccion=qr`}
        aria-current={vistaQr ? "page" : undefined}
        aria-label="QR dinámico"
      >
        Mi QR
      </Link>
      <Link className="py-2" href={`/administracion/resenas?destino=${slug}`}>
        Reseñas
      </Link>
    </nav>
  );
  if (vistaQr)
    return (
      <>
        {navegacion}
        <h1 className="text-2xl font-bold">QR dinámico · {destino.nombre}</h1>
        <PantallaQr key={destino.slug} slug={destino.slug} />
      </>
    );
  return (
    <>
      {perfil?.rol === "SUPER_ADMIN" && navegacion}
      <header className="flex flex-col gap-5 border-b border-[#d5e0d6] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#426456]">Estadísticas del atractivo</p>
          <h1 className="mt-1 wrap-anywhere font-serif text-3xl leading-tight text-[#14382e] sm:text-4xl">
            {destino.nombre}
          </h1>
        </div>
        <Form
          id="atractivos"
          key={`filtros-${filtro}`}
          action={ruta}
          className="grid items-end gap-3 sm:flex sm:flex-wrap"
        >
          {perfil?.rol === "SUPER_ADMIN" && acceso.datos.length > 1 ? (
            <label className="grid min-w-0 gap-1 text-sm font-semibold text-[#14382e]">
              Atractivo
              <select name="destino" defaultValue={destino.slug} className={campoFiltro + " sm:max-w-64"}>
                {acceso.datos.map((item) => (
                  <option key={item.id} value={item.slug}>{item.nombre}</option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="destino" value={destino.slug} />
          )}
          <label className="grid gap-1 text-sm font-semibold text-[#14382e]">
            Período
            <select name="meses" defaultValue={meses} className={campoFiltro}>
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
            </select>
          </label>
          <button className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#245649]">
            Aplicar filtros
          </button>
        </Form>
      </header>
      <Suspense
        key={`resultados-${filtro}`}
        fallback={<EsqueletoEstadisticas />}
      >
        <ResultadosEstadisticas slug={slug} meses={meses} />
      </Suspense>
    </>
  );
}

async function ResultadosEstadisticas({
  slug,
  meses,
}: {
  slug: string;
  meses: string;
}) {
  const respuesta = await solicitarVisitas<Estadisticas>(
    `/visitas/administracion/${slug}/estadisticas?meses=${meses}`,
  );
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p role="alert">{respuesta.mensaje}</p>
        {![403, 404].includes(respuesta.estado) && (
          <BotonActualizarPanel reintentar />
        )}
      </div>
    );
  }
  const datos = respuesta.datos;
  const lectura = leerPeriodo(datos);
  const pico = datos.tendencia.reduce(
    (mayor, periodo) => (periodo.total > mayor.total ? periodo : mayor),
    { mes: "", total: 0 },
  );
  const primerMes = datos.tendencia[0]?.mes;
  const ultimoMes = datos.tendencia.at(-1)?.mes;

  const indicadores = [
    { titulo: "Visitas verificadas", valor: datos.totalVisitas.toLocaleString("es-PE"), detalle: "Registradas mediante QR" },
    { titulo: "Reseñas recibidas", valor: datos.totalResenas.toLocaleString("es-PE") },
    {
      titulo: "Calificación promedio",
      valor: datos.promedio === null ? "Sin calificaciones" : datos.promedio.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      unidad: datos.promedio === null ? undefined : "de 5",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-stone-700">
        <p role="status" aria-live="polite" aria-atomic="true">
          Actualizado el{" "}
          <time dateTime={datos.actualizadoEn}>
            {fechaVisita.format(new Date(datos.actualizadoEn))}
          </time>
        </p>
        <BotonActualizarPanel />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {indicadores.map(({ titulo, valor, detalle, unidad }, indice) => (
          <div key={titulo} className={indice === 0 ? "rounded-2xl bg-[#174238] p-4 text-white sm:p-6" : tarjeta}>
            <dt className="text-sm font-semibold">{titulo}</dt>
            <dd className={`mt-2 font-semibold tabular-nums ${valor === "Sin calificaciones" ? "text-lg" : "text-3xl sm:text-4xl"}`}>
              {valor}
              {unidad && <span className="ml-2 text-sm font-medium">{unidad}</span>}
            </dd>
            {detalle && <dd className="mt-1 text-sm text-teal-100">{detalle}</dd>}
          </div>
        ))}
      </dl>
      <section className="rounded-2xl border border-[#cbdcca] bg-[#edf4ed] p-4 sm:p-6" aria-labelledby="lectura-periodo">
        <h2 id="lectura-periodo" className="font-serif text-2xl text-[#14382e]">Lectura del período</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <p className="text-sm leading-relaxed text-[#234c3d]">
            {lectura.destacados.length > 0 ? (
              <>
                <strong>{lectura.destacados.map((mes) => formatoMes.format(new Date(`${mes}-01T00:00:00Z`))).join(" · ")}</strong>
                {lectura.destacados.length === 1 ? " fue el mes con más visitas" : " comparten el mayor número de visitas"}:
                {" "}{lectura.maximo.toLocaleString("es-PE")} {lectura.maximo === 1 ? "visita" : "visitas"}
                {lectura.destacados.length > 1 ? " en cada mes" : ""},
                {" "}{lectura.porcentaje.toLocaleString("es-PE", { maximumFractionDigits: 1 })}% del total del período
                {lectura.destacados.length > 1 ? " por mes" : ""}.
              </>
            ) : "Aún no hay visitas verificadas en este período. Comparte el QR en tu atractivo para empezar a registrar las visitas."}
          </p>
          <div className="space-y-2 text-sm leading-relaxed text-[#234c3d]">
            <p>{lectura.observacion}</p>
            {datos.recientes.length > 0 && <p className="text-xs text-[#496653]">Esta lectura considera únicamente las reseñas recientes mostradas; no representa todas las opiniones del período ni un análisis del texto de los comentarios.</p>}
          </div>
        </div>
      </section>
      <div className={distribucionDetalle}>
        <section className={tarjeta} aria-labelledby="visitas-por-mes">
          <h2 id="visitas-por-mes" className="font-serif text-2xl text-[#14382e]">Visitas por mes</h2>
          {primerMes && ultimoMes && (
            <p className="mt-1 text-sm text-stone-700">
              {formatoMes.format(new Date(`${primerMes}-01T00:00:00Z`))} a{" "}
              {formatoMes.format(new Date(`${ultimoMes}-01T00:00:00Z`))}
            </p>
          )}
          {pico.total > 0 ? (
            <>
              <p className="mt-4 rounded-lg bg-[#edf4ed] px-3 py-2 text-sm text-[#174238]">
                <strong className="capitalize">{formatoMes.format(new Date(`${pico.mes}-01T00:00:00Z`))}</strong>{" "}
                registró {pico.total.toLocaleString("es-PE")} {pico.total === 1 ? "visita" : "visitas"}, el valor más alto del período.
              </p>
              <ul className="mt-5 space-y-3">
                {datos.tendencia.map(({ mes, total }) => (
                  <li key={mes} className="grid grid-cols-[5rem_minmax(0,1fr)_4rem] items-center gap-2 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)_4rem] sm:gap-3">
                    <span className="whitespace-nowrap capitalize text-stone-700">
                      {formatoMes.format(new Date(`${mes}-01T00:00:00Z`))}
                    </span>
                    <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-[#e5eee7]">
                      <span
                        className={`block h-full rounded-full ${total === pico.total ? "bg-[#174238]" : "bg-[#638d77]"}`}
                        style={{ width: `${(total / pico.total) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-semibold tabular-nums">
                      {total.toLocaleString("es-PE")}<span className="sr-only"> visitas</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-[#f4f6f1] p-4 text-sm text-stone-700">
              Aún no hay visitas verificadas en este período.
            </p>
          )}
        </section>
        <section id="resenas-recientes" className={tarjeta} aria-labelledby="titulo-resenas">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-resenas" className="font-serif text-2xl text-[#14382e]">Reseñas recientes</h2>
            <Link href={`/administracion/resenas?destino=${slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4">
              Ver todas las reseñas
            </Link>
          </div>
          {datos.recientes.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f4f6f1] p-4 text-sm text-stone-700">
              Aún no hay reseñas en este período.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#d5e0d6]">
              {datos.recientes.map((resena) => (
                <li key={resena.id} className="space-y-2 py-4 last:pb-0">
                  <ContenidoResena autor={resena.usuario.nombreCompleto} creadaEn={resena.creadaEn} calificacion={resena.calificacion}
                    verificada={resena.verificada} comentario={resena.comentario} compacto />
                  <ReportarResena id={resena.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function EsqueletoEstadisticas({ encabezado = false }: { encabezado?: boolean }) {
  return (
    <div role="status" className="space-y-4 motion-safe:animate-pulse">
      <span className="sr-only">Cargando estadísticas</span>
      {encabezado && <div aria-hidden="true" className="h-24 rounded-2xl bg-[#e5eee7]" />}
      <div aria-hidden="true" className="h-5 w-44 rounded bg-[#e5eee7]" />
      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((indicador) => (
          <div key={indicador} className="h-28 rounded-2xl bg-[#e5eee7]" />
        ))}
      </div>
      <div aria-hidden="true" className={distribucionDetalle}>
        <div className="h-64 rounded-2xl bg-[#e5eee7]" />
        <div className="h-48 rounded-2xl bg-[#e5eee7]" />
      </div>
    </div>
  );
}

export default function PaginaEstadisticas({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="mx-auto w-full max-w-[100rem] space-y-5 py-6 sm:py-8">
      <Suspense fallback={<EsqueletoEstadisticas encabezado />}>
        <Panel consulta={searchParams} />
      </Suspense>
    </main>
  );
}
