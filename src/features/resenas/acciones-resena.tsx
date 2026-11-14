"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { votarResena } from "./acciones";

export function AccionesResena({
  id,
  utiles,
  votoPropio,
}: {
  id: string;
  utiles: number;
  votoPropio: boolean;
}) {
  const [voto, cambiarVoto] = useState(votoPropio);
  const router = useRouter();
  const [ocupado, cambiarOcupado] = useState(false);
  const [aviso, cambiarAviso] = useState("");
  const [enlace, cambiarEnlace] = useState("");
  const [avisoEnlace, cambiarAvisoEnlace] = useState("");

  async function votar() {
    cambiarOcupado(true);
    cambiarAviso("");
    try {
      const respuesta = await votarResena(id, !voto);
      if (respuesta.ok) cambiarVoto(!voto);
      else if (respuesta.estado === 401) router.push("/ingresar?aviso=sesion");
      else cambiarAviso(respuesta.mensaje);
    } catch {
      cambiarAviso("No se pudo guardar tu voto.");
    } finally {
      cambiarOcupado(false);
    }
  }

  async function compartir() {
    cambiarAvisoEnlace("");
    const url = new URL(window.location.href);
    url.hash = `resena-${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Reseña en Munay", url: url.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    cambiarEnlace(url.href);
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(enlace);
      cambiarAvisoEnlace("Enlace copiado.");
    } catch {
      cambiarAvisoEnlace("Selecciona el enlace y cópialo manualmente.");
    }
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button
        type="button"
        aria-pressed={voto}
        disabled={ocupado}
        onClick={() => void votar()}
        className="underline"
      >
        Útil ({utiles + Number(voto) - Number(votoPropio)})
      </button>
      <button
        type="button"
        onClick={() => void compartir()}
        className="underline"
      >
        Compartir
      </button>
      {enlace && (
        <div className="flex w-full flex-wrap items-center gap-2">
          <input
            aria-label="Enlace de la reseña"
            readOnly
            value={enlace}
            onFocus={(evento) => evento.target.select()}
            className="min-w-0 flex-1 rounded border border-stone-300 p-1"
          />
          <button
            type="button"
            onClick={() => void copiarEnlace()}
            className="font-semibold underline"
          >
            Copiar enlace
          </button>
          {avisoEnlace && (
            <p role="status" className="w-full">
              {avisoEnlace}
            </p>
          )}
        </div>
      )}
      {aviso && <p role="alert">{aviso}</p>}
    </div>
  );
}
