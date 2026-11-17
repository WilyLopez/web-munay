"use client";

import { useState } from "react";

export function BotonCopiarEnlaceTransmision({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const url = new URL(
      `/pantalla-qr?destino=${encodeURIComponent(slug)}`,
      window.location.origin,
    ).href;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label="Copiar enlace para transmitir en tablet o pantalla"
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-900 bg-white px-4 text-sm font-semibold text-teal-950 hover:bg-teal-50 active:scale-95 transition-transform"
    >
      {copiado ? "✓ Enlace copiado" : "Copiar enlace de transmisión"}
    </button>
  );
}
