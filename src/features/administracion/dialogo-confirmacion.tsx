"use client";

import { useEffect, useRef } from "react";

export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligroso = false,
  ocupado = false,
  alConfirmar,
  alCancelar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligroso?: boolean;
  ocupado?: boolean;
  alConfirmar: () => void | Promise<void>;
  alCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierto) {
      dialogo.current?.showModal();
    } else {
      dialogo.current?.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) alCancelar();
      }}
      className="fixed inset-0 m-auto w-full max-w-md rounded-3xl border border-[#dce3da] bg-white p-0 text-[#173b32] shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
              peligroso ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-5"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <h2 className="font-serif text-xl font-bold tracking-tight">
            {titulo}
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#4d665b]">
          {mensaje}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf3ec]">
          <button
            type="button"
            disabled={ocupado}
            onClick={alCancelar}
            className="rounded-xl border border-[#ccd9cf] px-4 py-2 text-sm font-semibold text-[#173b32] hover:bg-[#edf3ec] disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void alConfirmar()}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
              peligroso
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-[#174238] hover:bg-[#23574a]"
            }`}
          >
            {ocupado ? "Procesando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
