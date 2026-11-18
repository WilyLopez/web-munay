"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ingresarGoogle } from "./google";

export function BotonGoogle({ volver }: { volver?: string }) {
  const [estado, accion, pendiente] = useActionState(ingresarGoogle, {});
  return (
    <div className="space-y-3">
      <form action={accion}>
        <input type="hidden" name="volver" value={volver ?? ""} />
        <button
          disabled={pendiente}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 font-semibold text-[#174238] transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="currentColor"
          >
            <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22ZM6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.35-2.59ZM12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.35 2.59A6 6 0 0 1 12 5.96Z" />
          </svg>
          {pendiente ? "Conectando con Google…" : "Continuar con Google"}
        </button>
      </form>
      {estado.mensaje && (
        <p role="alert" className="text-sm text-rose-800">
          {estado.mensaje}
        </p>
      )}
      <p className="text-xs leading-relaxed text-stone-600">
        Al continuar aceptas los{" "}
        <Link
          href="/terminos-de-uso"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Términos de uso
        </Link>{" "}
        y la{" "}
        <Link
          href="/politica-de-privacidad"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Política de privacidad
        </Link>
        . Con Google no necesitas confirmar otro correo.
      </p>
    </div>
  );
}
