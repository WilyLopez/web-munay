"use client";

import { useActionState, useState } from "react";
import { reportarResena, revisarReporte } from "./reportes-acciones";

const boton =
  "rounded-lg border border-[#bdcfc2] px-3 py-2 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60";
const inicial = { mensaje: "", ok: false };

export function ReportarResena({ id }: { id: string }) {
  const [motivo, cambiarMotivo] = useState("");
  const [estado, enviar, pendiente] = useActionState(
    reportarResena.bind(null, id),
    inicial,
  );
  if (estado.ok)
    return (
      <p role="status" className="text-sm font-semibold text-green-900">
        {estado.mensaje}
      </p>
    );
  return (
    <details className="mt-3">
      <summary className="w-fit cursor-pointer rounded-md py-1 text-sm font-semibold text-[#315e4d] underline underline-offset-4">
        Reportar reseña
      </summary>
      <form
        action={enviar}
        className="mt-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Motivo del reporte
          <textarea
            name="motivo"
            minLength={10}
            maxLength={500}
            required
            rows={3}
            value={motivo}
            onChange={(evento) => cambiarMotivo(evento.target.value)}
            className="w-full rounded-lg border border-[#bdcfc2] bg-white px-3 py-2 font-normal"
          />
        </label>
        <p className="text-sm">
          El SuperAdmin recibirá el motivo. La reseña seguirá visible mientras
          se revisa.
        </p>
        <button className={boton} disabled={pendiente}>
          {pendiente ? "Enviando…" : "Confirmar y enviar reporte"}
        </button>
        {estado.mensaje && (
          <p role="alert" className="text-sm text-rose-900">
            {estado.mensaje}
          </p>
        )}
      </form>
    </details>
  );
}

export function RevisarReporte({
  id,
  alertaAutomatica,
}: {
  id: string;
  alertaAutomatica?: boolean;
}) {
  const [decision, cambiar] = useState<"mantener" | "retirar" | null>(null);
  const [motivo, cambiarMotivo] = useState("");
  const [estado, revisar, pendiente] = useActionState(
    revisarReporte.bind(null, id),
    inicial,
  );
  const retirar = decision === "retirar";
  return decision ? (
    <form
      action={revisar}
      className={`space-y-3 rounded-xl border p-4 ${retirar ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}
    >
      <input type="hidden" name="decision" value={decision} />
      <p className="text-sm">
        {retirar
          ? "¿Retirar esta reseña? Dejará de aparecer en el sitio público y en las calificaciones. Los reportes pendientes de esta reseña se cerrarán."
          : alertaAutomatica
            ? "¿Aprobar esta reseña? Seguirá publicada y se habilitará la acreditación de puntos."
            : "¿Mantener la reseña publicada? Este reporte pasará al historial."}
      </p>
      {retirar && (
        <label className="grid gap-1 text-sm font-semibold">
          Motivo del retiro
          <textarea
            name="motivo"
            rows={3}
            minLength={10}
            maxLength={500}
            required
            value={motivo}
            onChange={(evento) => cambiarMotivo(evento.target.value)}
            className="rounded-lg border border-rose-200 bg-white px-3 py-2 font-normal"
          />
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={boton}
          disabled={pendiente}
          onClick={() => cambiar(null)}
        >
          Cancelar
        </button>
        <button
          className={
            retirar
              ? `${boton} bg-rose-800 text-white hover:bg-rose-900`
              : boton
          }
          disabled={pendiente}
        >
          {pendiente
            ? "Guardando…"
            : retirar
              ? "Confirmar retiro"
              : "Confirmar publicación"}
        </button>
      </div>
      {estado.mensaje && (
        <p role={estado.ok ? "status" : "alert"}>{estado.mensaje}</p>
      )}
    </form>
  ) : (
    <div className="flex flex-wrap gap-2">
      <button className={boton} onClick={() => cambiar("mantener")}>
        {alertaAutomatica ? "Aprobar reseña" : "Mantener publicada"}
      </button>
      <button
        className={`${boton} text-rose-900`}
        onClick={() => cambiar("retirar")}
      >
        Retirar reseña
      </button>
    </div>
  );
}
