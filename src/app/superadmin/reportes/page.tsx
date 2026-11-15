import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { RevisarReporte } from "@/features/administracion/controles-reporte";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";
import type { Resena } from "@/features/resenas/tipos";

type Consulta = {
  estado?: string;
  pagina?: string;
  origen?: string;
  destino?: string;
  nivel?: string;
};
type Listado = {
  reportes: {
    id: string;
    motivo: string;
    riesgo: number | null;
    creadoEn: string;
    revisadoEn: string | null;
    decision: "mantener" | "retirar" | null;
    motivoDecision: string | null;
    resena: Pick<
      Resena,
      | "id"
      | "comentario"
      | "calificacion"
      | "destino"
      | "usuario"
      | "verificada"
    >;
  }[];
  hayMas: boolean;
  pendientesAutomaticos: number;
  revisadosHoy: number;
  destinos: Resena["destino"][];
  umbral: number;
};

async function Bandeja({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel(true))) return null;
  const { estado, pagina, origen, destino, nivel } = await consulta;
  const revisados = estado === "revisados";
  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const filtro = new URLSearchParams({
    estado: revisados ? "revisados" : "pendientes",
  });
  if (typeof origen === "string") filtro.set("origen", origen);
  if (typeof destino === "string") filtro.set("destino", destino);
  if (typeof nivel === "string") filtro.set("nivel", nivel);
  const respuesta = await solicitarVisitas<Listado>(
    `/reportes-resenas?${filtro}&pagina=${actual}`,
  );
  return (
    <>
      <nav aria-label="Estado de reportes" className="flex flex-wrap gap-2">
        {(
          [
            ["pendientes", "Pendientes"],
            ["revisados", "Revisados"],
          ] as const
        ).map(([id, etiqueta]) => (
          <Link
            key={id}
            href={`?${new URLSearchParams({ ...Object.fromEntries(filtro), estado: id })}`}
            aria-current={
              (revisados ? "revisados" : "pendientes") === id
                ? "page"
                : undefined
            }
            className="rounded-full border border-[#bdcfc2] bg-white px-4 py-2 text-sm font-semibold aria-[current=page]:bg-[#dbece0]"
          >
            {etiqueta}
          </Link>
        ))}
      </nav>
      {!respuesta.ok ? (
        <p role="alert">{respuesta.mensaje}</p>
      ) : (
        <>
          {typeof respuesta.datos.umbral === "number" && (
            <section
              aria-label="Resumen de alertas automáticas"
              className="flex flex-wrap gap-4 rounded-xl border border-[#dce3da] bg-white px-4 py-3 text-sm"
            >
              <p>
                <strong>{respuesta.datos.pendientesAutomaticos}</strong> alertas
                automáticas pendientes
              </p>
              <p>
                <strong>{respuesta.datos.revisadosHoy}</strong> revisadas hoy
              </p>
              <p>
                Umbral de alerta: más de{" "}
                <strong>{respuesta.datos.umbral}/100</strong>
              </p>
            </section>
          )}
          <form
            action="/superadmin/reportes"
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#dce3da] bg-white p-4"
          >
            <input
              type="hidden"
              name="estado"
              value={revisados ? "revisados" : "pendientes"}
            />
            <label className="grid gap-1 text-sm font-semibold">
              Origen
              <select
                name="origen"
                defaultValue={origen ?? ""}
                className="rounded-lg border border-stone-300 px-2 py-2"
              >
                <option value="">Todos</option>
                <option value="automatico">Alertas automáticas</option>
                <option value="manual">Reportes manuales</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Atractivo
              <select
                name="destino"
                defaultValue={destino ?? ""}
                className="max-w-64 rounded-lg border border-stone-300 px-2 py-2"
              >
                <option value="">Todos</option>
                {respuesta.datos.destinos?.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Riesgo
              <select
                name="nivel"
                defaultValue={nivel ?? ""}
                className="rounded-lg border border-stone-300 px-2 py-2"
              >
                <option value="">Cualquiera</option>
                <option value="alto">71 a 89</option>
                <option value="muy-alto">90 a 100</option>
              </select>
            </label>
            <button className="rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white">
              Aplicar filtros
            </button>
          </form>
          {respuesta.datos.reportes.length ? (
            <ul className="divide-y divide-[#dce3da] rounded-2xl border border-[#dce3da] bg-white">
              {respuesta.datos.reportes.map(
                ({
                  id,
                  resena,
                  motivo,
                  riesgo = null,
                  creadoEn,
                  revisadoEn,
                  decision,
                  motivoDecision,
                }) => (
                  <li key={id} className="space-y-3 p-5">
                    <p className="font-semibold">
                      {resena.destino.nombre} · {resena.calificacion} de 5
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2.5 py-1 ${riesgo === null ? "bg-stone-100" : "bg-amber-100 text-amber-950"}`}
                      >
                        {riesgo === null
                          ? "Reporte manual"
                          : `Alerta automática · ${riesgo}/100`}
                      </span>
                      {resena.verificada && (
                        <span className="rounded-full bg-[#edf3ec] px-2.5 py-1">
                          Visita con QR dinámico
                        </span>
                      )}
                    </div>
                    <p className="wrap-anywhere text-sm">
                      {resena.usuario.nombreCompleto} · {resena.comentario}
                    </p>
                    <div className="rounded-xl bg-[#edf3ec] p-3 text-sm">
                      <p className="font-semibold">
                        {riesgo === null
                          ? "Motivo del reporte"
                          : "Señales detectadas"}
                      </p>
                      <p className="wrap-anywhere">{motivo}</p>
                    </div>
                    <p className="text-xs text-[#4d665b]">
                      Recibido {fechaVisita.format(new Date(creadoEn))}
                      {revisadoEn &&
                        ` · Revisado ${fechaVisita.format(new Date(revisadoEn))}`}
                    </p>
                    <p className="wrap-anywhere text-xs text-[#4d665b]">
                      ID de reseña {resena.id}
                    </p>
                    {decision && (
                      <p
                        className={`text-sm font-semibold ${decision === "retirar" ? "text-rose-900" : "text-green-900"}`}
                      >
                        {decision === "retirar"
                          ? "Reseña retirada"
                          : "Publicación mantenida"}
                      </p>
                    )}
                    {motivoDecision && (
                      <p className="wrap-anywhere text-sm">
                        <span className="font-semibold">
                          Motivo del retiro{" "}
                        </span>
                        {motivoDecision}
                      </p>
                    )}
                    {!revisadoEn && (
                      <RevisarReporte
                        id={id}
                        alertaAutomatica={riesgo !== null}
                      />
                    )}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="rounded-2xl border border-[#dce3da] bg-white p-5">
              {revisados
                ? "Aún no hay reportes revisados en esta página."
                : "No hay reportes pendientes en esta página."}
            </p>
          )}
          <nav
            aria-label="Páginas de reportes"
            className="flex gap-4 text-sm font-semibold"
          >
            {actual > 1 && (
              <Link
                className="underline"
                href={`?${filtro}&pagina=${actual - 1}`}
              >
                Anterior
              </Link>
            )}
            {respuesta.datos.hayMas && (
              <Link
                className="underline"
                href={`?${filtro}&pagina=${actual + 1}`}
              >
                Siguiente
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}

export default function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="max-w-4xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">
        Reportes de reseñas
      </h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-40 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando reportes</span>
          </div>
        }
      >
        <Bandeja consulta={searchParams} />
      </Suspense>
    </main>
  );
}
