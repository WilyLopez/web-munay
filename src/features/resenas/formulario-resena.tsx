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
import { comprobarSesionResena, publicarResena } from "./acciones";
import { RecompensaPublicada } from "./recompensa-publicada";

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
  const [sesionRecuperada, cambiarSesionRecuperada] = useState(false);
  const [comprobandoSesion, cambiarComprobandoSesion] = useState(false);
  const comprobacionEnCurso = useRef(false);
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
  const [resenaPublicada, cambiarResenaPublicada] = useState<string>();
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

  useEffect(() => {
    if (!invitado && !identificar) return;
    let activo = true;
    async function comprobar() {
      if (comprobacionEnCurso.current || document.visibilityState === "hidden")
        return;
      comprobacionEnCurso.current = true;
      try {
        const resultado = await comprobarSesionResena(slug);
        if (activo && resultado.ok && resultado.datos.estado === "habilitada") {
          cambiarSesionRecuperada(true);
          cambiarIdentificar(false);
        }
        if (activo && resultado.ok && resultado.datos.estado === "publicada")
          router.refresh();
      } catch {
        // La comprobación al volver a la pestaña no debe interrumpir la edición.
      } finally {
        comprobacionEnCurso.current = false;
      }
    }
    void comprobar();
    window.addEventListener("focus", comprobar);
    window.addEventListener("pageshow", comprobar);
    document.addEventListener("visibilitychange", comprobar);
    return () => {
      activo = false;
      window.removeEventListener("focus", comprobar);
      window.removeEventListener("pageshow", comprobar);
      document.removeEventListener("visibilitychange", comprobar);
    };
  }, [invitado, identificar, slug, router]);

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
      if ((invitado && !sesionRecuperada) || identificar) {
        cambiarComprobandoSesion(true);
        const sesion = await comprobarSesionResena(slug);
        cambiarComprobandoSesion(false);
        if (sesion.ok && sesion.datos.estado === "habilitada") {
          cambiarSesionRecuperada(true);
          cambiarIdentificar(false);
        } else if (sesion.ok && sesion.datos.estado === "publicada") {
          cambiarResenaPublicada(sesion.datos.resenaId ?? undefined);
          cambiarPublicada(true);
          router.refresh();
          return;
        } else {
          await guardarBorrador(slug, calificacion, texto, foto);
          if (!sesion.ok && sesion.estado === 401) cambiarIdentificar(true);
          else
            cambiarError(
              sesion.ok
                ? "Primero verifica tu visita para publicar tu reseña."
                : sesion.mensaje,
            );
          return;
        }
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
        cambiarResenaPublicada(resultado.datos.id);
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
      cambiarComprobandoSesion(false);
    }
  }

  if (publicada && resenaPublicada)
    return <RecompensaPublicada id={resenaPublicada} />;
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
        aria-busy={publicando || subiendo}
        className="scroll-mt-28 space-y-5 rounded-2xl border border-[#d5e0d6] bg-[#fffdf6] p-4 pb-32 sm:p-6"
      >
        {restaurado && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"
          >
            Recuperamos tu borrador. Revísalo y confirma la publicación.
          </p>
        )}
        {sesionRecuperada && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"
          >
            Ya iniciaste sesión. Tu reseña está lista para revisar y publicar.
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
          disabled={!formularioListo || publicando}
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
                className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors motion-safe:active:scale-95 ${
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
            disabled={!formularioListo || publicando}
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
            invitado={invitado && !sesionRecuperada}
            foto={foto}
            cambiarFoto={cambiarFoto}
            ocupado={!formularioListo || publicando}
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d5e0d6] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_#14382e0d] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="mx-auto max-w-2xl">
            <p className="mb-2 text-xs text-[#526a60] sm:hidden">
              {identificar
                ? "Tu borrador está guardado. Identifícate para terminar."
                : "La foto es opcional. Publica cuando estés listo."}
            </p>
            <button
              type="submit"
              disabled={!formularioListo || publicando || subiendo}
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#174238] px-8 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-[#102e27] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {!formularioListo
                ? "Preparando formulario…"
                : subiendo
                  ? "Subiendo foto…"
                  : comprobandoSesion
                    ? "Comprobando tu sesión…"
                    : publicando
                      ? "Publicando…"
                      : reintento
                        ? "Reintentar publicación"
                        : identificar
                          ? "Ya inicié sesión, publicar"
                          : invitado && !sesionRecuperada
                            ? "Continuar para publicar"
                            : "Publicar mi reseña"}
            </button>
          </div>
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
