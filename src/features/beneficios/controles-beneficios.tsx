"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarEstadoBeneficio,
  consultarHistorialBeneficio,
} from "./acciones";
import type { AuditoriaBeneficio, Beneficio } from "./tipos";
const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-50";
const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});
export function ControlEstadoBeneficio({
  beneficio,
}: {
  beneficio: Beneficio;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  const puedeReanudar =
    beneficio.estado === "pausado" &&
    beneficio.aprobadoRevision === beneficio.revision &&
    beneficio.estadoVista !== "vencido";
  if (!beneficio.activo && !puedeReanudar) return null;
  const pausar = beneficio.activo;
  return (
    <>
      <button
        type="button"
        className={boton}
        onClick={() => dialogo.current?.showModal()}
      >
        {pausar ? "Pausar oferta" : "Reanudar oferta"}
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby={`estado-${beneficio.id}`}
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-[#c7d7cb] bg-white p-6 text-[#14382e] shadow-xl backdrop:bg-black/40"
        onCancel={(e) => {
          if (pendiente) e.preventDefault();
        }}
      >
        <h3 id={`estado-${beneficio.id}`} className="text-xl font-semibold">
          {pausar
            ? "¿Pausar este beneficio?"
            : "¿Reanudar esta oferta aprobada?"}
        </h3>
        <p className="mt-3 text-sm leading-relaxed">
          {pausar
            ? "Dejará de aceptar nuevos canjes inmediatamente. Los comprobantes que ya entregaste seguirán siendo válidos con sus condiciones originales."
            : "Los visitantes podrán volver a canjear esta oferta si tiene cupos y está vigente. Se mantienen las condiciones aprobadas."}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-900">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pendiente}
            className={boton}
            onClick={() => dialogo.current?.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pendiente}
            className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
            onClick={() =>
              iniciar(async () => {
                try {
                  const resultado = await cambiarEstadoBeneficio(
                    beneficio.id,
                    pausar ? "pausar" : "reanudar",
                    beneficio.revision,
                  );
                  if (resultado.ok) {
                    dialogo.current?.close();
                    router.refresh();
                  } else cambiarError(resultado.mensaje);
                } catch {
                  cambiarError(
                    "No pudimos confirmar el cambio. Actualiza para comprobar su estado antes de reintentar.",
                  );
                }
              })
            }
          >
            {pendiente
              ? "Guardando…"
              : pausar
                ? "Sí, pausar oferta"
                : "Sí, reanudar oferta"}
          </button>
        </div>
      </dialog>
    </>
  );
}
const etiquetas: Record<string, string> = {
  nombre: "Nombre",
  costo: "Costo en puntos",
  disponibles: "Cupos disponibles",
  estado: "Estado",
  condiciones: "Condiciones",
  tipo: "Tipo",
  valor: "Valor configurado",
  exclusiones: "Exclusiones",
  horario: "Horario",
  iniciaEn: "Inicio",
  venceEn: "Vencimiento",
  limitePorPersona: "Límite por visitante",
  consumoMinimo: "Consumo mínimo",
  reservaPrevia: "Reserva previa",
  acumulable: "Acumulable",
  dias: "Días de uso",
};
const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
function mostrarCambio(
  clave: string,
  valor: unknown,
  contexto: Record<string, unknown>,
) {
  if (clave === "consumoMinimo" && typeof valor === "number")
    return soles.format(valor / 100);
  if (clave === "valor" && typeof valor === "number")
    return contexto.tipo === "IMPORTE"
      ? soles.format(valor / 100)
      : `${valor} %`;
  if (["iniciaEn", "venceEn"].includes(clave) && typeof valor === "string")
    return fecha.format(new Date(valor));
  if (clave === "dias" && Array.isArray(valor))
    return valor.length
      ? valor
          .map(
            (dia) =>
              [
                "domingo",
                "lunes",
                "martes",
                "miércoles",
                "jueves",
                "viernes",
                "sábado",
              ][Number(dia)],
          )
          .join(", ")
      : "Todos los días";
  if (clave === "tipo" && typeof valor === "string")
    return (
      (
        {
          PORCENTAJE: "Descuento porcentual",
          IMPORTE: "Descuento en soles",
          ENTRADA: "Entrada",
          EXPERIENCIA: "Experiencia",
        } as Record<string, string>
      )[valor] ?? valor
    );
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return valor === null ? "Sin límite / no aplica" : String(valor);
}
function CambiosAuditoria({ cambios }: { cambios: unknown }) {
  if (!cambios || typeof cambios !== "object") return null;
  const objeto = cambios as { antes?: unknown; despues?: unknown };
  if (typeof objeto.despues === "string")
    return (
      <p className="text-xs text-[#526a60]">
        Estado: {String(objeto.antes)} → {objeto.despues}
      </p>
    );
  if (!objeto.despues || typeof objeto.despues !== "object") return null;
  const antes =
    objeto.antes && typeof objeto.antes === "object"
      ? (objeto.antes as Record<string, unknown>)
      : {};
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer py-2 font-semibold">
        Ver cambios registrados
      </summary>
      <dl className="mt-2 space-y-2">
        {Object.entries(objeto.despues)
          .filter(
            ([clave, valor]) =>
              etiquetas[clave] &&
              JSON.stringify(antes[clave]) !== JSON.stringify(valor),
          )
          .map(([clave, valor]) => (
            <div key={clave}>
              <dt className="font-semibold">{etiquetas[clave]}</dt>
              <dd className="mt-1 whitespace-pre-wrap wrap-anywhere text-[#526a60]">
                {mostrarCambio(
                  clave,
                  valor,
                  objeto.despues as Record<string, unknown>,
                )}
              </dd>
            </div>
          ))}
      </dl>
    </details>
  );
}
export function HistorialBeneficio({ id }: { id: string }) {
  const [datos, cambiarDatos] = useState<AuditoriaBeneficio>();
  const [pagina, cambiarPagina] = useState(1);
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  function cargar(numero: number) {
    iniciar(async () => {
      try {
        const resultado = await consultarHistorialBeneficio(id, numero);
        if (resultado.ok) {
          cambiarDatos(resultado.datos);
          cambiarPagina(numero);
          cambiarError("");
        } else cambiarError(resultado.mensaje);
      } catch {
        cambiarError("No pudimos cargar el historial. Inténtalo de nuevo.");
      }
    });
  }
  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open && !datos && !pendiente) cargar(1);
      }}
      className="border-t border-[#e5ebe2] pt-2"
    >
      <summary className="cursor-pointer py-2 text-sm font-semibold">
        Historial de cambios y entregas
      </summary>
      {pendiente && (
        <p role="status" className="py-3 text-sm">
          Cargando historial…
        </p>
      )}
      {datos && (
        <ul className="mt-2 divide-y divide-[#e5ebe2]">
          {datos.registros.map((fila) => (
            <li key={fila.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                <p className="font-semibold">
                  {{
                    crear: "Propuesta creada",
                    editar: "Condiciones modificadas",
                    aprobar: "Oferta aprobada",
                    pausar: "Oferta pausada",
                    reanudar: "Oferta reanudada",
                    entregar: "Beneficio entregado",
                  }[fila.accion] ?? fila.accion}
                </p>
                <time
                  className="text-xs text-[#526a60]"
                  dateTime={fila.creadaEn}
                >
                  {fecha.format(new Date(fila.creadaEn))}
                </time>
              </div>
              <p className="mt-1 text-xs text-[#526a60]">
                Por {fila.actor.nombreCompleto}
              </p>
              <CambiosAuditoria cambios={fila.cambios} />
            </li>
          ))}
        </ul>
      )}
      {datos?.registros.length === 0 && (
        <p className="py-3 text-sm text-[#526a60]">
          Aún no hay cambios registrados desde la activación de este historial.
        </p>
      )}
      {datos && (pagina > 1 || datos.hayMas) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            disabled={pendiente || pagina === 1}
            className={boton}
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span>Página {pagina}</span>
          <button
            type="button"
            disabled={pendiente || !datos.hayMas}
            className={boton}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
      {error && (
        <div>
          <p role="alert" className="text-sm text-rose-900">
            {error}
          </p>
          <button
            type="button"
            className={boton}
            disabled={pendiente}
            onClick={() => cargar(pagina)}
          >
            Reintentar
          </button>
        </div>
      )}
    </details>
  );
}
