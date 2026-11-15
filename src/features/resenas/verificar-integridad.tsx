"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Resena } from "./tipos";

type Evidencia = {
  estado: "pendiente" | "confirmado" | "no-coincide";
  huella?: string;
  transaccion?: string;
  bloque?: string | null;
};
type Consulta =
  { estado: "cargando" } | { estado: "error"; mensaje: string } | Evidencia;
const enlace =
  "text-sm font-semibold text-teal-900 underline underline-offset-4";
const mensajes = {
  pendiente:
    "El registro está pendiente de confirmación. Podrás verificarlo cuando esté disponible.",
  confirmado:
    "Integridad confirmada. La huella del contenido coincide con el registro en Sepolia.",
  "no-coincide":
    "El contenido publicado no coincide con el registro consultado.",
};

export function VerificarIntegridad({
  id,
  registro,
}: {
  id: string;
  registro?: Resena["integridad"];
}) {
  const [consulta, cambiarConsulta] = useState<Consulta>();
  const peticion = useRef<AbortController>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const titulo = useId();
  const abierto = Boolean(consulta);

  useEffect(() => () => peticion.current?.abort(), []);
  useEffect(() => {
    if (abierto) panel.current?.focus();
  }, [abierto]);

  async function verificar() {
    peticion.current?.abort();
    const control = new AbortController();
    peticion.current = control;
    cambiarConsulta({ estado: "cargando" });
    try {
      const respuesta = await fetch(
        `/api/resenas/${encodeURIComponent(id)}/integridad`,
        { signal: control.signal, cache: "no-store" },
      );
      const resultado = await respuesta.json();
      if (control.signal.aborted) return;
      if (!respuesta.ok) {
        cambiarConsulta({
          estado: "error",
          mensaje: resultado.mensaje ?? "No pudimos consultar el registro.",
        });
        return;
      }
      cambiarConsulta(resultado as Evidencia);
    } catch {
      if (!control.signal.aborted)
        cambiarConsulta({
          estado: "error",
          mensaje: "Se interrumpió la conexión. Intenta nuevamente.",
        });
    }
  }

  function volver() {
    peticion.current?.abort();
    cambiarConsulta(undefined);
    requestAnimationFrame(() => boton.current?.focus());
  }

  if (!consulta)
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-700">
        {registro ? (
          <span>
            Huella SHA-256{" "}
            <code title={registro.huella}>
              {registro.huella.slice(0, 12)}…{registro.huella.slice(-6)}
            </code>
          </span>
        ) : (
          <span>Registro blockchain pendiente</span>
        )}
        <button
          ref={boton}
          type="button"
          className={enlace}
          onClick={() => void verificar()}
        >
          Verificar integridad
        </button>
        {registro?.transaccion && (
          <a
            href={`https://sepolia.etherscan.io/tx/${encodeURIComponent(registro.transaccion)}`}
            target="_blank"
            rel="noreferrer"
            className={enlace}
          >
            Ver transacción
          </a>
        )}
      </div>
    );

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-labelledby={titulo}
      className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950"
    >
      <h3 id={titulo} className="font-semibold">
        Integridad de la reseña
      </h3>
      <p>
        La huella identifica el contenido. La transacción permite consultar la
        evidencia pública en Sepolia.
      </p>
      {consulta.estado === "cargando" ? (
        <div role="status" className="space-y-2">
          <p>Consultando el registro en blockchain…</p>
          <progress
            aria-label="Consultando el registro"
            className="block h-2 w-full max-w-60 accent-teal-800"
          />
        </div>
      ) : consulta.estado === "error" ? (
        <div className="space-y-2">
          <p role="alert" className="text-rose-900">
            {consulta.mensaje}
          </p>
          <button
            type="button"
            className={enlace}
            onClick={() => void verificar()}
          >
            Reintentar consulta
          </button>
        </div>
      ) : (
        <>
          <p
            role="status"
            className={
              consulta.estado === "no-coincide"
                ? "font-semibold text-rose-900"
                : "font-semibold"
            }
          >
            {mensajes[consulta.estado]}
          </p>
          {consulta.huella && (
            <p className="wrap-anywhere">
              Huella SHA-256 <code>{consulta.huella}</code>
            </p>
          )}
          {consulta.bloque && <p>Bloque {consulta.bloque}</p>}
          {consulta.transaccion && (
            <a
              href={`https://sepolia.etherscan.io/tx/${encodeURIComponent(consulta.transaccion)}`}
              target="_blank"
              rel="noreferrer"
              className={`${enlace} block wrap-anywhere`}
            >
              Ver transacción en Sepolia · {consulta.transaccion}
            </a>
          )}
        </>
      )}
      <p className="text-xs text-stone-700">
        La veracidad de la experiencia sigue dependiendo del testimonio del
        visitante.
      </p>
      <button type="button" className={enlace} onClick={volver}>
        Volver a la reseña
      </button>
    </section>
  );
}
