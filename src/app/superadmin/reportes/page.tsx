import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { RevisarReporte } from "@/features/administracion/controles-reporte";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";
import type { Resena } from "@/features/resenas/tipos";

type Consulta = { estado?: string; pagina?: string };
type Listado = {
  reportes: {
    id: string;
    motivo: string;
    creadoEn: string;
    revisadoEn: string | null;
    decision: "mantener" | "retirar" | null;
    motivoDecision: string | null;
    resena: Pick<
      Resena,
      "id" | "comentario" | "calificacion" | "destino" | "usuario"
    >;
  }[];
  hayMas: boolean;
};

async function Bandeja({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel(true))) return null;
  const { estado, pagina } = await consulta;
  const revisados = estado === "revisados";
  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const filtro = `estado=${revisados ? "revisados" : "pendientes"}`;
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
            href={`?estado=${id}`}
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
          {respuesta.datos.reportes.length ? (
            <ul className="divide-y divide-[#dce3da] rounded-2xl border border-[#dce3da] bg-white">
              {respuesta.datos.reportes.map(
                ({
                  id,
                  resena,
                  motivo,
                  creadoEn,
                  revisadoEn,
                  decision,
                  motivoDecision,
                }) => (
                  <li key={id} className="space-y-3 p-5">
                    <p className="font-semibold">
                      {resena.destino.nombre} · {resena.calificacion} de 5
                    </p>
                    <p className="wrap-anywhere text-sm">
                      {resena.usuario.nombreCompleto} · {resena.comentario}
                    </p>
                    <div className="rounded-xl bg-[#edf3ec] p-3 text-sm">
                      <p className="font-semibold">Motivo del reporte</p>
                      <p className="wrap-anywhere">{motivo}</p>
                    </div>
                    <p className="text-xs text-[#4d665b]">
                      Recibido {fechaVisita.format(new Date(creadoEn))}
                      {revisadoEn &&
                        ` · Revisado ${fechaVisita.format(new Date(revisadoEn))}`}
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
                    {!revisadoEn && <RevisarReporte id={id} />}
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
