"use client";

import Link from "next/link";
import { useState } from "react";

export function PantallaErrorPanel({
  error,
  reset,
  titulo = "Ocurrió un error en el panel",
  mensaje = "No pudimos cargar la información solicitada. Esto puede deberse a una pérdida temporal de conexión o a una consulta interrumpida.",
  hrefInicio = "/superadmin",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  titulo?: string;
  mensaje?: string;
  hrefInicio?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiarDiagnostico = () => {
    const info = `Error: ${error.message}\nDigest: ${error.digest ?? "N/A"}\nFecha: ${new Date().toISOString()}`;
    void navigator.clipboard.writeText(info).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-[#dce3da] bg-white p-6 sm:p-10 shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="size-7"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#173b32] sm:text-3xl">
            {titulo}
          </h1>
          <p className="text-sm leading-relaxed text-[#4d665b]">
            {mensaje}
          </p>
        </div>

        {error.digest && (
          <div className="rounded-xl bg-[#f4f5ef] p-3 text-xs text-[#4d665b]">
            <p className="font-medium text-[#173b32]">Identificador de incidencia</p>
            <code className="mt-1 block font-mono text-[11px] text-[#2b4c40]">
              {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#174238] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#23574a]"
          >
            Reintentar operación
          </button>
          <Link
            href={hrefInicio}
            className="rounded-xl border border-[#ccd9cf] px-4 py-2.5 text-sm font-semibold text-[#173b32] hover:bg-[#edf3ec]"
          >
            Volver al inicio
          </Link>
          <button
            type="button"
            onClick={copiarDiagnostico}
            className="rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-[#4d665b] underline hover:text-[#173b32]"
          >
            {copiado ? "Diagnóstico copiado" : "Copiar detalle técnico"}
          </button>
        </div>
      </div>
    </div>
  );
}
