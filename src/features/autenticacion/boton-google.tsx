"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ingresarGoogle } from "./google";

export function BotonGoogle({
  volver,
  alIniciar,
  condiciones = true,
  deshabilitado = false,
}: {
  volver?: string;
  alIniciar?: () => void;
  condiciones?: boolean;
  deshabilitado?: boolean;
}) {
  const [estado, accion, pendiente] = useActionState(ingresarGoogle, {});
  return (
    <div className="space-y-3">
      <form action={accion} onSubmit={alIniciar}>
        <input type="hidden" name="volver" value={volver ?? ""} />
        <button
          disabled={pendiente || deshabilitado}
          aria-busy={pendiente}
          className="group relative flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border border-[#c9d1ce] bg-white px-5 py-3 text-sm font-semibold text-[#26332e] shadow-[0_2px_3px_rgba(16,43,33,0.04)] transition-[background-color,border-color,box-shadow] hover:border-[#8b9e93] hover:bg-[#f8faf8] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174238] disabled:cursor-wait disabled:opacity-65 sm:text-base"
        >
          {pendiente ? (
            <span
              aria-hidden="true"
              className="size-5 rounded-full border-2 border-[#d5dfd8] border-t-[#174238] motion-safe:animate-spin"
            />
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              className="size-5 shrink-0"
            >
              <path
                fill="#4285F4"
                d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5h6.61c3.86-3.55 6.08-8.79 6.08-14.67Z"
              />
              <path
                fill="#34A853"
                d="M24 44c5.51 0 10.13-1.83 13.51-4.87l-6.61-5c-1.83 1.23-4.18 1.96-6.9 1.96-5.32 0-9.83-3.59-11.44-8.42H5.72v5.15A20 20 0 0 0 24 44Z"
              />
              <path
                fill="#FBBC05"
                d="M12.56 27.67a12 12 0 0 1 0-7.34v-5.15H5.72a20 20 0 0 0 0 17.64l6.84-5.15Z"
              />
              <path
                fill="#EA4335"
                d="M24 11.91c3 0 5.69 1.03 7.81 3.05l5.86-5.86A19.62 19.62 0 0 0 24 4 20 20 0 0 0 5.72 15.18l6.84 5.15C14.17 15.5 18.68 11.91 24 11.91Z"
              />
            </svg>
          )}
          <span>
            {pendiente ? "Conectando con Google…" : "Continuar con Google"}
          </span>
        </button>
      </form>
      {estado.mensaje && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {estado.mensaje}
        </p>
      )}
      {condiciones && (
        <p className="text-center text-xs leading-relaxed text-stone-500">
          Al continuar aceptas los{" "}
          <Link
            href="/terminos-de-uso"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Términos
          </Link>{" "}
          y la{" "}
          <Link
            href="/politica-de-privacidad"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Política de privacidad
          </Link>
          .
        </p>
      )}
    </div>
  );
}
