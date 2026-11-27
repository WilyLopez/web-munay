import Link from "next/link";
import { Suspense } from "react";
import {
  DecisionAcceso,
  FormularioInvitacion,
} from "@/features/accesos/formularios";
import {
  estados,
  type ListadoAccesos,
  type OpcionDestino,
} from "@/features/accesos/tipos";
import { accesoPanel } from "@/features/administracion/acceso";
import { categorias, provincias } from "@/features/destinos/catalogo";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";

const colores = {
  pendiente: "bg-amber-50 text-amber-900 border border-amber-200",
  aprobada: "bg-emerald-50 text-emerald-900 border border-emerald-200",
  rechazada: "bg-rose-50 text-rose-900 border border-rose-200",
  revocada: "bg-stone-100 text-stone-800 border border-stone-200",
};

async function Gestion({
  searchParams,
}: Pick<PageProps<"/superadmin/accesos">, "searchParams">) {
  if (!(await accesoPanel(true))) return null;
  const { pagina, estado } = await searchParams;
  const filtro =
    estado === "resueltos" || estado === "todos" ? estado : "pendientes";
  const actual =
    typeof pagina === "string" && /^[1-9]\d{0,4}$/.test(pagina)
      ? Number(pagina)
      : 1;
  const [registros, destinos] = await Promise.all([
    solicitarVisitas<ListadoAccesos>(
      `/gestion-accesos?pagina=${actual}&estado=${filtro}`,
    ),
    solicitarVisitas<OpcionDestino[]>("/visitas/administracion"),
  ]);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,0.65fr)_minmax(0,1fr)]">
      <section className="space-y-4 rounded-3xl border border-[#dce3da] bg-white p-5 sm:p-6 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
            Emisión de accesos
          </span>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#14382e]">
            Invitar por correo
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#4d665b]">
            Genera un enlace oficial de gestión para un encargado. El enlace es
            exclusivo para el correo especificado y vence en 72 horas.
          </p>
        </div>

        {destinos.ok ? (
          <FormularioInvitacion destinos={destinos.datos} />
        ) : (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p role="alert" className="text-xs font-semibold text-rose-900">
              {destinos.mensaje}
            </p>
            <BotonActualizarPanel reintentar />
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-3xl border border-[#dce3da] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#edf3ec] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
              Control de gestión
            </span>
            <h2 className="mt-0.5 font-serif text-2xl font-bold text-[#14382e]">
              Solicitudes e invitaciones
            </h2>
          </div>

          <nav
            aria-label="Filtro de accesos"
            className="flex items-center gap-1 rounded-xl border border-[#d5e0d6] bg-[#fbfcf8] p-1"
          >
            {(
              [
                ["pendientes", "Pendientes"],
                ["resueltos", "Resueltos"],
                ["todos", "Todos"],
              ] as const
            ).map(([id, etiqueta]) => {
              const activo = filtro === id;
              return (
                <Link
                  key={id}
                  href={`?estado=${id}`}
                  aria-current={activo ? "page" : undefined}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    activo
                      ? "bg-[#174238] text-white shadow-xs"
                      : "text-[#526a60] hover:bg-[#edf4ed] hover:text-[#174238]"
                  }`}
                >
                  {etiqueta}
                </Link>
              );
            })}
          </nav>
        </div>

        {!registros.ok ? (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p role="alert" className="text-xs font-semibold text-rose-900">
              {registros.mensaje}
            </p>
            <BotonActualizarPanel reintentar />
          </div>
        ) : (
          <>
            {registros.datos.filas.length ? (
              <div className="space-y-3.5">
                {registros.datos.filas.map((fila) => {
                  const { vencida } = fila;
                  const esInvitacion = fila.tipo === "invitacion";
                  return (
                    <article
                      key={fila.id}
                      className="space-y-3.5 rounded-2xl border border-[#dce3da] bg-[#fbfcf8] p-4.5 transition-shadow hover:shadow-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#edf3ec] pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                esInvitacion
                                  ? "bg-teal-50 text-teal-900 border border-teal-200"
                                  : "bg-sky-50 text-sky-900 border border-sky-200"
                              }`}
                            >
                              {esInvitacion ? "Invitación oficial" : "Solicitud ciudadana"}
                            </span>
                            {!fila.destino && fila.propuesta && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 border border-emerald-200">
                                Nuevo atractivo
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-[#14382e]">
                            {fila.destino?.nombre ??
                              fila.propuesta?.nombre ??
                              "Registro para nuevo atractivo"}
                          </h3>
                          <p className="flex items-center gap-1 text-xs text-[#526a60]">
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            >
                              <rect x="3" y="4" width="14" height="12" rx="2" />
                              <path d="m3 7 7 4 7-4" />
                            </svg>
                            <span className="font-medium text-[#174238]">
                              {fila.correo}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            vencida ? colores.revocada : colores[fila.estado]
                          }`}
                        >
                          {vencida ? "Vencida" : estados[fila.estado]}
                        </span>
                      </div>

                      {fila.propuesta && (
                        <div className="space-y-1.5 rounded-xl border border-[#cbdcca] bg-[#f4f7f4] p-3 text-xs leading-relaxed text-[#234c3d]">
                          <p className="font-bold text-[#174238]">
                            Propuesta de atractivo cultural / turístico:
                          </p>
                          <p>
                            <strong>Categoría y provincia:</strong>{" "}
                            {
                              categorias[
                                fila.propuesta
                                  .categoria as keyof typeof categorias
                              ]
                            }{" "}
                            ·{" "}
                            {
                              provincias[
                                fila.propuesta
                                  .provincia as keyof typeof provincias
                              ]
                            }
                          </p>
                          <p>
                            <strong>Ubicación:</strong>{" "}
                            {fila.propuesta.ubicacion} (Lat: {fila.propuesta.latitud}, Lng: {fila.propuesta.longitud})
                          </p>
                          <p className="whitespace-pre-wrap text-[#3b5449]">
                            {fila.propuesta.descripcion}
                          </p>
                        </div>
                      )}

                      {fila.motivo && (
                        <p className="text-xs text-[#3b5449]">
                          <strong className="text-[#174238]">
                            Vínculo declarado:
                          </strong>{" "}
                          {fila.motivo}
                        </p>
                      )}

                      {fila.contacto && (
                        <p className="text-xs text-[#3b5449]">
                          <strong className="text-[#174238]">
                            Contacto de referencia:
                          </strong>{" "}
                          {fila.contacto}
                        </p>
                      )}

                      {fila.observacion && (
                        <p className="text-xs text-[#3b5449]">
                          <strong className="text-[#174238]">
                            Observación de auditoría:
                          </strong>{" "}
                          {fila.observacion}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf3ec] pt-2.5 text-[11px] text-[#526a60]">
                        <span>
                          Creado el {fechaVisita.format(new Date(fila.creadoEn))}
                        </span>
                        {fila.venceEn && fila.estado === "pendiente" && !vencida && (
                          <span className="font-semibold text-amber-800">
                            Vence el {fechaVisita.format(new Date(fila.venceEn))}
                          </span>
                        )}
                      </div>

                      {fila.estado === "pendiente" && !vencida && (
                        <div className="pt-1">
                          <DecisionAcceso fila={fila} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d5e0d6] bg-[#fbfcf8] p-8 text-center text-xs text-[#526a60]">
                <p className="font-semibold text-[#174238]">
                  No hay registros en esta sección
                </p>
                <p className="mt-1">
                  Las solicitudes e invitaciones aparecerán listadas aquí para su
                  seguimiento.
                </p>
              </div>
            )}

            {(actual > 1 || registros.datos.hayMas) && (
              <nav
                aria-label="Páginas de accesos"
                className="flex items-center justify-between pt-2 text-xs font-semibold text-[#174238]"
              >
                {actual > 1 ? (
                  <Link
                    href={`?estado=${filtro}&pagina=${actual - 1}`}
                    className="rounded-lg border border-[#ccd9cf] px-3 py-1.5 hover:bg-[#edf4ed]"
                  >
                    ← Anterior
                  </Link>
                ) : (
                  <div />
                )}
                <span>Página {actual}</span>
                {registros.datos.hayMas ? (
                  <Link
                    href={`?estado=${filtro}&pagina=${actual + 1}`}
                    className="rounded-lg border border-[#ccd9cf] px-3 py-1.5 hover:bg-[#edf4ed]"
                  >
                    Siguiente →
                  </Link>
                ) : (
                  <div />
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function PaginaAccesos({
  searchParams,
}: PageProps<"/superadmin/accesos">) {
  return (
    <main className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#526a60]">
          SuperAdmin · Munay
        </span>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#14382e] sm:text-4xl">
          Accesos y asignaciones
        </h1>
      </div>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-64 rounded-3xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando accesos</span>
          </div>
        }
      >
        <Gestion searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
