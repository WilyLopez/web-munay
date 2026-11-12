"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { actualizarFavorito } from "./acciones";
import type { Destino } from "./catalogo";

export function FavoritoDestino({
  destino,
  tieneSesion,
  compacto = false,
}: {
  destino: Destino;
  tieneSesion: boolean;
  compacto?: boolean;
}) {
  const [error, cambiarError] = useState<string | null>(null);
  const [pendiente, iniciarCambio] = useTransition();
  const estilo = compacto
    ? "absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white text-2xl text-teal-950 shadow"
    : "inline-flex rounded-full border border-teal-900 px-5 py-3 font-semibold text-teal-950";

  return (
    <>
      {tieneSesion ? (
        <button
          type="button"
          aria-label={compacto ? `Favorito: ${destino.nombre}` : undefined}
          aria-pressed={destino.favorito}
          disabled={pendiente}
          className={`${estilo} disabled:opacity-70 aria-pressed:text-rose-700`}
          onClick={() =>
            iniciarCambio(async () => {
              cambiarError(null);
              cambiarError(
                await actualizarFavorito(destino.id, !destino.favorito),
              );
            })
          }
        >
          {compacto ? (
            <span aria-hidden="true">{destino.favorito ? "♥" : "♡"}</span>
          ) : destino.favorito ? (
            "Quitar de guardados"
          ) : (
            "Guardar destino"
          )}
        </button>
      ) : (
        <Link
          href="/ingresar?aviso=sesion"
          aria-label={`Iniciar sesión para guardar ${destino.nombre} como favorito`}
          className={estilo}
        >
          {compacto ? (
            <span aria-hidden="true">♡</span>
          ) : (
            "Inicia sesión para guardar"
          )}
        </Link>
      )}
      {error && (
        <p
          role="alert"
          className={`rounded bg-white px-2 py-1 text-sm text-red-800 ${compacto ? "absolute inset-x-3 bottom-3" : "mt-2"}`}
        >
          {error}
        </p>
      )}
    </>
  );
}
