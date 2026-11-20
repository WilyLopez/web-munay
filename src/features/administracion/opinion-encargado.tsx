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
    <article className="min-w-0 py-5">
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
        <ValoracionResena nota={resena.calificacion} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-[#edf4ed] px-2.5 py-1 text-[#315b43]">
          {resena.verificada
            ? "Visita verificada"
            : "Sin verificación de visita"}
        </span>
        {resena.respuestaOficial !== undefined && (
          <span
            className={`rounded-full px-2.5 py-1 ${resena.respuestaOficial ? "bg-[#edf4ed] text-[#315b43]" : "bg-[#fff5df] text-[#7a581d]"}`}
          >
            {resena.respuestaOficial
              ? "Respuesta oficial publicada"
              : "Pendiente de respuesta oficial"}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start gap-3">
        <p className="min-w-0 flex-1 line-clamp-3 wrap-anywhere whitespace-pre-wrap text-sm leading-relaxed text-[#40594f]">
          {resena.comentario}
        </p>
        {resena.fotoUrl && (
          <Image
            src={resena.fotoUrl}
            alt="Fotografía compartida por el visitante"
            width={72}
            height={72}
            loading="lazy"
            unoptimized
            className="size-16 shrink-0 rounded-lg object-cover"
          />
        )}
      </div>
      <Link
        href={href}
        scroll={false}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#174238] underline decoration-[#b8cbbb] underline-offset-4 hover:decoration-current"
      >
        Ver reseña y respuestas
        {resena.totalRespuestas ? ` (${resena.totalRespuestas})` : ""}
      </Link>
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
      className="detalle-opinion-munay fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-white p-0 text-[#14382e] shadow-2xl backdrop:bg-[#102e27]/45 sm:w-[min(42rem,90vw)]"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#d5e0d6] bg-white px-5 py-4 sm:px-7">
        <div>
          <p className="text-xs text-[#526a60]">Opiniones de tus visitantes</p>
          <h2
            id="titulo-detalle-opinion"
            className="mt-1 text-xl font-semibold"
          >
            Detalle de la reseña
          </h2>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="min-h-11 rounded-xl border border-[#ccd9cf] px-4 text-sm font-semibold hover:bg-[#edf4ed]"
        >
          Cerrar
        </button>
      </header>
      <div className="space-y-6 p-5 sm:p-7">
        <ContenidoResena
          autor={resena.usuario.nombreCompleto}
          creadaEn={resena.creadaEn}
          fechaVisita={resena.fechaVisita}
          verificada={resena.verificada}
          calificacion={resena.calificacion}
          comentario={resena.comentario}
          fotoUrl={resena.fotoUrl}
        />
        <section className="rounded-2xl border border-[#d5e0d6] bg-[#f8faf7] p-4">
          <h3 className="mb-2 text-base font-semibold">
            Conversación con el visitante
          </h3>
          <p className="mb-3 text-sm text-[#526a60]">
            Escucha su experiencia y ofrece una respuesta útil en nombre del
            atractivo.
          </p>
          <div className="flex flex-wrap gap-3">
            <RespuestasResena
              resenaId={resena.id}
              total={resena.totalRespuestas}
              puedeResponder
              oficial
            />
          </div>
        </section>
        <ReportarResena id={resena.id} />
      </div>
    </dialog>
  );
}
