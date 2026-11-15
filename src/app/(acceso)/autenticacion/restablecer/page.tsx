import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoAcceso } from "@/features/autenticacion/aviso-acceso";
import { FormularioRestablecer } from "@/features/autenticacion/formulario-recuperacion";

export const metadata: Metadata = {
  title: "Restablecer contraseña · Munay",
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
    <section className="entrada-acceso space-y-5">
      <Suspense fallback={<EsqueletoAcceso />}>
        <Contenido {...props} />
      </Suspense>
    </section>
  );
}
