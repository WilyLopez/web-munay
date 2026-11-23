"use client";

import { useEffect } from "react";
import { PantallaErrorPanel } from "@/features/administracion/pantalla-error-panel";

export default function ErrorSuperAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en panel SuperAdmin:", error);
  }, [error]);

  return (
    <PantallaErrorPanel
      error={error}
      reset={reset}
      titulo="Incidencia en el panel de SuperAdmin"
      mensaje="No pudimos completar la consulta o la acción en la plataforma. Intenta reintentar la operación o regresa a la vista general."
      hrefInicio="/superadmin"
    />
  );
}
