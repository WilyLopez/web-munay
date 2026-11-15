"use client";

import { useActionState, useState } from "react";
import { actualizarPerfilAdmin } from "./perfil-acciones";

export function FormularioPerfilAdmin({
  nombreCompleto,
}: {
  nombreCompleto: string;
}) {
  const [nombre, cambiarNombre] = useState(nombreCompleto);
  const [confirmar, cambiarConfirmacion] = useState(false);
  const [estado, guardar, pendiente] = useActionState(actualizarPerfilAdmin, {
    mensaje: "",
    ok: false,
  });

  return (
    <form
      action={guardar}
      onSubmit={(evento) => {
        if (!confirmar) {
          evento.preventDefault();
          cambiarConfirmacion(true);
        } else {
          cambiarConfirmacion(false);
        }
      }}
      className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
    >
      <label className="grid max-w-md gap-2 text-sm font-semibold">
        Nombre completo
        <input
          name="nombreCompleto"
          autoComplete="name"
          value={nombre}
          required
          minLength={2}
          maxLength={120}
          readOnly={pendiente}
          onChange={(evento) => {
            cambiarConfirmacion(false);
            cambiarNombre(evento.target.value);
          }}
          className="rounded-lg border border-[#bdcfc2] px-3 py-2 font-normal"
        />
      </label>
      {confirmar && nombre.trim() !== nombreCompleto && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p role="status" className="text-sm">
            ¿Guardar el nombre «{nombre.trim()}» en tu perfil?
          </p>
          <button
            type="button"
            disabled={pendiente}
            className="text-sm font-semibold underline underline-offset-4"
            onClick={() => cambiarConfirmacion(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      <button
        disabled={pendiente || nombre.trim() === nombreCompleto}
        className="rounded-lg bg-[#174238] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-50"
      >
        {pendiente
          ? "Guardando…"
          : confirmar
            ? "Confirmar cambio"
            : "Guardar nombre"}
      </button>
      {estado.mensaje && (
        <p
          role={estado.ok ? "status" : "alert"}
          className={
            estado.ok ? "text-sm text-green-900" : "text-sm text-rose-900"
          }
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
