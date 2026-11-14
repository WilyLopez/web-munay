import Link from "next/link";
import { FormularioReenvio } from "@/features/autenticacion/formulario-reenvio";

export default function PaginaReenvio() {
  return (
    <main className="mx-auto max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-[#174238]">
        Reenvía el correo de confirmación
      </h1>
      <p className="text-sm text-stone-700">
        Ingresa el correo que usaste para registrarte en Munay.
      </p>
      <FormularioReenvio />
      <Link
        href="/ingresar"
        className="text-sm font-semibold text-[#174238] underline"
      >
        Volver al inicio de sesión
      </Link>
    </main>
  );
}
