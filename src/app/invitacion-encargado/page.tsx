import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AceptarInvitacion } from "@/features/accesos/formularios";
import { solicitarVisitas } from "@/features/visitas/api";

async function Acceso() {
  await connection();
  const sesion = await solicitarVisitas("/autenticacion/sesion");
  return <AceptarInvitacion autenticado={sesion.ok} />;
}

export default function PaginaInvitacion() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 py-8 text-[#173b32] sm:px-6">
      <section className="w-full space-y-5 rounded-3xl border border-[#dce3da] bg-white p-6 sm:p-9">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center font-serif text-xl font-semibold hover:text-[#0b6b52]"
        >
          Munay
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl">
          Invitación para gestionar un atractivo
        </h1>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Usa la cuenta con el correo al que llegó la invitación. Si recién
          creas una cuenta, confirma tu correo y vuelve a abrir el enlace de
          invitación.
        </p>
        <Suspense fallback={<p role="status">Comprobando sesión…</p>}>
          <Acceso />
        </Suspense>
      </section>
    </main>
  );
}
