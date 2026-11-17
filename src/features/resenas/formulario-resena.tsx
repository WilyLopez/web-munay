"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fechaVisita as formatoFechaVisita } from "@/features/visitas/tipos";
import { AdjuntarFotoResena, type FotoResena } from "./adjuntar-foto-resena";
import { publicarResena } from "./acciones";

export function FormularioResena({
  slug,
  fechaVisita,
  puntosResena = 10,
  puntosSelfie = 5,
}: {
  slug: string;
  fechaVisita?: string | null;
  puntosResena?: number;
  puntosSelfie?: number;
}) {
  const router = useRouter();
  const [foto, cambiarFoto] = useState<FotoResena>();
  const [subiendo, cambiarSubiendo] = useState(false);
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
    fotoArchivo?: string;
    selfie?: boolean;
  }>(null);
  const faltaNota = Boolean(error && !calificacion);
  const faltaComentario = Boolean(error && calificacion && !comentario.trim());

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (publicando || subiendo) return;
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
        solicitud.current.comentario !== texto ||
        solicitud.current.fotoArchivo !== foto?.archivo ||
        solicitud.current.selfie !== foto?.selfie
      )
        solicitud.current = {
          id: crypto.randomUUID(),
          calificacion,
          comentario: texto,
          fotoArchivo: foto?.archivo,
          selfie: foto?.selfie,
        };
      const resultado = await publicarResena(
        slug,
        calificacion,
        texto,
        solicitud.current.id,
        foto,
      );
      if (resultado.ok) {
        cambiarPublicada(true);
        router.refresh();
      } else if (resultado.estado === 401)
        router.push("/ingresar?aviso=sesion");
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

  if (publicada)
    return (
      <div
        role="status"
        className="space-y-2 rounded-2xl bg-emerald-50 p-5 text-emerald-950"
      >
        <h3 className="font-semibold">Tu reseña se publicó</h3>
        <p className="text-sm">
          Gracias por compartir tu visita. Los puntos se acreditan después de la
          revisión correspondiente.
        </p>
        <Link
          href="/mi-perfil#ranking"
          className="inline-flex min-h-11 items-center text-sm font-semibold underline"
        >
          Ver mis puntos
        </Link>
      </div>
    );

  return (
    <form
      id="escribir-resena"
      onSubmit={publicar}
      className="scroll-mt-28 space-y-5 rounded-2xl border border-[#d5e0d6] bg-[#fffdf6] p-4 sm:p-6"
    >
      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-[#174238]">
          Cuéntanos cómo fue tu visita
        </h3>
        <p className="text-sm text-stone-700">
          Tu experiencia ayuda a otros viajeros. Recibe {puntosResena} puntos
          por tu reseña verificada.
        </p>
      </div>
      {fechaVisita && (
        <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
          <p className="font-semibold">Fecha de visita</p>
          <time dateTime={fechaVisita}>
            {formatoFechaVisita.format(new Date(fechaVisita))}
          </time>
          <p className="mt-1 text-xs">
            Completada automáticamente con tu visita verificada.
          </p>
        </div>
      )}
      <fieldset
        disabled={publicando}
        aria-invalid={faltaNota}
        aria-describedby={faltaNota ? "error-publicacion-resena" : undefined}
        className={
          faltaNota ? "rounded-xl border border-red-600 p-3" : undefined
        }
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
                className="peer sr-only"
              />
              <span className="rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4">
                {nota} ★
              </span>
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
          placeholder="¿Qué disfrutaste? ¿Qué le recomendarías a alguien que visita el lugar por primera vez?"
          rows={4}
          className="mt-2 block w-full rounded-xl border border-stone-300 p-3 text-base font-normal sm:text-sm aria-invalid:border-red-600 focus-visible:outline-2 focus-visible:outline-teal-900"
        />
      </label>
      <AdjuntarFotoResena
        slug={slug}
        foto={foto}
        cambiarFoto={cambiarFoto}
        ocupado={publicando}
        cambiarSubiendo={cambiarSubiendo}
        bono={puntosSelfie}
      />
      <p className="text-sm font-semibold text-teal-950">
        Puntos de esta reseña:{" "}
        {puntosResena + (foto?.selfie ? puntosSelfie : 0)}
      </p>
      <p className="text-xs text-stone-600">
        El bono de selfie se basa en tu declaración. Las publicaciones pueden
        revisarse y los puntos revertirse si la reseña es retirada.
      </p>
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <h4 className="font-semibold">Acumula puntos y descubre beneficios</h4>
        <p className="mt-1 leading-relaxed">
          Estamos preparando beneficios como entradas y descuentos en atractivos
          participantes. Próximamente podrás consultar las opciones, sus
          condiciones y los puntos necesarios.
        </p>
        <Link
          href="/mi-perfil#ranking"
          className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          Consultar mis puntos
        </Link>
      </aside>
      {error && (
        <p id="error-publicacion-resena" role="alert" className="text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={publicando || subiendo}
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-6 py-2.5 font-semibold text-white transition-transform hover:bg-teal-900 active:scale-95 disabled:opacity-60"
      >
        {subiendo
          ? "Subiendo foto…"
          : publicando
            ? "Publicando…"
            : reintento
              ? "Reintentar publicación"
              : "Publicar"}
      </button>
    </form>
  );
}
