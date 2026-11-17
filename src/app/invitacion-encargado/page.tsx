import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AceptarInvitacion } from "@/features/accesos/formularios";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarVisitas } from "@/features/visitas/api";
import type { DetalleInvitacion } from "@/features/accesos/tipos";

export const metadata: Metadata = {
  title: "Invitación para gestionar un atractivo · Munay",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

async function ContenidoInvitacion({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await connection();
  const { token } = await searchParams;
  const tokenLimpio = typeof token === "string" ? token.trim() : undefined;

  let detalle: DetalleInvitacion | null = null;
  if (tokenLimpio) {
    const respuestaDetalle = await solicitarVisitas<DetalleInvitacion>(
      `/gestion-accesos/invitacion/${encodeURIComponent(tokenLimpio)}`,
      undefined,
      { publica: true },
    );
    if (respuestaDetalle.ok) {
      detalle = respuestaDetalle.datos;
    }
  }

  const respuestaSesion = await solicitarVisitas<{
    perfil: { id: string; rol: string };
  }>("/autenticacion/sesion");

  const sesionOk = respuestaSesion.ok;
  const supabase = sesionOk ? await crearSupabaseServidor() : null;
  const identidad = await supabase?.auth.getUser().catch(() => null);
  const correoSesion = identidad?.data.user?.email ?? null;

  return (
    <AceptarInvitacion
      autenticado={sesionOk}
      tokenInicial={tokenLimpio}
      detalleInicial={detalle}
      correoSesion={correoSesion}
    />
  );
}

export default function PaginaInvitacion(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8 text-[#173b32]">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#465a50]">
            Cargando información de la invitación…
          </div>
        }
      >
        <ContenidoInvitacion searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
