"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ReintentarOpiniones() {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      className="font-semibold underline disabled:opacity-60"
      onClick={() => iniciar(() => router.refresh())}
    >
      {pendiente ? "Cargando reseñas…" : "Reintentar"}
    </button>
  );
}
