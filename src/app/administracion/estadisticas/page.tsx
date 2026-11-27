import { ContenidoResena } from "@/features/resenas/contenido-resena";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
import { PantallaQr } from "@/features/visitas/pantalla-qr";
import { fechaVisita, type DestinoVisita } from "@/features/visitas/tipos";
import type { Resena } from "@/features/resenas/tipos";
import { ReportarResena } from "@/features/administracion/controles-reporte";
import { accesoPanel } from "@/features/administracion/acceso";
import { leerPeriodo } from "@/features/administracion/lectura-periodo";
import {
  BotonActualizarEstadisticas,
  BotonCopiarResumenEstadisticas,
  SelectorPeriodoRapido,
  BotonCopiarEnlaceQr,
} from "@/features/administracion/controles-estadisticas";

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

const campoFiltro =
  "min-h-10 w-full rounded-xl border border-[#cbdcca] bg-white px-3 text-xs font-semibold text-[#174238] outline-none focus:border-[#174238]";
const tarjeta = "min-w-0 rounded-2xl border border-[#d5e0d6] bg-white p-4 sm:p-5 shadow-xs";
const distribucionDetalle =
  "grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]";

const formatoMes = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const decimal = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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
      <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-[#173b32]">
        <p role="alert" className="text-sm font-semibold text-rose-900">
          {acceso.estado === 403
            ? "Esta pantalla requiere una cuenta administradora."
            : acceso.mensaje}
        </p>
        {acceso.estado !== 403 && (
          <BotonActualizarEstadisticas reintentar variante="boton" />
        )}
      </div>
    );
  }

  const destino = parametros.destino
    ? acceso.datos.find(({ slug }) => slug === parametros.destino)
    : acceso.datos[0];

  if (!destino) {
    return (
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <p role="status" className="text-sm text-[#4d665b]">
          {acceso.datos.length
            ? "El atractivo seleccionado no está disponible para tu cuenta."
            : "Tu cuenta todavía no tiene un atractivo asignado."}
        </p>
        {acceso.datos.length > 0 && (
          <Link
            href="/administracion/estadisticas"
            className="inline-flex min-h-9 items-center rounded-xl bg-[#174238] px-3.5 text-xs font-semibold text-white hover:bg-[#23574a]"
          >
            Ver estadísticas de un destino asignado
          </Link>
        )}
      </div>
    );
  }

  const meses = ["3", "12"].includes(parametros.meses ?? "")
    ? (parametros.meses as string)
    : "6";
  const slug = encodeURIComponent(destino.slug);
  const filtro = new URLSearchParams({ destino: destino.slug, meses });
  const ruta = "/administracion/estadisticas";
  const vistaQr = parametros.seccion === "qr";

  const navegacionPestanas = (
    <nav
      aria-label="Navegación del panel"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#d5e0d6] bg-white p-1.5 shadow-xs"
    >
      <Link
        href={`${ruta}?${filtro}`}
        aria-current={vistaQr ? undefined : "page"}
        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
          !vistaQr
            ? "bg-[#174238] text-white shadow-xs"
            : "text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M3 3v14h14M7 13l3-3 2 2 4-5" />
        </svg>
        <span>Estadísticas</span>
      </Link>

      <Link
        href={`${ruta}?${filtro}&seccion=qr`}
        aria-current={vistaQr ? "page" : undefined}
        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
          vistaQr
            ? "bg-[#174238] text-white shadow-xs"
            : "text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-3.5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="5" height="5" rx="1" />
          <rect x="12" y="3" width="5" height="5" rx="1" />
          <rect x="3" y="12" width="5" height="5" rx="1" />
          <path d="M12 12h2v2h-2zM15 15h2v2h-2zM12 16h2v1h-2z" />
        </svg>
        <span>Mi QR</span>
      </Link>

      <Link
        href={`/administracion/resenas?destino=${slug}`}
        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M17 10c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306L3 18l1.306-3.653A6.673 6.673 0 0 1 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7Z" />
        </svg>
        <span>Reseñas</span>
      </Link>

      <Link
        href={
          perfil?.rol === "SUPER_ADMIN"
            ? "/superadmin/destinos"
            : "/administracion"
        }
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
      >
        <span>Ver atractivo</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="m7 14 5-5-5-5" />
        </svg>
      </Link>
    </nav>
  );

  if (vistaQr) {
    return (
      <div className="space-y-6">
        {navegacionPestanas}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d5e0d6] pb-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#526a60]">
              Punto de control presencial
            </span>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#14382e] sm:text-3xl">
              QR dinámico · {destino.nombre}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotonCopiarEnlaceQr slug={destino.slug} />
            <Link
              href={`${ruta}?${filtro}`}
              className="inline-flex min-h-9 items-center rounded-xl border border-[#d5e0d6] bg-white px-3.5 text-xs font-semibold text-[#174238] shadow-xs hover:bg-[#edf4ed]"
            >
              Volver a estadísticas
            </Link>
          </div>
        </header>
        <PantallaQr key={destino.slug} slug={destino.slug} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {navegacionPestanas}

      <header className="flex flex-col gap-4 border-b border-[#d5e0d6] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#526a60]">
            <span>Panel del atractivo</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          </div>
          <h1 className="mt-1 wrap-anywhere font-serif text-3xl font-bold leading-tight text-[#14382e] sm:text-4xl">
            {destino.nombre}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {perfil?.rol === "SUPER_ADMIN" && acceso.datos.length > 1 && (
            <Form
              id="cambiar-destino"
              key={`destino-${filtro}`}
              action={ruta}
              className="flex items-center"
            >
              <input type="hidden" name="meses" value={meses} />
              <select
                name="destino"
                defaultValue={destino.slug}
                aria-label="Seleccionar atractivo"
                className={campoFiltro + " sm:max-w-56"}
              >
                {acceso.datos.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="ml-2 inline-flex min-h-10 items-center rounded-xl bg-[#174238] px-3 text-xs font-semibold text-white hover:bg-[#23574a]"
              >
                Cambiar
              </button>
            </Form>
          )}

          <SelectorPeriodoRapido
            mesesSeleccionados={meses}
            slugDestino={destino.slug}
          />
        </div>
      </header>

      <Suspense
        key={`resultados-${filtro}`}
        fallback={<EsqueletoEstadisticas />}
      >
        <ResultadosEstadisticas
          slug={slug}
          meses={meses}
          nombreDestino={destino.nombre}
        />
      </Suspense>
    </div>
  );
}

