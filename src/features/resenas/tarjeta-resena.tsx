import { ContenidoResena } from "./contenido-resena";
import { AccionesResena } from "./acciones-resena";
import { RespuestasResena } from "./respuestas-resena";
import { VerificarIntegridad } from "./verificar-integridad";
import type { Resena } from "./tipos";

export function TarjetaResena({
  resena,
  mostrarDestino,
  puedeResponder,
}: {
  resena: Resena;
  mostrarDestino?: boolean;
  puedeResponder?: boolean;
}) {
  return (
    <article
      id={`resena-${resena.id}`}
      className="min-w-0 scroll-mt-28 rounded-2xl border border-[#dce3da] bg-white p-4 text-[#193b33] sm:p-6"
    >
      <ContenidoResena
        autor={resena.usuario.nombreCompleto}
        creadaEn={resena.creadaEn}
        fechaVisita={resena.fechaVisita}
        calificacion={resena.calificacion}
        verificada={resena.verificada}
        comentario={resena.comentario}
        fotoUrl={resena.fotoUrl}
        destino={mostrarDestino ? resena.destino : undefined}
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-[#e5e9df] pt-2">
        <AccionesResena
          key={`${resena.id}:${resena.utiles}:${resena.votoPropio}`}
          id={resena.id}
          utiles={resena.utiles}
          votoPropio={resena.votoPropio}
        />
        <RespuestasResena
          resenaId={resena.id}
          total={resena.totalRespuestas}
          puedeResponder={puedeResponder}
          oficial={puedeResponder}
          nombreDestino={resena.destino?.nombre}
        />
      </div>
      {resena.verificada && (
        <details className="mt-2 rounded-xl bg-[#f5f7f2] px-3">
          <summary className="min-h-11 cursor-pointer content-center text-xs font-medium text-[#526a60]">
            Detalles de verificación
          </summary>
          <div className="space-y-2 pb-3">
            <p className="text-xs leading-relaxed text-[#526a60]">Se comprobó la visita al destino. La opinión pertenece a su autor; las insignias no certifican la veracidad de su contenido.</p>
            <VerificarIntegridad id={resena.id} registro={resena.integridad} />
          </div>
        </details>
      )}
    </article>
  );
}
