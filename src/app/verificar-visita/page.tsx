import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
import { EscanerVisita } from "@/features/visitas/escaner-visita";

async function Contenido({ destino }: { destino?: string }) {
  await connection();
  const sesion = await solicitarVisitas<{ perfil: { rol: string } }>(
    "/autenticacion/sesion",
  );
  if (!sesion.ok && sesion.estado === 401) redirect("/ingresar?aviso=sesion");
  if (!sesion.ok) return <p role="alert">{sesion.mensaje}</p>;
  if (sesion.datos.perfil.rol !== "TURISTA") {
    return (
      <p role="alert">
        La verificación está disponible para cuentas de turista.
      </p>
    );
  }
  return <EscanerVisita destino={destino} />;
}

async function Escaneo({
  consulta,
}: {
  consulta: Promise<{ destino?: string }>;
}) {
  const { destino } = await consulta;
  return (
    <Contenido destino={typeof destino === "string" ? destino : undefined} />
  );
}

export default function PaginaVerificarVisita({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-5 py-8">
      <Link href="/destinos" className="font-semibold text-teal-900 underline">
        Volver a destinos
      </Link>
      <h1 className="text-3xl font-bold text-teal-950">Verificar visita</h1>
      <p>
        Activa la cámara y apunta al QR que muestra el encargado del destino.
      </p>
      <Suspense fallback={<p role="status">Comprobando sesión…</p>}>
        <Escaneo consulta={searchParams} />
      </Suspense>
    </main>
  );
}
