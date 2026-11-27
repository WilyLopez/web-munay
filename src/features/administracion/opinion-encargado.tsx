"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  AvatarResena,
  ContenidoResena,
  ValoracionResena,
} from "@/features/resenas/contenido-resena";
import { RespuestasResena } from "@/features/resenas/respuestas-resena";
import type { Resena } from "@/features/resenas/tipos";
import { ReportarResena } from "./controles-reporte";

export type OpinionEncargado = Pick<
  Resena,
  | "id"
  | "comentario"
  | "calificacion"
  | "usuario"
  | "creadaEn"
  | "verificada"
  | "fechaVisita"
  | "fotoUrl"
  | "totalRespuestas"
  | "respuestaOficial"
>;

const fecha = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});

export function OpinionResumen({
  resena,
  href,
}: {
  resena: OpinionEncargado;
  href: string;
}) {
  return (
    <article className="group flex flex-col gap-2.5 p-3.5 transition-colors hover:bg-[#f7faf7] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
        <AvatarResena nombre={resena.usuario.nombreCompleto} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#14382e]">
            {resena.usuario.nombreCompleto}
          </p>
          <div className="flex items-center gap-2">
            <ValoracionResena nota={resena.calificacion} />
            <time dateTime={resena.creadaEn} className="text-[11px] text-[#526a60]">
              {fecha.format(new Date(resena.creadaEn))}
            </time>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 flex items-center gap-2.5">
        {resena.fotoUrl && (
          <div className="size-8 shrink-0 overflow-hidden rounded-lg border border-[#dce3da]">
            <Image
              src={resena.fotoUrl}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              unoptimized
              className="size-full object-cover"
            />
          </div>
        )}
        <p className="line-clamp-1 truncate text-xs text-[#3a5247]">
          {resena.comentario}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 justify-between sm:justify-end">
        {resena.verificada ? (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-900 border border-emerald-200">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-2.5"
              aria-hidden="true"
            >
              <path d="m3 8 3.5 3.5 6.5-7" />
            </svg>
            Verificada
          </span>
        ) : (
          <span className="hidden sm:inline-flex rounded-full bg-[#f4f5ef] px-2 py-0.5 text-[10px] font-medium text-[#526a60]">
            Sin QR
          </span>
        )}

        {resena.respuestaOficial !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
              resena.respuestaOficial
                ? "bg-teal-50 text-teal-900 border-teal-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {!resena.respuestaOficial && (
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
            {resena.respuestaOficial ? "Respondida" : "Por responder"}
          </span>
        )}

        <Link
          href={href}
          scroll={false}
          className="inline-flex min-h-8 items-center rounded-lg bg-[#edf4ed] px-3 text-xs font-semibold text-[#174238] transition-colors hover:bg-[#174238] hover:text-white"
        >
          {resena.respuestaOficial ? "Ver" : "Responder"}
        </Link>
      </div>
    </article>
  );
}

export function DetalleOpinion({
  resena,
  volver,
}: {
  resena: OpinionEncargado;
  volver: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const elemento = dialogo.current;
    if (elemento && !elemento.open) elemento.showModal();
  }, []);

  function cerrar() {
    router.replace(volver, { scroll: false });
  }

  return (
    <dialog
      ref={dialogo}
      onCancel={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        evento.preventDefault();
        cerrar();
      }}
      aria-labelledby="titulo-detalle-opinion"
      className="detalle-opinion-munay fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-white p-0 text-[#14382e] shadow-2xl backdrop:bg-[#102e27]/45 sm:w-[min(30rem,100vw)]"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#d5e0d6] bg-white px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#526a60]">
            Atención al visitante
          </p>
          <h2
            id="titulo-detalle-opinion"
            className="truncate font-serif text-lg font-bold"
          >
            Detalle de la reseña
          </h2>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="rounded-xl border border-[#ccd9cf] px-3.5 py-1.5 text-xs font-semibold text-[#174238] hover:bg-[#edf4ed]"
        >
          Cerrar
        </button>
      </header>

      <div className="space-y-5 p-5">
        <div className="rounded-2xl border border-[#d5e0d6] bg-[#fbfcf8] p-4">
          <ContenidoResena
            autor={resena.usuario.nombreCompleto}
            creadaEn={resena.creadaEn}
            fechaVisita={resena.fechaVisita}
            verificada={resena.verificada}
            calificacion={resena.calificacion}
            comentario={resena.comentario}
            fotoUrl={resena.fotoUrl}
          />
        </div>

        <section className="space-y-3 rounded-2xl border border-[#d5e0d6] bg-[#f4f7f4] p-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#14382e]">
              Respuesta oficial del atractivo
            </h3>
            <p className="text-xs text-[#526a60]">
              Ofrece una respuesta institucional y oportuna para el visitante.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RespuestasResena
              resenaId={resena.id}
              total={resena.totalRespuestas}
              puedeResponder
              oficial
            />
          </div>
        </section>

        <div className="border-t border-[#edf3ec] pt-2">
          <ReportarResena id={resena.id} />
        </div>
      </div>
    </dialog>
  );
}
