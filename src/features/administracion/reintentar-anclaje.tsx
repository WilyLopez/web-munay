"use client";

import { useActionState, useState } from "react";
import { reintentarAnclaje } from "./anclajes-acciones";

export function ReintentarAnclaje({ id }: { id: string }) {
  const [confirmar, cambiar] = useState(false);
  const [mensaje, ejecutar, pendiente] = useActionState(
    reintentarAnclaje.bind(null, id),
    "",
  );
  const boton =
    "rounded-lg border border-[#bdcfc2] px-3 py-2 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-50";
  return confirmar ? (
    <form
      action={ejecutar}
      className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3"
    >
      <p className="text-sm">
        ¿Volver a poner este registro en la cola de Sepolia?
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendiente}
          className={boton}
          onClick={() => cambiar(false)}
        >
          Cancelar
        </button>
        <button disabled={pendiente} className={boton}>
          {pendiente ? "Enviando…" : "Confirmar reintento"}
        </button>
      </div>
      {mensaje && (
        <p role="status" className="text-sm">
          {mensaje}
        </p>
      )}
    </form>
  ) : (
    <button className={boton} onClick={() => cambiar(true)}>
      Reintentar
    </button>
  );
}
