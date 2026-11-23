"use client";

import { useEffect, useRef, useState } from "react";

const TIEMPO_LIMITE_MS = 30 * 60 * 1000;
const TIEMPO_AVISO_MS = 28 * 60 * 1000;

export function AvisoVencimientoSesion() {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(120);
  const ultimaActividad = useRef(0);

  const registrarActividad = () => {
    ultimaActividad.current = Date.now();
    if (mostrarAviso) {
      setMostrarAviso(false);
    }
  };

  const extenderSesion = async () => {
    try {
      await fetch("/api/autenticacion/ping", { method: "HEAD" }).catch(() => {});
    } finally {
      registrarActividad();
    }
  };

  useEffect(() => {
    if (ultimaActividad.current === 0) {
      ultimaActividad.current = Date.now();
    }

    const eventos = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => {
      if (!mostrarAviso) {
        ultimaActividad.current = Date.now();
      }
    };

    eventos.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    const intervalo = setInterval(() => {
      if (ultimaActividad.current === 0) return;
      const tiempoInactivo = Date.now() - ultimaActividad.current;

      if (tiempoInactivo >= TIEMPO_LIMITE_MS) {
        setSegundosRestantes(0);
      } else if (tiempoInactivo >= TIEMPO_AVISO_MS) {
        setMostrarAviso(true);
        setSegundosRestantes(
          Math.max(0, Math.ceil((TIEMPO_LIMITE_MS - tiempoInactivo) / 1000)),
        );
      } else {
        setMostrarAviso(false);
      }
    }, 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, handler));
      clearInterval(intervalo);
    };
  }, [mostrarAviso]);

  if (!mostrarAviso) return null;

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const textoTiempo = `${minutos}:${segundos.toString().padStart(2, "0")}`;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[92%] max-w-lg rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-amber-950 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
          !
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Tu sesión está por expirar</p>
          <p className="mt-0.5 text-xs text-amber-800">
            Se cerrará automáticamente en {textoTiempo} por inactividad.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void extenderSesion()}
              className="rounded-xl bg-[#174238] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#23574a]"
            >
              Mantener sesión activa
            </button>
            <button
              type="button"
              onClick={() => setMostrarAviso(false)}
              className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/50"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
