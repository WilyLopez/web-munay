import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { solicitarVisitas } from "@/features/visitas/api";
import { EscanerVisita } from "@/features/visitas/escaner-visita";
import {
  codigoQrVisita,
  rutaEscanerVisita,
} from "@/features/visitas/enlace-qr";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

type Consulta = { destino?: string; codigo?: string };

async function Escaneo({ consulta }: { consulta: Promise<Consulta> }) {
  await connection();
  const { destino, codigo } = await consulta;
  const id = typeof codigo === "string" ? codigo : undefined;
  const codigoInicial = codigoQrVisita(id);
  const slug = typeof destino === "string" ? destino : undefined;
  const sesion = await solicitarVisitas<{ perfil: { rol: string } }>(
    "/autenticacion/sesion",
  );
  if (!sesion.ok && sesion.estado !== 401)
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p role="alert">{sesion.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  if (sesion.ok && sesion.datos.perfil.rol !== "TURISTA") {
    return (
      <p role="alert">
        La verificación está disponible para cuentas de turista.
      </p>
    );
  }
  return (
    <EscanerVisita
      key={
        codigo !== undefined && !codigoInicial
          ? "qr-invalido"
          : rutaEscanerVisita(slug, id)
      }
      invitado={!sesion.ok}
      destino={slug}
      codigoInicial={codigoInicial ?? undefined}
      avisoInicial={
        codigo !== undefined && !codigoInicial
          ? "Este enlace no contiene un QR válido. Escanea el código que muestra el encargado."
          : undefined
      }
      demoHabilitada={process.env.MUNAY_DEMO_ESCANEO === "true"}
    />
  );
}

export default function PaginaVerificarVisita({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fdfcf7] text-[#173b32]">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-8 sm:px-6">
        <Link
          href="/destinos"
          className="inline-flex min-h-12 items-center font-semibold text-teal-900 underline hover:text-[#0b6b52]"
        >
          Volver a destinos
        </Link>
        <Suspense
          fallback={
            <div
              role="status"
              className="h-96 rounded-3xl bg-[#e5ece5] motion-safe:animate-pulse"
            >
              <span className="sr-only">Preparando tu visita…</span>
            </div>
          }
        >
          <Escaneo consulta={searchParams} />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
