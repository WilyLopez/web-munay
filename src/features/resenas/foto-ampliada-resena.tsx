"use client";

import Image from "next/image";
import { useRef } from "react";

export function FotoAmpliadaResena({
  url,
  descripcion,
  compacta = false,
}: {
  url: string;
  descripcion: string;
  compacta?: boolean;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => modal.current?.showModal()}
        className={`block overflow-hidden rounded-xl border border-[#d5e0d6] bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-900 ${compacta ? "max-w-40" : "max-w-xs"}`}
        aria-label="Ampliar foto de la visita"
      >
        <Image
          src={url}
          alt={descripcion}
          width={640}
          height={480}
          unoptimized
          className={`w-full object-cover ${compacta ? "max-h-28" : "max-h-52"}`}
        />
      </button>
      <dialog
        ref={modal}
        aria-label="Foto de la visita"
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl border border-[#d5e0d6] bg-white p-3 shadow-xl backdrop:bg-black/65"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#174238]">
            Foto de la visita
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => modal.current?.close()}
            className="min-h-11 rounded-xl border border-[#bdcfc2] px-4 text-sm font-semibold text-[#174238] hover:bg-[#edf4ed]"
          >
            Cerrar foto
          </button>
        </div>
        <Image
          src={url}
          alt={descripcion}
          width={1200}
          height={900}
          unoptimized
          className="max-h-[75dvh] w-full rounded-lg bg-stone-50 object-contain"
        />
      </dialog>
    </>
  );
}
