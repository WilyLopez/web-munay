"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BotonActualizarPanel({
  reintentar = false,
}: {
  reintentar?: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      className="w-fit font-semibold underline disabled:opacity-60"
      onClick={() => iniciar(() => router.refresh())}
    >
      {pendiente ? "Consultando…" : reintentar ? "Reintentar" : "Actualizar"}
    </button>
  );
}
