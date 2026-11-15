import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioRestablecer } from "@/features/autenticacion/formulario-recuperacion";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Munay",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

async function Contenido({
  searchParams,
}: PageProps<"/autenticacion/restablecer">) {
  const { token_hash: token } = await searchParams;
  return (
    <FormularioRestablecer
      token={
        typeof token === "string" && token.length <= 256 ? token : undefined
      }
    />
  );
}

export default function PaginaRestablecer(
  props: PageProps<"/autenticacion/restablecer">,
) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f8f4ea] p-5 sm:p-8">
      <section className="w-full max-w-lg space-y-5 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
        <Suspense
          fallback={
            <div
              role="status"
              className="h-36 rounded-2xl bg-stone-100 motion-safe:animate-pulse"
            >
              <span className="sr-only">Cargando formulario</span>
            </div>
          }
        >
          <Contenido {...props} />
        </Suspense>
      </section>
    </main>
  );
}