async function ResultadosEstadisticas({
  slug,
  meses,
  nombreDestino,
}: {
  slug: string;
  meses: string;
  nombreDestino: string;
}) {
  const respuesta = await solicitarVisitas<Estadisticas>(
    `/visitas/administracion/${slug}/estadisticas?meses=${meses}`,
  );

  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
        <p role="alert" className="text-sm font-semibold">
          {respuesta.mensaje}
        </p>
        {![403, 404].includes(respuesta.estado) && (
          <BotonActualizarEstadisticas reintentar variante="boton" />
        )}
      </div>
    );
  }

  const datos = respuesta.datos;
  const lectura = leerPeriodo(datos);
  const totalPeriodo = datos.tendencia.reduce((acc, p) => acc + p.total, 0);
  const pico = datos.tendencia.reduce(
    (mayor, periodo) => (periodo.total > mayor.total ? periodo : mayor),
    { mes: "", total: 0 },
  );
  const primerMes = datos.tendencia[0]?.mes;
  const ultimoMes = datos.tendencia.at(-1)?.mes;

  const calificacionTexto =
    datos.promedio === null
      ? "Sin calificaciones"
      : datos.promedio >= 4.5
        ? "Excelente reputación"
        : datos.promedio >= 4.0
          ? "Buena calificación"
          : datos.promedio >= 3.0
            ? "Calificación regular"
            : "Requiere atención";

  const tasaResenas =
    datos.totalVisitas > 0
      ? Math.round((datos.totalResenas / datos.totalVisitas) * 100)
      : 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#526a60]">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="size-3.5 text-[#174238]"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l2.5 2.5" />
          </svg>
          <p role="status" aria-live="polite">
            Última actualización:{" "}
            <time
              dateTime={datos.actualizadoEn}
              className="font-medium text-[#174238]"
            >
              {fechaVisita.format(new Date(datos.actualizadoEn))}
            </time>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BotonCopiarResumenEstadisticas
            destino={nombreDestino}
            totalVisitas={datos.totalVisitas}
            totalResenas={datos.totalResenas}
            promedio={datos.promedio}
            periodoMeses={meses}
          />
          <BotonActualizarEstadisticas />
        </div>
      </div>

      <dl className="grid gap-3.5 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-[#d5e0d6] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Visitas verificadas
            </dt>
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-4"
                aria-hidden="true"
              >
                <path d="M10 2l6 3v5c0 4.5-3 7.5-6 8-3-0.5-6-3.5-6-8V5l6-3z" />
                <path d="m8 10 1.5 1.5L13 8" />
              </svg>
            </span>
          </div>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-[#14382e] sm:text-4xl tabular-nums">
            {datos.totalVisitas.toLocaleString("es-PE")}
          </dd>
          <div className="mt-3 flex items-center justify-between border-t border-[#edf3ec] pt-2.5 text-xs">
            <span className="text-[#526a60]">Mediante QR presencial</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 text-[11px]">
              100% verificado
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#d5e0d6] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Reseñas recibidas
            </dt>
            <span className="grid size-8 place-items-center rounded-xl bg-teal-50 text-teal-800">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-4"
                aria-hidden="true"
              >
                <path d="M17 10c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306L3 18l1.306-3.653A6.673 6.673 0 0 1 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7Z" />
              </svg>
            </span>
          </div>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-[#14382e] sm:text-4xl tabular-nums">
            {datos.totalResenas.toLocaleString("es-PE")}
          </dd>
          <div className="mt-3 flex items-center justify-between border-t border-[#edf3ec] pt-2.5 text-xs">
            <span className="text-[#526a60]">
              {tasaResenas}% tasa de opinión
            </span>
            <Link
              href={`/administracion/resenas?destino=${slug}`}
              className="font-semibold text-[#174238] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#d5e0d6] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Calificación general
            </dt>
            <span className="grid size-8 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <dd className="text-3xl font-bold tracking-tight text-[#14382e] sm:text-4xl tabular-nums">
              {datos.promedio === null ? "—" : decimal.format(datos.promedio)}
            </dd>
            <span className="text-xs font-semibold text-[#526a60]">
              de 5 estrellas
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#edf3ec] pt-2.5 text-xs">
            <span className="font-semibold text-[#174238]">
              {calificacionTexto}
            </span>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    datos.promedio !== null && i <= Math.round(datos.promedio)
                      ? "text-amber-500"
                      : "text-stone-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      </dl>

      <section
        className="rounded-2xl border border-[#cbdcca] bg-[#f6f9f6] p-5 sm:p-6 shadow-xs"
        aria-labelledby="lectura-periodo"
      >
        <div className="flex items-center gap-2 border-b border-[#e1ece1] pb-3">
          <span className="grid size-6 place-items-center rounded-lg bg-[#174238] text-white">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M3 10h4l3-7 4 14 3-7h3" />
            </svg>
          </span>
          <h2
            id="lectura-periodo"
            className="font-serif text-lg font-bold text-[#14382e]"
          >
            Diagnóstico del período
          </h2>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Afluencia de visitantes
            </span>
            <p className="text-xs leading-relaxed text-[#234c3d] sm:text-sm">
              {lectura.destacados.length > 0 ? (
                <>
                  El mes con mayor concentración de visitas fue{" "}
                  <strong className="rounded bg-[#edf4ed] px-1.5 py-0.5 font-bold text-[#174238]">
                    {lectura.destacados
                      .map((mes) =>
                        formatoMes.format(new Date(`${mes}-01T00:00:00Z`)),
                      )
                      .join(" · ")}
                  </strong>
                  , registrando{" "}
                  <strong>{lectura.maximo.toLocaleString("es-PE")}</strong>{" "}
                  {lectura.maximo === 1 ? "visita" : "visitas"}, lo que
                  representa el{" "}
                  <strong>
                    {decimal.format(lectura.porcentaje)}%
                  </strong>{" "}
                  del total del período evaluado.
                </>
              ) : (
                "Aún no se registran visitas verificadas en este período. Recuerda colocar el QR visible en el atractivo para iniciar el conteo presencial."
              )}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Percepción y recomendaciones
            </span>
            <p className="text-xs leading-relaxed text-[#234c3d] sm:text-sm">
              {lectura.observacion}
            </p>
            {datos.recientes.length > 0 && (
              <p className="text-[11px] text-[#526a60]">
                Diagnóstico estimado en base a las reseñas recientes y escaneos
                registrados en el sistema.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className={distribucionDetalle}>
        <section className={tarjeta} aria-labelledby="visitas-por-mes">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#edf3ec] pb-3">
            <div>
              <h2
                id="visitas-por-mes"
                className="font-serif text-lg font-bold text-[#14382e]"
              >
                Tendencia de visitas por mes
              </h2>
              {primerMes && ultimoMes && (
                <p className="text-xs text-[#526a60]">
                  {formatoMes.format(new Date(`${primerMes}-01T00:00:00Z`))} —{" "}
                  {formatoMes.format(new Date(`${ultimoMes}-01T00:00:00Z`))}
                </p>
              )}
            </div>
            <span className="rounded-lg bg-[#edf4ed] px-2.5 py-1 text-xs font-semibold text-[#174238]">
              Total: {totalPeriodo.toLocaleString("es-PE")} visitas
            </span>
          </div>

          {pico.total > 0 ? (
            <ul className="mt-4 space-y-3.5">
              {datos.tendencia.map(({ mes, total }) => {
                const esPico = total === pico.total && total > 0;
                const porcentaje =
                  pico.total > 0 ? Math.round((total / pico.total) * 100) : 0;
                return (
                  <li key={mes} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-[#174238] font-semibold">
                          {formatoMes.format(new Date(`${mes}-01T00:00:00Z`))}
                        </span>
                        {esPico && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900">
                            Pico
                          </span>
                        )}
                      </div>
                      <span className="tabular-nums font-semibold text-[#14382e]">
                        {total.toLocaleString("es-PE")}{" "}
                        <span className="font-normal text-[#526a60]">
                          visitas
                        </span>
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-3 w-full overflow-hidden rounded-full bg-[#edf3ec]"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          esPico ? "bg-[#174238]" : "bg-[#52836d]"
                        }`}
                        style={{ width: `${Math.max(4, porcentaje)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#d5e0d6] bg-[#fbfcf8] p-6 text-center text-xs text-[#526a60]">
              <p className="font-semibold text-[#174238]">
                Sin visitas registradas en este período
              </p>
              <p className="mt-1">
                Genera tu afiche y transmite el QR en el punto de acceso para
                comenzar a capturar visitas presenciales.
              </p>
            </div>
          )}
        </section>

        <section
          id="resenas-recientes"
          className={tarjeta}
          aria-labelledby="titulo-resenas"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#edf3ec] pb-3">
            <h2
              id="titulo-resenas"
              className="font-serif text-lg font-bold text-[#14382e]"
            >
              Reseñas recientes
            </h2>
            <Link
              href={`/administracion/resenas?destino=${slug}`}
              className="inline-flex min-h-8 items-center text-xs font-semibold text-[#174238] hover:underline"
            >
              Ver todas ({datos.totalResenas}) →
            </Link>
          </div>

          {datos.recientes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#d5e0d6] bg-[#fbfcf8] p-6 text-center text-xs text-[#526a60]">
              <p className="font-semibold text-[#174238]">
                Aún no hay reseñas en este período
              </p>
              <p className="mt-1">
                Las opiniones de los visitantes verificados aparecerán listadas
                aquí en tiempo real.
              </p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-[#edf3ec]">
              {datos.recientes.map((resena) => (
                <li key={resena.id} className="space-y-2 py-3.5 first:pt-2 last:pb-0">
                  <ContenidoResena
                    autor={resena.usuario.nombreCompleto}
                    creadaEn={resena.creadaEn}
                    calificacion={resena.calificacion}
                    verificada={resena.verificada}
                    comentario={resena.comentario}
                    compacto
                  />
                  <div className="flex items-center justify-end">
                    <ReportarResena id={resena.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function EsqueletoEstadisticas() {
  return (
    <div role="status" className="space-y-5 motion-safe:animate-pulse">
      <span className="sr-only">Cargando estadísticas</span>
      <div
        aria-hidden="true"
        className="h-5 w-48 rounded-lg bg-[#e5eee7]"
      />
      <div aria-hidden="true" className="grid gap-3.5 sm:grid-cols-3">
        {[1, 2, 3].map((indicador) => (
          <div
            key={indicador}
            className="h-28 rounded-2xl bg-[#e5eee7]"
          />
        ))}
      </div>
      <div aria-hidden="true" className="h-32 rounded-2xl bg-[#e5eee7]" />
      <div aria-hidden="true" className={distribucionDetalle}>
        <div className="h-64 rounded-2xl bg-[#e5eee7]" />
        <div className="h-64 rounded-2xl bg-[#e5eee7]" />
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
    <main className="mx-auto w-full max-w-[100rem] space-y-6 py-4 sm:py-6">
      <Panel consulta={searchParams} />
    </main>
  );
}
