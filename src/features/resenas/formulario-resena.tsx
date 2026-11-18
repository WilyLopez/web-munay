"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fechaVisita as formatoFechaVisita } from "@/features/visitas/tipos";
import { AdjuntarFotoResena, type FotoResena } from "./adjuntar-foto-resena";
import { BotonGoogle } from "@/features/autenticacion/boton-google";
import { enlaceEscribirResena } from "./enlaces";
import { guardarBorrador, leerBorrador, borrarBorrador } from "./borrador";
import { subirFotoPendiente } from "./adjuntar-foto-resena";
import { publicarResena } from "./acciones";

export function FormularioResena({
  slug,
  fechaVisita,
  puntosResena = 10,
  puntosSelfie = 5,
  invitado = false,
}: {
  slug: string;
  fechaVisita?: string | null;
  puntosResena?: number;
  puntosSelfie?: number;
  invitado?: boolean;
}) {
  const router = useRouter();
  const [identificar, cambiarIdentificar] = useState(false);
  const [restaurado, cambiarRestaurado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
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
  useEffect(() => {
    let activo = true;
    let url: string | undefined;
    void leerBorrador(slug)
      .then((datos) => {
        if (!activo || !datos) return;
        cambiarCalificacion(datos.calificacion);
        cambiarComentario(datos.comentario);
        if (datos.foto) {
          url = datos.foto.blob
            ? URL.createObjectURL(datos.foto.blob)
            : datos.foto.url;
          cambiarFoto({ ...datos.foto, url });
        }
        cambiarRestaurado(true);
      })
      .catch(() => {});
    return () => {
      activo = false;
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [slug]);
  useEffect(() => {
    if (identificar) dialogo.current?.showModal();
  }, [identificar]);
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
      if (invitado) {
        await guardarBorrador(slug, calificacion, texto, foto);
        cambiarIdentificar(true);
        return;
      }
      let fotoEnvio = foto;
      if (foto?.blob) {
        fotoEnvio = {
          ...(await subirFotoPendiente(slug, foto.blob)),
          selfie: foto.selfie,
          consentimiento: foto.consentimiento,
        };
        cambiarFoto(fotoEnvio);
      }
      if (
        solicitud.current?.calificacion !== calificacion ||
        solicitud.current.comentario !== texto ||
        solicitud.current.fotoArchivo !== fotoEnvio?.archivo ||
        solicitud.current.selfie !== fotoEnvio?.selfie
      )
        solicitud.current = {
          id: crypto.randomUUID(),
          calificacion,
          comentario: texto,
          fotoArchivo: fotoEnvio?.archivo,
          selfie: fotoEnvio?.selfie,
        };
      const resultado = await publicarResena(
        slug,
        calificacion,
        texto,
        solicitud.current.id,
        fotoEnvio,
      );
      if (resultado.ok) {
        await borrarBorrador(slug).catch(() => {});
        cambiarPublicada(true);
        router.refresh();
      } else if (resultado.estado === 401) {
        await guardarBorrador(slug, calificacion, texto, fotoEnvio);
        cambiarIdentificar(true);
      } else if (resultado.estado === 0 || resultado.estado >= 500) {
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
    <>
      <form
        id="escribir-resena"
        onSubmit={publicar}
        className="scroll-mt-28 space-y-5 rounded-2xl border border-[#d5e0d6] bg-[#fffdf6] p-4 sm:p-6"
      >
        {restaurado && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"
          >
            Recuperamos tu borrador. Revísalo y confirma la publicación.
          </p>
        )}
        {invitado && (
          <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
            Prepara tu reseña aquí. Al terminar podrás identificarte con Google
            o con tu correo para publicarla. Tu visita se conserva durante 24
            horas.
          </p>
        )}
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
          invitado={invitado}
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
          <h4 className="font-semibold">
            Acumula puntos y descubre beneficios
          </h4>
          <p className="mt-1 leading-relaxed">
            Estamos preparando beneficios como entradas y descuentos en
            atractivos participantes. Próximamente podrás consultar las
            opciones, sus condiciones y los puntos necesarios.
          </p>
          <Link
            href="/mi-perfil#ranking"
            className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            Consultar mis puntos
          </Link>
        </aside>
        {error && (
          <p
            id="error-publicacion-resena"
            role="alert"
            className="text-red-800"
          >
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
                : invitado
                  ? "Continuar para publicar"
                  : "Publicar"}
        </button>
      </form>
      <dialog
        ref={dialogo}
        onClose={() => cambiarIdentificar(false)}
        aria-labelledby="identificar-titulo"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#d5e0d6] bg-white p-5 text-[#174238] shadow-xl backdrop:bg-black/45 sm:p-7"
      >
        <h2 id="identificar-titulo" className="font-serif text-2xl">
          Tu reseña está lista
        </h2>
        <p className="mb-5 mt-2 text-sm leading-relaxed text-stone-600">
          Guardamos tu borrador y tu foto en este dispositivo durante 24 horas.
          Identifícate para asociar la visita a tu cuenta y publicar.
        </p>
        <BotonGoogle volver={enlaceEscribirResena(slug)} />
        <Link
          href={`/ingresar?volver=${encodeURIComponent(enlaceEscribirResena(slug))}`}
          className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#174238] px-4 font-semibold text-white"
        >
          Continuar con correo
        </Link>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="mt-3 min-h-11 w-full text-sm font-semibold underline"
        >
          Seguir editando
        </button>
      </dialog>
    </>
  );
}
