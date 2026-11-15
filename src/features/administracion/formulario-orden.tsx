"use client";

import { useActionState, useState } from "react";
import { guardarOrdenPortada } from "./acciones";

export function FormularioOrden({
  id,
  nombre,
  orden,
}: {
  id: string;
  nombre: string;
  orden?: number | null;
}) {
  const [valor, cambiarValor] = useState(orden?.toString() ?? "");
  const [estado, guardar, pendiente] = useActionState(
    guardarOrdenPortada.bind(null, id),
    { mensaje: "", error: false },
  );

  return (
    <form action={guardar} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          name="orden"
          type="number"
          min={1}
          max={2147483647}
          step={1}
          value={valor}
          onChange={(evento) => cambiarValor(evento.target.value)}
          aria-label={`Orden de portada de ${nombre}`}
          className="w-24 rounded-lg border border-[#aabdb0] bg-white px-3 py-2 text-sm"
        />
        <button
          disabled={pendiente}
          className="rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <p
        role="status"
        className={
          estado.error ? "text-xs text-red-800" : "text-xs text-[#37614e]"
        }
      >
        {estado.mensaje}
      </p>
    </form>
  );
}
