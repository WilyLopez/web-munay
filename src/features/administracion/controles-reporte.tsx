"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/lib/use-toast";
import { reportarResena, revisarReporte } from "./reportes-acciones";

const categoriasReporte = [
  { id: "ofensivo", etiqueta: "Contenido ofensivo o difamación" },
  { id: "spam", etiqueta: "Publicidad, spam o enlaces no autorizados" },
  { id: "no_visito", etiqueta: "El visitante nunca estuvo en el atractivo" },
  { id: "extorsion", etiqueta: "Conflicto de interés o extorsión" },
  { id: "otro", etiqueta: "Otro motivo detallado" },
] as const;

export function ReportarResena({ id }: { id: string }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [categoria, setCategoria] = useState<string>("ofensivo");
  const [motivo, setMotivo] = useState("");
  const [reportado, setReportado] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierto) {
      dialogo.current?.showModal();
    } else {
      dialogo.current?.close();
    }
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    setMotivo("");
  };

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (motivo.trim().length < 10) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoria", categoria);
      formData.set("motivo", motivo.trim());

      const res = await reportarResena(id, { mensaje: "", ok: false }, formData);
      if (res.ok) {
        setReportado(true);
        cerrar();
        toast.exito("Reporte enviado. El SuperAdmin revisará esta reseña.");
      } else {
        toast.error(res.mensaje || "No se pudo enviar el reporte.");
      }
    });
  };

  if (reportado) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900 border border-amber-200">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4 shrink-0"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v5m0 3h.01" />
        </svg>
        <span>Reporte enviado al SuperAdmin · Pendiente de evaluación</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/70 px-4 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-4"
          aria-hidden="true"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Reportar irregularidad
      </button>

      <dialog
        ref={dialogo}
        onCancel={(e) => {
          e.preventDefault();
          if (!pendiente) cerrar();
        }}
        className="fixed inset-0 m-auto w-full max-w-lg rounded-3xl border border-[#dce3da] bg-white p-0 text-[#173b32] shadow-2xl backdrop:bg-black/50"
      >
        <form onSubmit={enviar} className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf3ec] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </span>
              <h2 className="font-serif text-lg font-bold">
                Reportar reseña al SuperAdmin
              </h2>
            </div>
            <button
              type="button"
              disabled={pendiente}
              onClick={cerrar}
              className="rounded-lg p-1 text-[#4d665b] hover:bg-[#edf3ec]"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              >
                <path d="m6 6 8 8m0-8-8 8" />
              </svg>
            </button>
          </div>

          <p className="text-xs leading-relaxed text-[#4d665b]">
            Si consideras que esta opinión infringe las directrices de la
            plataforma, repórtala. La reseña permanecerá visible mientras el
            SuperAdmin evalúa el caso.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#173b32]">
              Categoría de la infracción
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-xl border border-[#ccd9cf] bg-white px-3 py-2 text-xs font-medium text-[#173b32] outline-none focus:border-[#174238]"
            >
              {categoriasReporte.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#173b32]">
                Detalle del motivo
              </label>
              <span
                className={`text-[11px] ${
                  motivo.length < 10
                    ? "text-amber-800 font-medium"
                    : "text-teal-800 font-semibold"
                }`}
              >
                {motivo.length} / 500 caracteres (mínimo 10)
              </span>
            </div>
            <textarea
              required
              rows={3}
              minLength={10}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica detalladamente por qué esta reseña debe ser revisada o retirada..."
              className="w-full rounded-xl border border-[#ccd9cf] bg-white p-3 text-xs leading-relaxed outline-none focus:border-[#174238]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#edf3ec] pt-3">
            <button
              type="button"
              disabled={pendiente}
              onClick={cerrar}
              className="rounded-xl border border-[#ccd9cf] px-4 py-2 text-xs font-semibold text-[#173b32] hover:bg-[#edf3ec] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendiente || motivo.trim().length < 10}
              className="rounded-xl bg-[#174238] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#23574a] disabled:opacity-50"
            >
              {pendiente ? "Enviando reporte..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function RevisarReporte({
  id,
  alertaAutomatica,
}: {
  id: string;
  alertaAutomatica?: boolean;
}) {
  const toast = useToast();
  const [modalRetiro, setModalRetiro] = useState(false);
  const [modalMantener, setModalMantener] = useState(false);
  const [motivoRetiro, setMotivoRetiro] = useState("");
  const [resuelto, setResuelto] = useState<"retirada" | "mantenida" | null>(
    null,
  );
  const [pendiente, startTransition] = useTransition();

  const dialogoRetiro = useRef<HTMLDialogElement>(null);
  const dialogoMantener = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modalRetiro) dialogoRetiro.current?.showModal();
    else dialogoRetiro.current?.close();
  }, [modalRetiro]);

  useEffect(() => {
    if (modalMantener) dialogoMantener.current?.showModal();
    else dialogoMantener.current?.close();
  }, [modalMantener]);

  const ejecutarDecision = (decision: "mantener" | "retirar", motivo = "") => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("decision", decision);
      if (motivo) formData.set("motivo", motivo);

      const res = await revisarReporte(id, { mensaje: "", ok: false }, formData);
      if (res.ok) {
        if (decision === "retirar") {
          setResuelto("retirada");
          setModalRetiro(false);
          toast.exito("Reseña retirada y puntos revertidos correctamente.");
        } else {
          setResuelto("mantenida");
          setModalMantener(false);
          toast.info("La reseña permanece publicada.");
        }
      } else {
        toast.error(res.mensaje || "No se pudo registrar la decisión.");
      }
    });
  };

  if (resuelto) {
    return (
      <div
        className={`rounded-xl p-3 text-xs font-semibold ${
          resuelto === "retirada"
            ? "bg-rose-50 text-rose-900 border border-rose-200"
            : "bg-teal-50 text-teal-900 border border-teal-200"
        }`}
      >
        {resuelto === "retirada"
          ? "Decisión aplicada: Reseña retirada del sitio público"
          : "Decisión aplicada: Reseña mantenida como pública"}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setModalMantener(true)}
          className="rounded-lg border border-[#bdcfc2] bg-white px-3 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
        >
          {alertaAutomatica ? "Aprobar publicación" : "Mantener publicada"}
        </button>
        <button
          type="button"
          onClick={() => setModalRetiro(true)}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100"
        >
          Retirar reseña
        </button>
      </div>

      <dialog
        ref={dialogoMantener}
        onCancel={(e) => {
          e.preventDefault();
          if (!pendiente) setModalMantener(false);
        }}
        className="fixed inset-0 m-auto w-full max-w-md rounded-3xl border border-[#dce3da] bg-white p-0 text-[#173b32] shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-5"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="font-serif text-lg font-bold">
              {alertaAutomatica ? "Aprobar reseña" : "Mantener reseña pública"}
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#4d665b]">
            {alertaAutomatica
              ? "La reseña continuará visible en el sitio público y se acreditarán los puntos correspondientes a la visita."
              : "Se desestimará el reporte manual y la reseña continuará pública sin penalizaciones para el autor."}
          </p>
          <div className="flex items-center justify-end gap-2.5 border-t border-[#edf3ec] pt-3">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => setModalMantener(false)}
              className="rounded-xl border border-[#ccd9cf] px-4 py-2 text-xs font-semibold hover:bg-[#edf3ec] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => ejecutarDecision("mantener")}
              className="rounded-xl bg-[#174238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#23574a] disabled:opacity-50"
            >
              {pendiente ? "Confirmando..." : "Confirmar publicación"}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={dialogoRetiro}
        onCancel={(e) => {
          e.preventDefault();
          if (!pendiente) setModalRetiro(false);
        }}
        className="fixed inset-0 m-auto w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-0 text-[#173b32] shadow-2xl backdrop:bg-black/50"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ejecutarDecision("retirar", motivoRetiro.trim());
          }}
          className="p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-800">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-5"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-rose-950">
                Confirmar retiro de reseña
              </h2>
              <p className="text-[11px] text-rose-800">Acción irreversible</p>
            </div>
          </div>

          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-950">
            La reseña dejará de mostrarse en el sitio público, se recalculará la
            calificación promedio del destino y se revertirán los puntos de
            gamificación otorgados al visitante.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#173b32]">
                Motivo formal del retiro (obligatorio)
              </label>
              <span
                className={`text-[11px] ${
                  motivoRetiro.length < 10
                    ? "text-rose-700 font-medium"
                    : "text-teal-800 font-semibold"
                }`}
              >
                {motivoRetiro.length} / 500 caracteres (mínimo 10)
              </span>
            </div>
            <textarea
              required
              rows={3}
              minLength={10}
              maxLength={500}
              value={motivoRetiro}
              onChange={(e) => setMotivoRetiro(e.target.value)}
              placeholder="Escribe la justificación del retiro para la auditoría interna..."
              className="w-full rounded-xl border border-rose-300 bg-white p-3 text-xs leading-relaxed outline-none focus:border-rose-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#edf3ec] pt-3">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => setModalRetiro(false)}
              className="rounded-xl border border-[#ccd9cf] px-4 py-2 text-xs font-semibold hover:bg-[#edf3ec] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendiente || motivoRetiro.trim().length < 10}
              className="rounded-xl bg-rose-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-900 disabled:opacity-50"
            >
              {pendiente ? "Retirando reseña..." : "Confirmar retiro"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
