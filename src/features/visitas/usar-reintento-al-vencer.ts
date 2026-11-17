"use client";

import { useEffect } from "react";

export function useReintentoAlVencer(
  codigoVencido: boolean,
  sincronizar: () => Promise<void>,
) {
  useEffect(() => {
    if (!codigoVencido || document.hidden || !navigator.onLine) return;
    const reintento = window.setTimeout(() => {
      if (!document.hidden) void sincronizar();
    }, 350);
    return () => window.clearTimeout(reintento);
  }, [codigoVencido, sincronizar]);
}
