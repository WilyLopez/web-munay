"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AvisoExpiracion({ venceEn }: { venceEn: string }) {
  const router = useRouter();

  useEffect(() => {
    const espera = Math.max(0, Date.parse(venceEn) - Date.now());
    const temporizador = window.setTimeout(
      () => router.replace("/ingresar?aviso=inactividad"),
      espera,
    );
    return () => window.clearTimeout(temporizador);
  }, [router, venceEn]);

  return null;
}
