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
    <article className="group relative rounded-2xl border border-[#d5e0d6] bg-white p-5 transition-all hover:border-[#174238]/30 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarResena nombre={resena.usuario.nombreCompleto} />
          <div className="min-w-0">
            <p className="wrap-anywhere text-sm font-semibold text-[#14382e]">
              {resena.usuario.nombreCompleto}
            </p>
            <time dateTime={resena.creadaEn} className="text-xs text-[#526a60]">
              {fecha.format(new Date(resena.creadaEn))}
            </time>
          </div>
        </div>
        <div className="shrink-0">
          <ValoracionResena nota={resena.calificacion} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {resena.verificada ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-900 border border-emerald-200/80">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-3"
              aria-hidden="true"
            >
              <path d="m3 8 3.5 3.5 6.5-7" />
            </svg>
            Visita verificada
          </span>
        ) : (
          <span className="rounded-full bg-[#f4f5ef] px-2.5 py-0.5 font-medium text-[#4d665b]">
            Sin verificación de visita
          </span>
        )}

        {resena.respuestaOficial !== undefined && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
              resena.respuestaOficial
                ? "bg-teal-50 text-teal-900 border border-teal-200/80"
                : "bg-amber-50 text-amber-900 border border-amber-200/80"
            }`}
          >
            {!resena.respuestaOficial && (
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
            {resena.respuestaOficial
              ? "Respondida oficialmente"
              : "Pendiente de respuesta"}
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-start gap-4">
        <p className="min-w-0 flex-1 line-clamp-3 wrap-anywhere whitespace-pre-wrap text-sm leading-relaxed text-[#3a5247]">
          {resena.comentario}
        </p>
        {resena.fotoUrl && (
          <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-[#dce3da]">
            <Image
              src={resena.fotoUrl}
              alt="Fotografía compartida por el visitante"
              width={72}
              height={72}
              loading="lazy"
              unoptimized
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf3ec] pt-3">
        <Link
          href={href}
          scroll={false}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#edf4ed] px-4 text-xs font-semibold text-[#174238] transition-colors hover:bg-[#174238] hover:text-white"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="size-3.5"
            aria-hidden="true"
          >
            <path d="M17 10c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306L3 18l1.306-3.653A6.673 6.673 0 0 1 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7Z" />
          </svg>
          {resena.respuestaOficial
            ? `Ver conversación (${resena.totalRespuestas ?? 1})`
            : "Responder al visitante"}
        </Link>

        <span className="text-[11px] text-[#526a60]">
          ID: {resena.id.slice(0, 8)}
        </span>
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
          className="rounded-xl border border-[#ccd9cf] px-3.5 py-1.5 text-xs font-semibold text-[#173b32] hover:bg-[#edf4ed]"
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
