import { Suspense } from "react";
import { EsqueletoAcceso } from "@/features/autenticacion/aviso-acceso";
import { FormularioAcceso } from "@/features/autenticacion/formulario-acceso";

export const metadata = { title: "Crear cuenta · Munay" };

async function ContenidoRegistro({ searchParams }: PageProps<"/registro">) {
  const { volver } = await searchParams;
  return (
    <FormularioAcceso
      registro
      volver={typeof volver === "string" ? volver : undefined}
    />
  );
}

export default function PaginaRegistro(props: PageProps<"/registro">) {
  return (
    <Suspense fallback={<EsqueletoAcceso />}>
      <ContenidoRegistro {...props} />
    </Suspense>
  );
}
