import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { confirmarCorreo } from "@/features/autenticacion/acciones";

export const metadata: Metadata = {
  title: "Confirma tu correo · Munay",
  referrer: "no-referrer",
};

async function ContenidoConfirmacion({
  searchParams,
}: PageProps<"/autenticacion/confirmar">) {
  const { token_hash: tokenHash } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f4ea] px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <div className="mb-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-[#174238]"
          >
            munay
            <span aria-hidden="true" className="text-[#a54b36]">
              .
            </span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Confirma tu correo
        </h1>
        {typeof tokenHash === "string" &&
        tokenHash.length > 0 &&
        tokenHash.length <= 256 ? (
          <form action={confirmarCorreo} className="mt-4 space-y-4">
            <p className="text-sm text-stone-600">
              Confirma este correo para habilitar el acceso a tu cuenta en Munay.
            </p>
            <input type="hidden" name="tokenHash" value={tokenHash} />
            <button
              className="w-full rounded-xl bg-[#174238] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#23574a]"
              type="submit"
            >
              Confirmar correo
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            Este enlace de confirmación no es válido o ya fue utilizado.
          </p>
        )}
        <div className="mt-6 border-t border-stone-200 pt-4">
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174238] underline hover:text-[#23574a]"
            href="/ingresar"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function PaginaConfirmacion(
  propiedades: PageProps<"/autenticacion/confirmar">,
) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f4ea]">
          <p className="text-sm text-stone-600">Cargando la confirmación…</p>
        </div>
      }
    >
      <ContenidoConfirmacion {...propiedades} />
    </Suspense>
  );
}
