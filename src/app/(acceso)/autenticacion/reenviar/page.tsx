import Link from "next/link";
import { FormularioReenvio } from "@/features/autenticacion/formulario-reenvio";
import {
  enlaceAcceso,
  tituloAcceso,
} from "@/features/autenticacion/estilos-acceso";

export const metadata = { title: "Reenviar confirmación · Munay" };

export default function PaginaReenvio() {
  return (
    <section className="entrada-acceso space-y-5">
      <header className="space-y-2">
        <h1 className={tituloAcceso}>Reenvía el correo de confirmación</h1>
        <p className="text-sm text-stone-600">
          Ingresa el correo que usaste para registrarte en Munay.
        </p>
      </header>
      <FormularioReenvio />
      <Link href="/ingresar" className={`${enlaceAcceso} text-sm`}>
        Volver a iniciar sesión
      </Link>
    </section>
  );
}
