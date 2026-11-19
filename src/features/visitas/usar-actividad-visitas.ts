"use client";
import { useEffect, useState } from "react";

export function useActividadVisitas(
  slug: string,
  actualizar: () => Promise<void>,
  habilitado: boolean,
) {
  const [estado, cambiarEstado] = useState<{
    slug: string;
    conectado: boolean;
  }>();
  useEffect(() => {
    if (!habilitado) return;
    let fuente: EventSource | undefined;
    function desconectar() {
      fuente?.close();
      fuente = undefined;
      cambiarEstado({ slug, conectado: false });
    }
    function conectar() {
      if (document.hidden || !navigator.onLine) return;
      fuente?.close();
      const actual = new EventSource(
        `/api/visitas/${encodeURIComponent(slug)}/eventos`,
      );
      fuente = actual;
      actual.addEventListener("estado", (evento) => {
        if (fuente !== actual) return;
        try {
          const datos = JSON.parse((evento as MessageEvent).data) as {
            conectado?: unknown;
          };
          cambiarEstado({ slug, conectado: datos.conectado === true });
        } catch {
          cambiarEstado({ slug, conectado: false });
        }
      });
      actual.addEventListener("actualizacion", () => {
        if (fuente === actual) void actualizar();
      });
      actual.onerror = () => {
        if (fuente === actual) cambiarEstado({ slug, conectado: false });
      };
    }
    function visibilidad() {
      if (document.hidden) desconectar();
      else conectar();
    }
    conectar();
    document.addEventListener("visibilitychange", visibilidad);
    window.addEventListener("offline", desconectar);
    window.addEventListener("online", conectar);
    return () => {
      fuente?.close();
      fuente = undefined;
      document.removeEventListener("visibilitychange", visibilidad);
      window.removeEventListener("offline", desconectar);
      window.removeEventListener("online", conectar);
    };
  }, [slug, actualizar, habilitado]);
  return habilitado && estado?.slug === slug && estado.conectado;
}
