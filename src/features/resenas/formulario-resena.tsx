"use client";

import { useRef, useState, type FormEvent } from "react";
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
  const solicitud = useRef<{
    id: string;
    calificacion: number;
    comentario: string;
  }>(null);
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
      const texto = comentario.trim();
      if (
        solicitud.current?.calificacion !== calificacion ||
        solicitud.current.comentario !== texto
      )
        solicitud.current = {
          id: crypto.randomUUID(),
          calificacion,
          comentario: texto,
        };
      const resultado = await publicarResena(
        slug,
        calificacion,
        texto,
        solicitud.current.id,
      );
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
        className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
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
        className={faltaNota ? "rounded-xl border border-red-600 p-3" : undefined}
      >
        <legend className="font-semibold text-[#174238]">Calificación</legend>
        <div className="flex flex-wrap gap-2 pt-2">
          {[1, 2, 3, 4, 5].map((nota) => (
            <label
              key={nota}
              className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                calificacion === nota
                  ? "border-[#174238] bg-[#174238] text-white shadow-sm"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <input
                type="radio"
                name="calificacion"
                value={nota}
                checked={calificacion === nota}
                onChange={() => cambiarCalificacion(nota)}
                className="sr-only"
              />
              <span>{nota} ★</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block font-semibold text-[#174238]">
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
          className="mt-2 block w-full rounded-xl border border-stone-300 p-3 text-base font-normal sm:text-sm aria-invalid:border-red-600 focus-visible:outline-2 focus-visible:outline-teal-900"
        />
      </label>
      {error && (
        <p id="error-publicacion-resena" role="alert" className="text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={publicando}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-6 py-2.5 font-semibold text-white transition-transform hover:bg-teal-900 active:scale-95 disabled:opacity-60"
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
