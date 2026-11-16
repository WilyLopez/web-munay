import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { confirmarCorreo } from "@/features/autenticacion/acciones";
import { BotonEnvioAcceso } from "@/features/autenticacion/boton-envio-acceso";
import {
  AvisoAcceso,
  EsqueletoAcceso,
} from "@/features/autenticacion/aviso-acceso";
import {
  enlaceAcceso,
  tituloAcceso,
} from "@/features/autenticacion/estilos-acceso";

export const metadata: Metadata = {
  title: "Confirma tu correo · Munay",
  referrer: "no-referrer",
};

async function ContenidoConfirmacion({
  searchParams,
}: PageProps<"/autenticacion/confirmar">) {
  const { token_hash: tokenHash } = await searchParams;
  const tokenValido =
    typeof tokenHash === "string" &&
    tokenHash.length > 0 &&
    tokenHash.length <= 256;

  return (
    <section className="entrada-acceso space-y-5">
      <h1 className={tituloAcceso}>Confirma tu correo</h1>
      {tokenValido ? (
        <form action={confirmarCorreo} className="space-y-4">
          <p className="text-sm text-stone-600">
            Confirma tu correo para activar el acceso a tu cuenta.
          </p>
          <input type="hidden" name="tokenHash" value={tokenHash} />
          <BotonEnvioAcceso etiqueta="Confirmar correo" esperando="Confirmando…" />
        </form>
      ) : (
        <AvisoAcceso
          tipo="error"
          mensaje="Este enlace de confirmación ya no es válido. Solicita uno nuevo."
          reenviar
        />
      )}
      <Link className={`${enlaceAcceso} text-sm`} href="/ingresar">
        Volver a iniciar sesión
      </Link>
    </section>
  );
}

export default function PaginaConfirmacion(
  props: PageProps<"/autenticacion/confirmar">,
) {
  return (
    <Suspense fallback={<EsqueletoAcceso />}>
      <ContenidoConfirmacion {...props} />
    </Suspense>
  );
}
