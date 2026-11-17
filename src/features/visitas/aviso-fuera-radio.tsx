"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

const metros = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const kilometros = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

export function AvisoFueraRadio({
  nombre,
  distanciaMetros,
  radioMetros,
  cerrar,
  reintentar,
}: {
  nombre: string;
  distanciaMetros: number;
  radioMetros: number;
  cerrar: () => void;
  reintentar: () => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const descripcion = useId();

  useEffect(() => {
    const dialogo = modal.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  const distancia =
    distanciaMetros >= 1000
      ? `${kilometros.format(distanciaMetros / 1000)} km`
      : `${metros.format(distanciaMetros)} m`;

  return (
    <dialog
      ref={modal}
      onClose={cerrar}
      aria-labelledby={titulo}
      aria-describedby={descripcion}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-[#d5e0d6] bg-white p-5 text-[#14382e] shadow-xl backdrop:bg-black/45 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950">
          Fuera del área de visita
        </span>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-900"
          aria-label="Cerrar aviso de ubicación"
        >
          Cerrar
        </button>
      </div>
      <h2
        id={titulo}
        className="mt-3 font-serif text-2xl leading-tight sm:text-3xl"
      >
        Acércate para verificar tu visita
      </h2>
      <p className="mt-2 wrap-anywhere font-semibold">{nombre}</p>
      <p
        id={descripcion}
        className="mt-3 text-sm leading-relaxed text-stone-700"
      >
        Parece que todavía estás fuera del área del atractivo. Cuando estés
        cerca de su entrada, podremos confirmar tu visita y habilitar tu reseña.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f0f5ef] p-4">
        <div>
          <dt className="text-xs text-stone-600">Distancia aproximada</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {distancia}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-stone-600">Radio permitido</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {metros.format(radioMetros)} m
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-stone-700">
        Aún no registramos esta visita. Si ya estás en el lugar, prueba de nuevo
        desde un espacio abierto para mejorar la señal de ubicación.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          autoFocus
          onClick={reintentar}
          className="min-h-12 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#23574a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-900"
        >
          Volver a comprobar
        </button>
        <Link
          href="/destinos"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#bdcfc2] px-4 text-center text-sm font-semibold hover:bg-[#edf4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-900"
        >
          Ver lugares en Munay
        </Link>
      </div>
    </dialog>
  );
}
