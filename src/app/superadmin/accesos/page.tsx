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
  pendiente: "bg-amber-100 text-amber-950",
  aprobada: "bg-green-100 text-green-950",
  rechazada: "bg-rose-100 text-rose-950",
  revocada: "bg-stone-100 text-stone-900",
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
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1fr)]">
      <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
        <h2 className="font-serif text-2xl">Invitar por correo</h2>
        <p className="text-sm text-[#4d665b]">
          El enlace se vincula a un atractivo y al correo indicado. Expira a las
          72 horas.
        </p>
        {destinos.ok ? (
          destinos.datos.length ? (
            <FormularioInvitacion destinos={destinos.datos} />
          ) : (
            <p>No hay atractivos disponibles para invitar a un encargado.</p>
          )
        ) : (
          <div className="space-y-2">
            <p role="alert">{destinos.mensaje}</p>
            <BotonActualizarPanel reintentar />
          </div>
        )}
      </section>
      <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
        <h2 className="font-serif text-2xl">Solicitudes e invitaciones</h2>
        <nav aria-label="Estado del acceso" className="flex flex-wrap gap-2">
          {(
            [
              ["pendientes", "Pendientes"],
              ["resueltos", "Resueltos"],
              ["todos", "Todos"],
            ] as const
          ).map(([id, etiqueta]) => (
            <Link
              key={id}
              href={`?estado=${id}`}
              aria-current={filtro === id ? "page" : undefined}
              className="rounded-full border border-[#ccd9cf] px-3 py-1.5 text-sm font-semibold hover:bg-[#edf3ec] aria-[current=page]:bg-[#dbece0]"
            >
              {etiqueta}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-[#4d665b]">
          Antes de aprobar, comprueba el vínculo del solicitante mediante un
          canal oficial del atractivo.
        </p>
        {!registros.ok ? (
          <div className="space-y-2">
            <p role="alert">{registros.mensaje}</p>
            <BotonActualizarPanel reintentar />
          </div>
        ) : (
          <>
            {registros.datos.filas.length ? (
              <ul className="divide-y divide-[#dce3da]">
                {registros.datos.filas.map((fila) => {
                  const { vencida } = fila;
                  return (
                    <li key={fila.id} className="space-y-3 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {fila.destino?.nombre ??
                              fila.propuesta?.nombre ??
                              "Atractivo retirado"}
                          </h3>
                          <p className="wrap-anywhere text-sm text-[#4d665b]">
                            {fila.correo}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${vencida ? colores.revocada : colores[fila.estado]}`}
                        >
                          {vencida ? "Vencida" : estados[fila.estado]}
                        </span>
                      </div>
                      <p className="text-xs text-[#4d665b]">
                        {fila.tipo === "invitacion"
                          ? "Invitación"
                          : "Solicitud"}{" "}
                        · {fechaVisita.format(new Date(fila.creadoEn))}
                      </p>
                      {fila.propuesta && (
                        <div className="space-y-1 rounded-xl bg-[#f4f5ef] p-3 text-sm">
                          <p className="font-semibold">
                            Propuesta de nuevo atractivo
                          </p>
                          <p>
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
                          <p className="wrap-anywhere">
                            {fila.propuesta.ubicacion} ·{" "}
                            {fila.propuesta.latitud}, {fila.propuesta.longitud}
                          </p>
                          <p className="wrap-anywhere whitespace-pre-wrap">
                            {fila.propuesta.descripcion}
                          </p>
                        </div>
                      )}
                      {fila.motivo && (
                        <p className="wrap-anywhere text-sm">
                          <strong>Vínculo declarado </strong>
                          {fila.motivo}
                        </p>
                      )}
                      {fila.contacto && (
                        <p className="wrap-anywhere text-sm">
                          <strong>Contacto de referencia </strong>
                          {fila.contacto}
                        </p>
                      )}
                      {fila.observacion && (
                        <p className="wrap-anywhere text-sm">
                          <strong>Observación </strong>
                          {fila.observacion}
                        </p>
                      )}
                      {fila.venceEn && (
                        <p className="text-xs text-[#4d665b]">
                          Vencimiento{" "}
                          {fechaVisita.format(new Date(fila.venceEn))}
                        </p>
                      )}
                      {fila.estado === "pendiente" && !vencida && (
                        <DecisionAcceso fila={fila} />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-[#f4f5ef] p-4 text-sm">
                Todavía no hay registros en esta página.
              </p>
            )}
            <nav
              aria-label="Páginas de accesos"
              className="flex flex-wrap gap-4 text-sm font-semibold"
            >
              {actual > 1 && (
                <Link
                  href={`?estado=${filtro}&pagina=${actual - 1}`}
                  className="underline underline-offset-4"
                >
                  Anterior
                </Link>
              )}
              {registros.datos.hayMas && (
                <Link
                  href={`?estado=${filtro}&pagina=${actual + 1}`}
                  className="underline underline-offset-4"
                >
                  Siguiente
                </Link>
              )}
            </nav>
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
    <main className="space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">
        Accesos de encargados
      </h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-48 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
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
