"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { publicarResena } from "./acciones";

export function FormularioResena({ slug }: { slug: string }) {
  const router = useRouter();
  const [abierto, abrir] = useState(false);
  const [calificacion, cambiarCalificacion] = useState(0);
  const [comentario, cambiarComentario] = useState("");
  const [error, cambiarError] = useState("");
  const [reintento, cambiarReintento] = useState(false);
  const [publicando, cambiarPublicando] = useState(false);
  const [publicada, cambiarPublicada] = useState(false);
  const faltaNota = Boolean(error && !calificacion);
  const faltaComentario = Boolean(error && calificacion && !comentario.trim());

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (publicando) return;
    cambiarReintento(false);
    if (!calificacion || !comentario.trim()) {
      cambiarError(
        !calificacion
          ? "Selecciona una calificación."
          : "Escribe un comentario.",
      );
      return;
    }
    cambiarError("");
    cambiarPublicando(true);
    try {
      const resultado = await publicarResena(slug, calificacion, comentario);
      if (resultado.ok) cambiarPublicada(true);
      else if (resultado.estado === 401) router.push("/ingresar?aviso=sesion");
      else if (resultado.estado === 0 || resultado.estado >= 500) {
        cambiarError(
          "No pudimos confirmar el envío. Tu borrador sigue aquí. Intenta publicarlo de nuevo.",
        );
        cambiarReintento(true);
      } else cambiarError(resultado.mensaje);
    } catch {
      cambiarError("Se perdió la conexión. Puedes volver a publicar.");
      cambiarReintento(true);
    } finally {
      cambiarPublicando(false);
    }
  }

  if (publicada) return <p role="status">Reseña publicada.</p>;
  if (!abierto)
    return (
      <button
        type="button"
        className="font-semibold underline"
        onClick={() => abrir(true)}
      >
        Escribir una reseña
      </button>
    );

  return (
    <form
      onSubmit={publicar}
      className="space-y-4 rounded-xl border border-stone-300 p-4"
    >
      <fieldset
        disabled={publicando}
        aria-invalid={faltaNota}
        aria-describedby={faltaNota ? "error-publicacion-resena" : undefined}
        className={faltaNota ? "rounded border border-red-600 p-2" : undefined}
      >
        <legend className="font-semibold">Calificación</legend>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((nota) => (
            <label key={nota} className="flex items-center gap-1">
              <input
                type="radio"
                name="calificacion"
                value={nota}
                checked={calificacion === nota}
                onChange={() => cambiarCalificacion(nota)}
              />
              <span>{nota} ★</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block font-semibold">
        Comentario
        <textarea
          disabled={publicando}
          maxLength={2000}
          value={comentario}
          onChange={(evento) => cambiarComentario(evento.target.value)}
          aria-invalid={faltaComentario}
          aria-describedby={
            faltaComentario ? "error-publicacion-resena" : undefined
          }
          rows={4}
          className="mt-2 block w-full rounded-lg border border-stone-300 p-3 font-normal aria-invalid:border-red-600"
        />
      </label>
      {error && (
        <p id="error-publicacion-resena" role="alert" className="text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={publicando}
        className="rounded-full bg-teal-950 px-5 py-2 font-semibold text-white disabled:opacity-60"
      >
        {publicando
          ? "Publicando…"
          : reintento
            ? "Reintentar publicación"
            : "Publicar"}
      </button>
    </form>
  );
}
