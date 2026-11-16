import Link from "next/link";
import { fechaVisita } from "@/features/visitas/tipos";
import { AccionesResena } from "./acciones-resena";
import type { Resena } from "./tipos";
import { VerificarIntegridad } from "./verificar-integridad";

export function TarjetaResena({
  resena,
  mostrarDestino,
}: {
  resena: Resena;
  mostrarDestino?: boolean;
}) {
  return (
    <article
      id={`resena-${resena.id}`}
      className="scroll-mt-28 space-y-3 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-5 text-[#193b33] sm:p-6"
    >
      {mostrarDestino && (
        <Link
          href={`/destinos/${encodeURIComponent(resena.destino.slug)}#opiniones`}
          className="wrap-anywhere inline-flex min-h-11 items-center rounded-sm font-serif text-xl leading-tight underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {resena.destino.nombre}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="wrap-anywhere font-semibold">
            {resena.usuario.nombreCompleto}
          </p>
          <time dateTime={resena.creadaEn} className="text-sm text-[#465a50]">
            {fechaVisita.format(new Date(resena.creadaEn))}
          </time>
        </div>
        <p className="rounded-lg bg-[#f1e8dc] px-2.5 py-1 text-sm font-semibold tabular-nums text-[#813d2b]">
          <span aria-hidden="true">★ </span>
          {resena.calificacion} de 5
        </p>
      </div>
      <p
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${resena.verificada ? "bg-[#e8eee6] text-[#174238]" : "bg-stone-100 text-stone-700"}`}
      >
        {resena.verificada ? "Visita verificada" : "Visita sin verificar"}
      </p>
      <p className="wrap-anywhere whitespace-pre-wrap leading-relaxed">
        {resena.comentario}
      </p>
      {resena.verificada && (
        <VerificarIntegridad id={resena.id} registro={resena.integridad} />
      )}
      <AccionesResena
        id={resena.id}
        utiles={resena.utiles}
        votoPropio={resena.votoPropio}
      />
    </article>
  );
}
