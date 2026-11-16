"use client";

import { useId, useState } from "react";
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
  const [compartirNativo, cambiarCompartirNativo] = useState(false);
  const [avisoEnlace, cambiarAvisoEnlace] = useState("");
  const panel = useId();

  async function votar() {
    if (ocupado) return;
    const anterior = voto;
    const siguiente = !anterior;
    cambiarOcupado(true);
    cambiarAviso("");
    cambiarVoto(siguiente);
    try {
      const respuesta = await votarResena(id, siguiente);
      if (respuesta.ok) return;
      cambiarVoto(anterior);
      if (respuesta.estado === 401) router.push("/ingresar?aviso=sesion");
      else cambiarAviso(respuesta.mensaje);
    } catch {
      cambiarVoto(anterior);
      cambiarAviso("No pudimos confirmar tu voto. Inténtalo de nuevo.");
    } finally {
      cambiarOcupado(false);
    }
  }

  function alternarCompartir() {
    cambiarAvisoEnlace("");
    if (enlace) {
      cambiarEnlace("");
      return;
    }
    const url = new URL(
      `/resenas/${encodeURIComponent(id)}`,
      window.location.origin,
    );
    cambiarCompartirNativo(typeof navigator.share === "function");
    cambiarEnlace(url.href);
  }

  async function compartirConAplicacion() {
    cambiarAvisoEnlace("");
    try {
      await navigator.share({ title: "Reseña en Munay", url: enlace });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      cambiarAvisoEnlace("Puedes copiar el enlace para compartir la reseña.");
    }
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
        onClick={alternarCompartir}
        aria-expanded={Boolean(enlace)}
        aria-controls={panel}
        className="underline"
      >
        Compartir
      </button>
      <div id={panel} hidden={!enlace} className="w-full">
        {enlace && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
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
            {compartirNativo && (
              <button
                type="button"
                onClick={() => void compartirConAplicacion()}
                className="font-semibold underline"
              >
                Compartir con una aplicación
              </button>
            )}
            {avisoEnlace && (
              <p role="status" className="w-full">
                {avisoEnlace}
              </p>
            )}
          </div>
        )}
      </div>
      {aviso && <p role="alert">{aviso}</p>}
    </div>
  );
}
