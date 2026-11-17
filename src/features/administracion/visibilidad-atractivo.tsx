"use client";

import { useRef, useState, useTransition } from "react";
import type { EstadoFicha } from "@/features/destinos/informacion";
import { cambiarVisibilidadAtractivo } from "./ficha-operativa";

export function VisibilidadAtractivo({
  slug,
  nombre,
  estado,
}: {
  slug: string;
  nombre: string;
  estado: EstadoFicha;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const [pendiente, iniciar] = useTransition();
  const [mensaje, cambiarMensaje] = useState("");
  const [error, cambiarError] = useState(false);
  const [errorModal, cambiarErrorModal] = useState("");
  const publicado = estado === "publicada";
  const bloqueado = estado !== "publicada" && estado !== "borrador";

  function confirmar() {
    cambiarErrorModal("");
    iniciar(async () => {
      try {
        const resultado = await cambiarVisibilidadAtractivo(slug, !publicado);
        if (resultado.error) {
          cambiarErrorModal(resultado.mensaje);
          return;
        }
        cambiarError(false);
        cambiarMensaje(resultado.mensaje);
        modal.current?.close();
      } catch {
        cambiarError(true);
        cambiarErrorModal("No pudimos cambiar la visibilidad. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#d5e0d6] bg-white p-4 sm:p-5" aria-label="Visibilidad del atractivo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-semibold text-[#14382e]">Visibilidad en el sitio público</h2>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#174238]">
            <span aria-hidden="true" className={`size-2 rounded-full ${publicado ? "bg-emerald-600" : "bg-stone-400"}`} />
            {publicado ? "Habilitado para los visitantes" : "Fuera del sitio público"}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-700">
            {bloqueado
              ? "La ficha está en revisión o archivada. Contacta al equipo de Munay para cambiar su visibilidad."
              : publicado
                ? "Los visitantes pueden encontrar tu atractivo en el catálogo y consultar sus detalles."
                : "Habilita la ficha guardada para que los visitantes puedan descubrir el atractivo y consultar sus detalles."}
          </p>
        </div>
        {!bloqueado && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              cambiarErrorModal("");
              modal.current?.showModal();
            }}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 ${publicado ? "border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100" : "bg-[#174238] text-white hover:bg-[#23574a]"}`}
          >
            {publicado ? "Deshabilitar" : "Habilitar en el sitio público"}
          </button>
        )}
      </div>
      {mensaje && (
        <p role={error ? "alert" : "status"} className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">{mensaje}</p>
      )}
      <dialog
        ref={modal}
        aria-labelledby="titulo-visibilidad"
        aria-describedby="descripcion-visibilidad"
        onCancel={(evento) => { if (pendiente) evento.preventDefault(); }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[#d5e0d6] bg-white p-5 text-[#14382e] shadow-xl backdrop:bg-black/45 sm:p-7"
      >
        <h2 id="titulo-visibilidad" className="font-serif text-2xl">
          {publicado ? "¿Deshabilitar este atractivo?" : "¿Habilitar este atractivo?"}
        </h2>
        <p className="mt-2 wrap-anywhere font-semibold">{nombre}</p>
        <p id="descripcion-visibilidad" className="mt-3 text-sm leading-relaxed text-stone-700">
          {publicado
            ? "Dejará de aparecer en el catálogo, el mapa y sus detalles públicos. El QR dejará de admitir nuevas verificaciones. Podrás editar su ficha y habilitarla nuevamente."
            : "La ficha guardada estará disponible para todos los visitantes, incluso sin iniciar sesión. También se habilitará el QR de visitas. Revisa que la información sea correcta antes de confirmar."}
        </p>
        {!publicado && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
            Publicar la ficha no otorga la insignia de verificación de Munay.
          </p>
        )}
        {errorModal && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-950">{errorModal}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pendiente}
            autoFocus
            onClick={() => modal.current?.close()}
            className="min-h-11 rounded-xl border border-[#bdcfc2] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={confirmar}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60 ${publicado ? "bg-amber-800 hover:bg-amber-900" : "bg-[#174238] hover:bg-[#23574a]"}`}
          >
            {pendiente ? "Guardando…" : publicado ? "Sí, deshabilitar" : "Sí, habilitar"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
