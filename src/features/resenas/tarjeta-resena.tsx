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
    <article id={`resena-${resena.id}`} className="scroll-mt-28 space-y-2 py-4">
      {mostrarDestino && (
        <Link
          href={`/destinos/${encodeURIComponent(resena.destino.slug)}#opiniones`}
          className="font-semibold underline underline-offset-4"
        >
          {resena.destino.nombre}
        </Link>
      )}
      <p className="font-semibold">{resena.usuario.nombreCompleto}</p>
      <p className="text-sm text-stone-700">
        <time dateTime={resena.creadaEn}>
          {fechaVisita.format(new Date(resena.creadaEn))}
        </time>
        {" · "}
        {resena.calificacion} de 5 ★
      </p>
      <p className="text-sm font-semibold text-teal-900">
        {resena.verificada
          ? "Visita verificada · Opinión auténtica en sitio"
          : "Sin verificación"}
      </p>
      <p className="wrap-anywhere whitespace-pre-wrap">{resena.comentario}</p>
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
