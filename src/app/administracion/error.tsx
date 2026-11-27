"use client";

import { useEffect } from "react";
import { PantallaErrorPanel } from "@/features/administracion/pantalla-error-panel";

export default function ErrorAdministracion({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en panel de administración de atractivo:", error);
  }, [error]);

  return (
    <PantallaErrorPanel
      error={error}
      reset={reset}
      titulo="Incidencia en el panel del encargado"
      mensaje="No pudimos cargar la información de tu atractivo turístico o la sesión se interrumpió temporalmente. Puedes reintentar ahora."
      hrefInicio="/administracion"
    />
  );
}
