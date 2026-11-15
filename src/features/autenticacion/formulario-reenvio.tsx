"use client";

import { useActionState, useState } from "react";
import { reenviarConfirmacion } from "./acciones";
import { AvisoAcceso } from "./aviso-acceso";
import { botonAcceso, campoAcceso } from "./estilos-acceso";

export function FormularioReenvio() {
  const [estado, enviar, pendiente] = useActionState(reenviarConfirmacion, {});
  const [correo, cambiarCorreo] = useState("");
  const error = estado.errores?.correoElectronico;

  return (
    <form action={enviar} className="space-y-4">
      <label className="grid gap-2 text-sm font-semibold">
        Correo electrónico
        <input
          name="correoElectronico"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(evento) => cambiarCorreo(evento.target.value)}
          maxLength={254}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "error-reenvio" : undefined}
          className={campoAcceso}
        />
      </label>
      {error && (
        <p id="error-reenvio" role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      {estado.mensaje && <AvisoAcceso tipo="error" mensaje={estado.mensaje} />}
      <button disabled={pendiente} className={botonAcceso}>
        {pendiente ? "Solicitando…" : "Reenviar confirmación"}
      </button>
    </form>
  );
}
