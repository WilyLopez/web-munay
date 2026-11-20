"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorBeneficio } from "./gestion";
import {
  ControlEstadoBeneficio,
  HistorialBeneficio,
} from "./controles-beneficios";
import type { Beneficio } from "./tipos";
export function EditorBeneficioModal({
  beneficio,
  destinos,
  superadmin,
  volver,
}: {
  beneficio?: Beneficio;
  destinos: Beneficio["destino"][];
  superadmin: boolean;
  volver: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [dirty, cambiarDirty] = useState(false);
  const descartar = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [dirty]);
  function cerrar() {
    if (dirty) descartar.current?.showModal();
    else router.replace(volver, { scroll: false });
  }
  return (
    <dialog
      ref={dialogo}
      onCancel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          cerrar();
        }
      }}
      aria-labelledby="editor-beneficio-titulo"
      className="detalle-opinion-munay fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-white p-0 text-[#14382e] shadow-2xl backdrop:bg-black/40 sm:w-[min(52rem,95vw)]"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#dce3da] bg-white p-5">
        <div>
          <p className="text-xs text-[#526a60]">Beneficios de tu atractivo</p>
          <h2
            id="editor-beneficio-titulo"
            className="mt-1 text-xl font-semibold"
          >
            {beneficio ? "Gestionar beneficio" : "Crear un beneficio"}
          </h2>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed]"
        >
          Cerrar
        </button>
      </header>
      <div className="space-y-6 p-5 sm:p-7">
        {beneficio && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{beneficio.nombre}</h3>
            {!dirty && <ControlEstadoBeneficio beneficio={beneficio} />}
            <p className="text-xs leading-relaxed text-[#526a60]">
              Pausar no modifica los comprobantes emitidos. Editar el costo o
              las condiciones requiere una nueva aprobación.
            </p>
          </div>
        )}
        <EditorBeneficio
          key={beneficio?.actualizadoEn ?? "nuevo"}
          beneficio={beneficio}
          destinos={destinos}
          superadmin={superadmin}
          onDirtyChange={cambiarDirty}
        />
        {beneficio && (
          <HistorialBeneficio key={beneficio.actualizadoEn} id={beneficio.id} />
        )}
      </div>
      <dialog
        ref={descartar}
        aria-labelledby="descartar-beneficio-titulo"
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl bg-white p-6 text-[#14382e] shadow-xl backdrop:bg-black/40"
      >
        <h3 id="descartar-beneficio-titulo" className="text-xl font-semibold">
          Tienes cambios sin guardar
        </h3>
        <p className="mt-3 text-sm">
          Puedes seguir configurando el beneficio o cerrar y descartar los
          cambios de este formulario.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => descartar.current?.close()}
            className="min-h-11 rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => router.replace(volver, { scroll: false })}
            className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
          >
            Descartar y cerrar
          </button>
        </div>
      </dialog>
    </dialog>
  );
}
