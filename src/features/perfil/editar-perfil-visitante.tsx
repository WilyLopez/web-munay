"use client";

import { useActionState, useRef, useState } from "react";
import { actualizarPerfilVisitante } from "./acciones";

export function EditarPerfilVisitante({
  nombre,
  correo,
}: {
  nombre: string;
  correo: string;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const [estado, guardar, pendiente] = useActionState(
    actualizarPerfilVisitante,
    { ok: false, mensaje: "" },
  );
  const [valor, cambiarValor] = useState(nombre);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          cambiarValor(nombre);
          modal.current?.showModal();
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#b7ccbc] bg-white px-4 text-sm font-semibold text-[#174238] hover:bg-[#edf4ed] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Editar perfil
      </button>
      <dialog
        ref={modal}
        aria-labelledby="editar-perfil-visitante"
        onCancel={(evento) => {
          if (pendiente) evento.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-[#d5e0d6] bg-white p-5 text-[#14382e] shadow-xl backdrop:bg-black/45 sm:p-7"
      >
        <h2 id="editar-perfil-visitante" className="font-serif text-2xl">
          Tu perfil en Munay
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Este nombre se muestra junto a tus reseñas y respuestas públicas.
        </p>
        <form action={guardar} className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm font-semibold">
            Nombre y apellidos
            <input
              name="nombreCompleto"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={valor}
              onChange={(evento) => cambiarValor(evento.target.value)}
              readOnly={pendiente}
              className="min-h-12 rounded-xl border border-[#b7ccbc] px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-teal-900 sm:text-sm"
            />
          </label>
          <div className="space-y-1 rounded-xl bg-[#f0f5ef] p-3">
            <p className="text-sm font-semibold">Correo de acceso</p>
            <p className="wrap-anywhere text-sm text-stone-700">{correo}</p>
            <p className="text-xs text-stone-600">
              Solo visible para ti en esta sección.
            </p>
          </div>
          {estado.mensaje && (
            <p
              role={estado.ok ? "status" : "alert"}
              className={`rounded-xl p-3 text-sm ${estado.ok ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}
            >
              {estado.mensaje}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => modal.current?.close()}
              className="min-h-11 rounded-xl border border-[#b7ccbc] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60"
            >
              {estado.ok ? "Cerrar" : "Cancelar"}
            </button>
            <button
              disabled={pendiente || valor.trim() === nombre}
              className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-60"
            >
              {pendiente ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
