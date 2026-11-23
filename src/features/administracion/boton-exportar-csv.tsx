"use client";

import { descargarCsv, type ColumnaCsv } from "@/lib/exportar-csv";

export function BotonExportarCsv<T>({
  nombreArchivo,
  columnas,
  datos,
  etiqueta = "Exportar a CSV",
}: {
  nombreArchivo: string;
  columnas: ColumnaCsv<T>[];
  datos: T[];
  etiqueta?: string;
}) {
  if (!datos.length) return null;

  return (
    <button
      type="button"
      onClick={() => descargarCsv(nombreArchivo, columnas, datos)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#ccd9cf] bg-white px-3 py-2 text-xs font-semibold text-[#173b32] hover:bg-[#e6eee6]"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M10 3v10m0 0l-3-3m3 3l3-3M4 17h12" />
      </svg>
      {etiqueta}
    </button>
  );
}
