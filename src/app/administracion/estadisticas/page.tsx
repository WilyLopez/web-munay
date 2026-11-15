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

const formatoMes = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

async function Panel({ consulta }: { consulta: Promise<Consulta> }) {
  await connection();
  const [parametros, acceso] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
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
    return <p>No hay un destino administrado para esta selección.</p>;
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
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-teal-200 bg-teal-50 p-2 text-center text-xs font-semibold sm:static sm:flex sm:gap-4 sm:rounded-xl sm:border-0 sm:p-3 sm:text-sm"
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
        href={`${ruta}?${filtro}#atractivos`}
        aria-label="Mis atractivos"
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
      <Link className="py-2" href={`${ruta}?${filtro}#resenas-recientes`}>
        Reseñas
      </Link>
    </nav>
  );
  if (vistaQr)
    return (
      <>
        {navegacion}
        <h2 className="text-2xl font-bold">QR dinámico · {destino.nombre}</h2>
        <PantallaQr key={destino.slug} slug={destino.slug} />
      </>
    );
  const respuesta = await solicitarVisitas<Estadisticas>(
    `/visitas/administracion/${slug}/estadisticas?meses=${meses}`,
  );
  if (!respuesta.ok) {
    return (
      <div className="space-y-3">
        {navegacion}
        <p role="alert">{respuesta.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }
  const datos = respuesta.datos;
  const pico = datos.tendencia.reduce(
    (mayor, periodo) => (periodo.total > mayor.total ? periodo : mayor),
    { mes: "", total: 0 },
  );

  return (
    <>
      {navegacion}
      <form
        id="atractivos"
        key={filtro.toString()}
        action={ruta}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid gap-1">
          Atractivo
          <select
            name="destino"
            aria-label="Atractivo"
            defaultValue={destino.slug}
            className="w-full max-w-72 rounded border p-2"
          >
            {acceso.datos.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Período
          <select
            name="meses"
            aria-label="Período"
            defaultValue={meses}
            className="rounded border p-2"
          >
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
          </select>
        </label>
        <button className="rounded border px-4 py-2 font-semibold">
          Aplicar
        </button>
        <BotonActualizarPanel />
      </form>
      <p role="status" className="text-sm">
        Última actualización:{" "}
        <time dateTime={datos.actualizadoEn}>
          {fechaVisita.format(new Date(datos.actualizadoEn))}
        </time>
      </p>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Visitas verificadas por QR", datos.totalVisitas],
          [
            "Calificación promedio",
            datos.promedio?.toFixed(1) ?? "Sin calificaciones",
          ],
          ["Reseñas recibidas", datos.totalResenas],
        ].map(([titulo, valor]) => (
          <div key={titulo} className="rounded-xl border bg-white p-5">
            <dt>{titulo}</dt>
            <dd className="text-2xl font-bold text-teal-950">{valor}</dd>
          </div>
        ))}
      </dl>
      {datos.totalVisitas === 0 && datos.totalResenas === 0 && (
        <p>Aún no hay visitas ni reseñas para este período.</p>
      )}
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-bold">Visitas por mes</h2>
        <ul className="space-y-2">
          {datos.tendencia.map(({ mes, total }) => (
            <li
              key={mes}
              className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2"
            >
              <span>{formatoMes.format(new Date(`${mes}-01T00:00:00Z`))}</span>
              <meter
                min={0}
                max={Math.max(1, pico.total)}
                value={total}
                aria-label={`Visitas en ${mes}`}
                className="w-full"
              />
              <span className="text-right">{total}</span>
            </li>
          ))}
        </ul>
        <p>Total del período: {datos.totalVisitas}</p>
        {pico.total > 0 && (
          <p>
            <strong>Lectura del período.</strong>{" "}
            {formatoMes.format(new Date(`${pico.mes}-01T00:00:00Z`))} concentró
            el {Math.round((100 * pico.total) / datos.totalVisitas)} % de las
            visitas.
          </p>
        )}
        {datos.recientes.length > 0 && (
          <p>
            El promedio de las últimas {datos.recientes.length} reseñas es{" "}
            {(
              datos.recientes.reduce(
                (suma, resena) => suma + resena.calificacion,
                0,
              ) / datos.recientes.length
            ).toFixed(1)}{" "}
            de 5.
          </p>
        )}
      </section>
      <section
        id="resenas-recientes"
        className="space-y-3 rounded-xl border bg-white p-5"
      >
        <h2 className="text-xl font-bold">Reseñas recientes</h2>
        {datos.recientes.length === 0 && (
          <p>Aún no hay reseñas para este período.</p>
        )}
        <ul className="divide-y divide-stone-200">
          {datos.recientes.map((resena) => (
            <li key={resena.id} className="space-y-1 py-3">
              <p className="font-semibold">
                {resena.usuario.nombreCompleto} · {resena.calificacion} de 5 ★
              </p>
              <p className="text-sm">
                {fechaVisita.format(new Date(resena.creadaEn))} ·{" "}
                {resena.verificada
                  ? "Visita verificada por QR"
                  : "Sin verificación"}
              </p>
              <p className="wrap-anywhere">{resena.comentario}</p>
              <ReportarResena id={resena.id} />
            </li>
          ))}
        </ul>
        {datos.totalResenas > datos.recientes.length && (
          <Link
            href={`/administracion/resenas?destino=${slug}`}
            className="font-semibold underline"
          >
            Ver todas
          </Link>
        )}
      </section>
    </>
  );
}

export default function PaginaEstadisticas({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-5 pt-8 pb-24 sm:pb-8">
      <h1 className="text-3xl font-bold text-teal-950">
        Estadísticas del atractivo
      </h1>
      <Suspense fallback={<p role="status">Cargando estadísticas…</p>}>
        <Panel consulta={searchParams} />
      </Suspense>
    </main>
  );
}
