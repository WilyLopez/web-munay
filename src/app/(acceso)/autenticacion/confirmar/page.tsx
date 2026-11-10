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
    <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <h1 className="text-2xl font-bold">Confirma tu correo</h1>
      {typeof tokenHash === "string" &&
      tokenHash.length > 0 &&
      tokenHash.length <= 256 ? (
        <form action={confirmarCorreo} className="mt-4 space-y-4">
          <p>Confirma este correo para habilitar el acceso a Munay.</p>
          <input type="hidden" name="tokenHash" value={tokenHash} />
          <button
            className="rounded-xl bg-teal-800 px-4 py-2.5 font-semibold text-white"
            type="submit"
          >
            Confirmar correo
          </button>
        </form>
      ) : (
        <p className="mt-4">Este enlace de confirmación no es válido.</p>
      )}
      <Link
        className="mt-4 inline-block font-semibold text-teal-800 underline"
        href="/ingresar"
      >
        Volver al inicio de sesión
      </Link>
    </section>
  );
}

export default function PaginaConfirmacion(
  propiedades: PageProps<"/autenticacion/confirmar">,
) {
  return (
    <Suspense fallback={<p>Cargando la confirmación…</p>}>
      <ContenidoConfirmacion {...propiedades} />
    </Suspense>
  );
}
