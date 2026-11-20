"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fechaVisita as formatoFechaVisita } from "@/features/visitas/tipos";
import { AdjuntarFotoResena, type FotoResena } from "./adjuntar-foto-resena";
import { OpcionesIdentificacion } from "@/features/autenticacion/opciones-identificacion";
import { enlaceEscribirResena } from "./enlaces";
import { guardarBorrador, leerBorrador, borrarBorrador } from "./borrador";
import { subirFotoPendiente } from "./adjuntar-foto-resena";
import { publicarResena } from "./acciones";

function suscribirFormulario() {
  return () => {};
}
function formularioEnCliente() {
  return true;
}
function formularioEnServidor() {
  return false;
}

export function FormularioResena({
  slug,
  fechaVisita,
  puntosResena = 10,
  puntosSelfie = 5,
  invitado = false,
  visitaPrevia = false,
}: {
  slug: string;
  fechaVisita?: string | null;
  puntosResena?: number;
  puntosSelfie?: number;
  invitado?: boolean;
  visitaPrevia?: boolean;
}) {
  const router = useRouter();
  const [recuperando, cambiarRecuperando] = useState(false);
  const enCliente = useSyncExternalStore(
    suscribirFormulario,
    formularioEnCliente,
    formularioEnServidor,
  );
  const formularioListo = enCliente && !recuperando;
  const [identificar, cambiarIdentificar] = useState(false);
  const [restaurado, cambiarRestaurado] = useState(false);
  const identificacion = useRef<HTMLElement>(null);
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
      .catch(() => {})
      .finally(() => {
        if (activo) cambiarRecuperando(false);
      });
    return () => {
      activo = false;
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [slug]);
  useEffect(() => {
    if (identificar) {
      identificacion.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      identificacion.current?.focus({ preventScroll: true });
    }
  }, [identificar]);
  const faltaNota = Boolean(error && !calificacion);
  const faltaComentario = Boolean(error && calificacion && !comentario.trim());

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formularioListo || publicando || subiendo) return;
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
      cambiarError(
        invitado
          ? "No pudimos guardar tu borrador en este dispositivo. Mantén esta página abierta e inténtalo de nuevo."
          : "Se perdió la conexión. Puedes volver a publicar.",
      );
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
          href={`/destinos/${encodeURIComponent(slug)}#opiniones`}
          className="inline-flex min-h-11 items-center text-sm font-semibold underline"
        >
          Ver opiniones del destino
        </Link>
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
        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-[#174238]">
            Cuéntanos cómo fue tu visita
          </h3>
          <p className="text-sm text-stone-700">
            Gana {puntosResena} puntos por tu reseña y {puntosSelfie}{" "}
            adicionales con una selfie.
          </p>
        </div>
        {fechaVisita && (
          <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
            <p className="font-semibold">Fecha de visita</p>
            <time dateTime={fechaVisita}>
              {formatoFechaVisita.format(new Date(fechaVisita))}
            </time>
          </div>
        )}
        <fieldset
          disabled={!formularioListo || publicando || identificar}
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
            disabled={!formularioListo || publicando || identificar}
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
        <details
          open={Boolean(foto)}
          className="rounded-xl border border-[#d5e0d6] bg-white px-4"
        >
          <summary className="flex min-h-13 cursor-pointer items-center justify-between gap-3 py-3 text-sm font-semibold text-[#174238]">
            {foto ? "Foto de tu visita" : "Agregar una foto · opcional"}
            <span className="rounded-full bg-[#edf4ee] px-2 py-1 text-xs">
              +{puntosSelfie} puntos con selfie
            </span>
          </summary>
          <AdjuntarFotoResena
            slug={slug}
            invitado={invitado}
            foto={foto}
            cambiarFoto={cambiarFoto}
            ocupado={!formularioListo || publicando || identificar}
            cambiarSubiendo={cambiarSubiendo}
            bono={puntosSelfie}
          />
        </details>
        <details className="text-xs leading-relaxed text-stone-600">
          <summary className="flex min-h-11 cursor-pointer items-center underline underline-offset-4">
            Condiciones de puntos y beneficios
          </summary>
          <p>
            El bono de selfie se basa en tu declaración. Las publicaciones
            pueden revisarse y los puntos revertirse si la reseña es retirada.
            Los beneficios y descuentos estarán sujetos a disponibilidad y
            condiciones de los atractivos participantes.
          </p>
        </details>
        {error && (
          <p
            id="error-publicacion-resena"
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"
          >
            {error}
          </p>
        )}
        <div className="pt-2">
          {!identificar ? (
            <button
              type="submit"
              disabled={publicando || subiendo}
              className="inline-flex min-h-12 w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#174238] px-8 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-[#102e27] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subiendo ? (
                <>
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Subiendo foto…</span>
                </>
              ) : publicando ? (
                <>
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Publicando reseña…</span>
                </>
              ) : reintento ? (
                <>
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Reintentar publicación</span>
                </>
              ) : (
                <>
                  <svg
                    className="size-5 text-emerald-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span>Publicar reseña</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <svg
                className="size-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Tu reseña está lista para publicarse. Inicia sesión abajo para
                confirmar la autoría.
              </span>
            </div>
          )}
        </div>
      </form>
      {identificar && (
        <section
          ref={identificacion}
          tabIndex={-1}
          aria-labelledby="identificar-titulo"
          className="rounded-2xl border border-[#c5d6ca] bg-white p-5 text-[#174238] focus:outline-none sm:p-6"
        >
          <h2 id="identificar-titulo" className="font-serif text-2xl">
            Identifícate para publicar
          </h2>
          <p className="mb-5 mt-2 text-sm leading-relaxed text-stone-600">
            Tu borrador y tu foto están guardados por 24 horas en este
            dispositivo. Con Google no necesitas crear una contraseña.
          </p>
          <OpcionesIdentificacion
            volver={enlaceEscribirResena(slug, visitaPrevia)}
          />
          <button
            type="button"
            onClick={() => cambiarIdentificar(false)}
            className="mt-2 min-h-11 w-full text-sm font-semibold underline underline-offset-4"
          >
            Seguir editando
          </button>
        </section>
      )}
    </>
  );
}
