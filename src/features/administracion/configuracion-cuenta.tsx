import Link from "next/link";

export function ConfiguracionCuenta({ perfil }: { perfil: string }) {
  return (
    <main className="max-w-3xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Configuración</h1>
      <section
        aria-labelledby="seguridad-cuenta"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <h2 id="seguridad-cuenta" className="text-lg font-semibold">
          Seguridad de la cuenta
        </h2>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          La sesión del panel vence después de 30 minutos de inactividad.
        </p>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Para restablecer tu contraseña, solicita un enlace al correo de tu
          cuenta.
        </p>
        <Link
          href="/autenticacion/recuperar"
          className="inline-block rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white hover:bg-[#23574a]"
        >
          Restablecer contraseña
        </Link>{" "}
        <Link
          href={perfil}
          className="inline-block rounded-lg border border-[#ccd9cf] px-3 py-2 text-sm font-semibold hover:bg-[#e6eee6]"
        >
          Ver mi perfil
        </Link>
      </section>
    </main>
  );
}
