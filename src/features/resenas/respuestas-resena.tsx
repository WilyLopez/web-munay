"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ContenidoResena } from "./contenido-resena";
import { IconoResena } from "./icono-resena";
import {
  consultarRespuestas,
  publicarRespuesta,
  retirarRespuesta,
} from "./acciones";
import type { ListadoRespuestas } from "./tipos";

export function RespuestasResena({
  resenaId,
  total = 0,
  puedeResponder = false,
  oficial = false,
  nombreDestino,
}: {
  resenaId: string;
  total?: number;
  puedeResponder?: boolean;
  oficial?: boolean;
  nombreDestino?: string;
}) {
  const router = useRouter();
  const campoRespuesta = useRef<HTMLTextAreaElement>(null);
  const enfocarRespuesta = useRef(false);
  const [abierto, cambiarAbierto] = useState(false);
  const [datos, cambiarDatos] = useState<ListadoRespuestas>();
  const [pagina, cambiarPagina] = useState(1);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const [texto, cambiarTexto] = useState("");
  const [confirmacion, cambiarConfirmacion] = useState("");
  const solicitud = useRef<{ id: string; texto: string }>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const confirmado = useRef(false);

  async function cargar(numero: number) {
    cambiarOcupado(true);
    cambiarError("");
    try {
      const resultado = await consultarRespuestas(resenaId, numero);
      if (resultado.ok) {
        cambiarDatos(resultado.datos);
        cambiarPagina(numero);
      } else cambiarError(resultado.mensaje);
    } catch {
      cambiarError("No pudimos cargar las respuestas. Inténtalo de nuevo.");
    } finally {
      cambiarOcupado(false);
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const comentario = texto.trim();
    if (ocupado || !comentario) return;
    if (oficial && !confirmado.current) {
      dialogo.current?.showModal();
      return;
    }
    confirmado.current = false;
    cambiarOcupado(true);
    cambiarError("");
    cambiarMensaje("");
    if (solicitud.current?.texto !== comentario)
      solicitud.current = { id: crypto.randomUUID(), texto: comentario };
    try {
      const resultado = await publicarRespuesta(
        resenaId,
        comentario,
        solicitud.current.id,
      );
      if (!resultado.ok) {
        cambiarError(resultado.mensaje);
        return;
      }
      cambiarTexto("");
      solicitud.current = null;
      cambiarMensaje("Tu respuesta se publicó.");
      await cargar(1);
      router.refresh();
    } catch {
      cambiarError(
        "No pudimos confirmar el envío. Tu respuesta sigue aquí para reintentar.",
      );
    } finally {
      cambiarOcupado(false);
    }
  }

  async function quitar(id: string) {
    cambiarOcupado(true);
    cambiarError("");
    try {
      const resultado = await retirarRespuesta(id);
      if (!resultado.ok) {
        cambiarError(resultado.mensaje);
        return;
      }
      cambiarConfirmacion("");
      cambiarMensaje("Tu respuesta fue retirada.");
      await cargar(pagina);
      router.refresh();
    } catch {
      cambiarError("No pudimos retirar la respuesta. Inténtalo de nuevo.");
    } finally {
      cambiarOcupado(false);
    }
  }

  const habilitado = datos?.puedeResponder ?? puedeResponder;

  useEffect(() => {
    if (
      abierto &&
      habilitado &&
      enfocarRespuesta.current &&
      campoRespuesta.current
    ) {
      campoRespuesta.current.focus();
      enfocarRespuesta.current = false;
    }
  }, [abierto, habilitado]);

  return (
    <div className="contents">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={`respuestas-${resenaId}`}
        disabled={ocupado}
        onClick={() => {
          enfocarRespuesta.current = !abierto && total === 0;
          cambiarAbierto(!abierto);
          if (!abierto && !datos) void cargar(1);
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#526a60] hover:bg-[#edf4ed] aria-expanded:bg-[#edf4ed] disabled:opacity-60"
      >
        <IconoResena tipo="responder" />
        {abierto
          ? "Cerrar respuestas"
          : total > 0
            ? `Ver respuestas (${total})`
            : "Responder"}
      </button>
      {abierto && (
        <div
          id={`respuestas-${resenaId}`}
          className="w-full basis-full space-y-4 border-t border-[#e5e9df] pt-4"
        >
          {ocupado && (
            <p role="status" className="text-sm text-stone-600">
              Actualizando respuestas…
            </p>
          )}
          {datos?.respuestas.length === 0 && (
            <p className="text-sm text-stone-600">
              Todavía no hay respuestas. Puedes iniciar la conversación.
            </p>
          )}
          <ul className="space-y-3" aria-label="Respuestas a la reseña">
            {datos?.respuestas.map((respuesta) => (
              <li
                key={respuesta.id}
                className="space-y-2 rounded-xl border-l-2 border-[#aac4b2] bg-white p-3 sm:p-4"
              >
                {respuesta.oficial && (
                  <p className="mb-2 text-xs font-semibold text-[#174238]">
                    Respuesta oficial del atractivo
                  </p>
                )}
                <ContenidoResena
                  autor={
                    respuesta.oficial
                      ? (nombreDestino ?? respuesta.usuario.nombreCompleto)
                      : respuesta.usuario.nombreCompleto
                  }
                  creadaEn={respuesta.creadaEn}
                  comentario={respuesta.comentario}
                  compacto
                />
                {respuesta.propia &&
                  (confirmacion === respuesta.id ? (
                    <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                      <p>¿Retirar tu respuesta de la conversación?</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => void quitar(respuesta.id)}
                          className="min-h-11 font-semibold underline"
                        >
                          Sí, retirar
                        </button>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => cambiarConfirmacion("")}
                          className="min-h-11 font-semibold underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => cambiarConfirmacion(respuesta.id)}
                      className="min-h-11 text-xs font-semibold underline"
                    >
                      Retirar mi respuesta
                    </button>
                  ))}
              </li>
            ))}
          </ul>
          {datos && (pagina > 1 || datos.hayMas) && (
            <nav
              aria-label="Páginas de respuestas"
              className="flex flex-wrap items-center gap-4 text-sm"
            >
              <button
                type="button"
                disabled={ocupado || pagina === 1}
                onClick={() => void cargar(pagina - 1)}
                className="min-h-11 font-semibold underline disabled:opacity-40"
              >
                Anterior
              </button>
              <span>Página {pagina}</span>
              <button
                type="button"
                disabled={ocupado || !datos.hayMas || pagina >= 9999}
                onClick={() => void cargar(pagina + 1)}
                className="min-h-11 font-semibold underline disabled:opacity-40"
              >
                Siguiente
              </button>
            </nav>
          )}
          {habilitado ? (
            <form ref={formulario} onSubmit={enviar} className="space-y-2">
              <label className="grid gap-2 text-sm font-semibold">
                {oficial ? "Respuesta del encargado" : "Tu respuesta"}
                <textarea
                  ref={campoRespuesta}
                  required
                  maxLength={1000}
                  rows={3}
                  disabled={ocupado}
                  value={texto}
                  onChange={(evento) => cambiarTexto(evento.target.value)}
                  placeholder="Comparte una recomendación o haz una pregunta con respeto."
                  className="w-full rounded-xl border border-[#b9c4b9] bg-white p-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-teal-900 sm:text-sm"
                />
              </label>
              <p className="text-xs text-stone-600">
                {oficial
                  ? "Se publicará como respuesta oficial del atractivo. Agradece la visita y responde con respeto."
                  : "Tu respuesta será pública. Responder no genera puntos."}
              </p>
              <button
                disabled={ocupado || !texto.trim()}
                className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {ocupado
                  ? "Publicando…"
                  : oficial
                    ? "Revisar y publicar"
                    : "Publicar respuesta"}
              </button>
            </form>
          ) : (
            <Link
              href="/ingresar?aviso=sesion"
              className="inline-flex min-h-11 items-center text-sm font-semibold underline"
            >
              Inicia sesión como visitante para responder
            </Link>
          )}
          {mensaje && (
            <p role="status" className="text-sm text-emerald-900">
              {mensaje}
            </p>
          )}
          {error && (
            <div className="space-y-1">
              <p role="alert" className="text-sm text-rose-900">
                {error}
              </p>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => void cargar(pagina)}
                className="min-h-11 text-sm font-semibold underline"
              >
                Reintentar carga de respuestas
              </button>
            </div>
          )}
        </div>
      )}
      {oficial && (
        <dialog
          ref={dialogo}
          aria-labelledby={`confirmar-${resenaId}`}
          className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-[#d5e0d6] bg-white p-6 text-[#14382e] shadow-xl backdrop:bg-black/40"
        >
          <h3 id={`confirmar-${resenaId}`} className="text-lg font-semibold">
            ¿Publicar respuesta oficial?
          </h3>
          <p className="mt-2 text-sm text-[#526a60]">
            Los visitantes verán esta respuesta en nombre de{" "}
            {nombreDestino ? `"${nombreDestino}"` : "tu atractivo"}.
          </p>
          <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap wrap-anywhere rounded-xl bg-[#f0f5ef] p-4 text-sm">
            {texto}
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="min-h-11 rounded-xl border px-4 text-sm font-semibold"
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={() => {
                confirmado.current = true;
                dialogo.current?.close();
                formulario.current?.requestSubmit();
              }}
              className="min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white"
            >
              Confirmar publicación
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
