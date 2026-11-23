"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

type TipoNotificacion = "exito" | "error" | "info";

type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
};

type ContextoNotificacionesTipo = {
  notificar: (mensaje: string, tipo?: TipoNotificacion) => void;
  notificarExito: (mensaje: string) => void;
  notificarError: (mensaje: string) => void;
  notificarInfo: (mensaje: string) => void;
};

const ContextoNotificaciones = createContext<ContextoNotificacionesTipo | null>(
  null,
);

export function ProveedorNotificaciones({
  children,
}: {
  children: ReactNode;
}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const baseId = useId();

  const descartar = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notificar = useCallback(
    (mensaje: string, tipo: TipoNotificacion = "info") => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setNotificaciones((prev) => [...prev, { id, tipo, mensaje }]);

      setTimeout(() => {
        descartar(id);
      }, 4000);
    },
    [baseId, descartar],
  );

  const notificarExito = useCallback(
    (mensaje: string) => notificar(mensaje, "exito"),
    [notificar],
  );

  const notificarError = useCallback(
    (mensaje: string) => notificar(mensaje, "error"),
    [notificar],
  );

  const notificarInfo = useCallback(
    (mensaje: string) => notificar(mensaje, "info"),
    [notificar],
  );

  return (
    <ContextoNotificaciones.Provider
      value={{ notificar, notificarExito, notificarError, notificarInfo }}
    >
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-2"
      >
        {notificaciones.map(({ id, tipo, mensaje }) => (
          <div
            key={id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md transition-all ${
              tipo === "exito"
                ? "border-teal-200 bg-teal-50/95 text-teal-950"
                : tipo === "error"
                  ? "border-rose-200 bg-rose-50/95 text-rose-950"
                  : "border-stone-200 bg-white/95 text-[#173b32]"
            }`}
          >
            <div className="flex items-center gap-3">
              {tipo === "exito" && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="m4 10 4 4 8-8" />
                  </svg>
                </span>
              )}
              {tipo === "error" && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="M10 6v5m0 3h.01" />
                  </svg>
                </span>
              )}
              {tipo === "info" && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#174238] text-white">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 9v5m0-8h.01" />
                  </svg>
                </span>
              )}
              <p className="text-xs font-medium leading-relaxed">{mensaje}</p>
            </div>
            <button
              type="button"
              onClick={() => descartar(id)}
              aria-label="Descartar notificación"
              className="shrink-0 rounded-lg p-1 text-stone-500 hover:bg-black/5 hover:text-stone-900"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              >
                <path d="m6 6 8 8m0-8-8 8" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ContextoNotificaciones.Provider>
  );
}

export function useNotificaciones() {
  const contexto = useContext(ContextoNotificaciones);
  if (!contexto) {
    throw new Error(
      "useNotificaciones debe usarse dentro de un ProveedorNotificaciones",
    );
  }
  return contexto;
}
