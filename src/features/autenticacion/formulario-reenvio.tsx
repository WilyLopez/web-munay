"use client";

import { useActionState } from "react";
import { reenviarConfirmacion } from "./acciones";

export function FormularioReenvio() {
  const [estado, enviar, pendiente] = useActionState(reenviarConfirmacion, {});
  const error = estado.errores?.correoElectronico;

  return (
    <form action={enviar} className="space-y-4">
      <label className="block text-sm font-semibold">
        Correo electrónico
        <input
          name="correoElectronico"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "error-reenvio" : undefined}
          className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </label>
      {error && (
        <p id="error-reenvio" role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      {estado.mensaje && (
        <p role="alert" className="text-sm text-red-800">
          {estado.mensaje}
        </p>
      )}
      <button
        disabled={pendiente}
        className="w-full rounded-xl bg-[#174238] px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pendiente ? "Solicitando…" : "Reenviar confirmación"}
      </button>
    </form>
  );
}
