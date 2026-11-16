"use client";

import { useFormStatus } from "react-dom";
import { botonAcceso } from "./estilos-acceso";

export function BotonEnvioAcceso({
  etiqueta,
  esperando,
}: {
  etiqueta: string;
  esperando: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={botonAcceso} disabled={pending}>
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border-2 border-white/45 border-t-white motion-safe:animate-spin"
        />
      )}
      <span aria-live="polite">{pending ? esperando : etiqueta}</span>
    </button>
  );
}