"use client";

import { useState, type FormEvent } from "react";

const fechaEnLima = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function DisponibilidadVisita({ dias }: { dias: number[] }) {
  const [resultado, cambiarResultado] = useState("");

  function verificar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fecha = new FormData(evento.currentTarget).get("fechaVisita");
    if (typeof fecha !== "string" || fecha < fechaEnLima.format(new Date())) {
      cambiarResultado("Elige la fecha de hoy o una fecha posterior.");
      return;
    }

    const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
    if (dias.length === 0) {
      cambiarResultado("La disponibilidad para esa fecha está por confirmar.");
      return;
    }
    cambiarResultado(
      dias.includes(dia)
        ? "La fecha coincide con un día de atención habitual."
        : "La fecha está fuera de los días habituales de atención.",
    );
  }

  return (
    <form
      onSubmit={verificar}
      className="space-y-3 border-t border-stone-200 pt-4"
    >
      <label htmlFor="fecha-visita" className="block text-sm font-semibold">
        Fecha de visita
      </label>
      <input
        id="fecha-visita"
        name="fechaVisita"
        type="date"
        required
        onChange={() => cambiarResultado("")}
        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="text-sm font-semibold text-teal-900 underline"
      >
        Verificar disponibilidad
      </button>
      <p role="status" className="text-sm font-semibold text-teal-950">
        {resultado}
      </p>
      <p className="text-xs text-stone-600">
        Consulta referencial. Confirma feriados, cambios de horario y cupos con
        el destino.
      </p>
    </form>
  );
}
