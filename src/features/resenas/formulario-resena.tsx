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
  const [recuperando, cambiarRecuperando] = useState(true);
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
            className="text-red-800"
          >
            {error}
          </p>
        )}
        {!identificar && (
          <button
            disabled={!formularioListo || publicando || subiendo}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-6 py-2.5 font-semibold text-white transition-transform hover:bg-teal-900 active:scale-95 disabled:opacity-60"
          >
            {!formularioListo
              ? "Preparando formulario…"
              : subiendo
                ? "Subiendo foto…"
                : publicando
                  ? "Publicando…"
                  : reintento
                    ? "Reintentar publicación"
                    : invitado
                      ? "Continuar para publicar"
                      : "Publicar mi reseña"}
          </button>
        )}
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
