"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { consultarRecompensaResena } from "./acciones";
import type { RecompensaResena } from "./tipos";

const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export function RecompensaPublicada({ id }: { id: string }) {
  const [recompensa, cambiarRecompensa] = useState<RecompensaResena>();
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  useEffect(() => {
    let activo = true;
    void consultarRecompensaResena(id)
      .then((resultado) => {
        if (!activo) return;
        if (resultado.ok) cambiarRecompensa(resultado.datos);
        else cambiarError(resultado.mensaje);
      })
      .catch(() => {
        if (activo)
          cambiarError(
            "No pudimos consultar los puntos. Tu reseña sigue guardada.",
          );
      });
    return () => {
      activo = false;
    };
  }, [id]);
  function actualizar() {
    iniciar(async () => {
      try {
        const resultado = await consultarRecompensaResena(id);
        if (resultado.ok) {
          cambiarRecompensa(resultado.datos);
          cambiarError("");
        } else cambiarError(resultado.mensaje);
      } catch {
        cambiarError("No pudimos consultar los puntos. Inténtalo de nuevo.");
      }
    });
  }
  return (
    <section
      className="space-y-4 rounded-2xl border border-[#c5d6ca] bg-white p-5 text-[#174238] sm:p-6"
      aria-labelledby="recompensa-publicada"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-800">
          Tu reseña está guardada
        </p>
        <h2 id="recompensa-publicada" className="mt-1 font-serif text-2xl">
          Gracias por compartir tu experiencia
        </h2>
      </div>
      <div role="status" aria-live="polite">
        {recompensa ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{recompensa.destino.nombre}</p>
            <p className="text-xs text-[#526a60]">
              <time dateTime={recompensa.registradoEn}>
                {fecha.format(new Date(recompensa.registradoEn))}
              </time>
            </p>
            {recompensa.estado === "acreditada" ? (
              <div className="rounded-xl bg-[#edf6ef] p-4">
                <p className="text-sm font-semibold">Puntos acreditados</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  +{recompensa.total} puntos MUNAY
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>Reseña con visita verificada</dt>
                    <dd>+{recompensa.puntosResena}</dd>
                  </div>
                  {recompensa.puntosSelfie > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt>Bono por selfie declarada</dt>
                      <dd>+{recompensa.puntosSelfie}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
                {recompensa.estado === "pendiente"
                  ? `Tu recompensa de ${recompensa.previstos} puntos está pendiente de procesamiento o revisión. Todavía no se ha sumado a tu saldo. Tu reseña no se pierde.`
                  : "Esta reseña no mantiene una recompensa activa. Puedes revisar los movimientos en tu perfil."}
              </p>
            )}
          </div>
        ) : (
          !error && (
            <p className="rounded-xl bg-[#edf6ef] p-4 text-sm">
              Consultando tu recompensa…
            </p>
          )
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-900">
          {error}
        </p>
      )}
      {(error || recompensa?.estado === "pendiente") && (
        <button
          type="button"
          disabled={pendiente}
          onClick={actualizar}
          className="min-h-11 text-sm font-semibold underline disabled:opacity-60"
        >
          {pendiente ? "Consultando…" : "Actualizar estado de puntos"}
        </button>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/mi-perfil#ranking"
          className="inline-flex min-h-12 items-center rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#23574a]"
        >
          Ver mi perfil y ranking
        </Link>
        <Link
          href={`/resenas/${encodeURIComponent(id)}`}
          className="inline-flex min-h-12 items-center px-2 text-sm font-semibold underline underline-offset-4"
        >
          Ver mi reseña
        </Link>
        <Link
          href="/beneficios"
          className="inline-flex min-h-12 items-center px-2 text-sm font-semibold underline underline-offset-4"
        >
          Explorar beneficios para canjear
        </Link>
      </div>
    </section>
  );
}
