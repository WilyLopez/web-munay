"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
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
  const [favoritoOptimista, setFavoritoOptimista] = useOptimistic(
    destino.favorito,
    (_actual, nuevo: boolean) => nuevo,
  );
  const estilo = compacto
    ? "absolute right-3 top-3 grid size-12 min-h-12 min-w-12 place-items-center rounded-full bg-white text-2xl text-teal-950 shadow-md transition-transform active:scale-95"
    : "inline-flex min-h-12 items-center justify-center rounded-full border border-teal-900 px-5 py-3 font-semibold text-teal-950 transition-colors active:scale-95";

  return (
    <>
      {tieneSesion ? (
        <button
          type="button"
          aria-label={compacto ? `Favorito: ${destino.nombre}` : undefined}
          aria-pressed={favoritoOptimista}
          disabled={pendiente}
          className={`${estilo} disabled:opacity-80 aria-pressed:text-rose-700`}
          onClick={() => {
            cambiarError(null);
            iniciarCambio(async () => {
              const proximo = !favoritoOptimista;
              setFavoritoOptimista(proximo);
              const fallo = await actualizarFavorito(destino.id, proximo);
              if (fallo) cambiarError(fallo);
            });
          }}
        >
          {compacto ? (
            <span aria-hidden="true">{favoritoOptimista ? "♥" : "♡"}</span>
          ) : favoritoOptimista ? (
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
