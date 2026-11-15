"use client";

import { useActionState } from "react";
import type { EstadoFicha } from "@/features/destinos/informacion";
import { resolverFichaDestino } from "./ficha-operativa";

export function RevisionFicha({
  slug,
  estado,
  verificado,
}: {
  slug: string;
  estado: EstadoFicha;
  verificado: boolean;
}) {
  const [resultado, resolver, pendiente] = useActionState(
    resolverFichaDestino.bind(null, slug),
    { mensaje: "", error: false },
  );

  return (
    <form
      action={resolver}
      className="flex flex-wrap gap-3"
      onSubmit={(evento) => {
        const boton = (evento.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        if (
          boton &&
          !window.confirm(`¿Confirmas la acción «${boton.textContent}»?`)
        )
          evento.preventDefault();
      }}
    >
      {estado === "en_revision" && (
        <button
          name="estado"
          value="publicada"
          disabled={pendiente}
          className="rounded-lg bg-teal-950 px-4 py-2 text-white disabled:opacity-60"
        >
          Publicar destino
        </button>
      )}
      {estado === "publicada" && (
        <button
          name="estado"
          value={verificado ? "quitar_verificacion" : "verificar"}
          disabled={pendiente}
          className="rounded-lg border px-4 py-2 disabled:opacity-60"
        >
          {verificado ? "Quitar verificación" : "Marcar como verificado"}
        </button>
      )}
      {estado === "publicada" && (
        <button
          name="estado"
          value="archivada"
          disabled={pendiente}
          className="rounded-lg border px-4 py-2 disabled:opacity-60"
        >
          Archivar destino
        </button>
      )}
      {["en_revision", "archivada"].includes(estado) && (
        <button
          name="estado"
          value="borrador"
          disabled={pendiente}
          className="rounded-lg border px-4 py-2 disabled:opacity-60"
        >
          Devolver a borrador
        </button>
      )}
      {resultado.mensaje && (
        <p role={resultado.error ? "alert" : "status"}>{resultado.mensaje}</p>
      )}
    </form>
  );
}
