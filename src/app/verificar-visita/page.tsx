import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { MenuMovilVisitante } from "@/features/navegacion/menu-movil-visitante";
import { solicitarVisitas } from "@/features/visitas/api";
import { EscanerVisita } from "@/features/visitas/escaner-visita";
import {
  codigoQrVisita,
  ingresoParaVisita,
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
  if (!sesion.ok && sesion.estado === 401)
    redirect(ingresoParaVisita(slug, codigoInicial ?? undefined));
  if (!sesion.ok)
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p role="alert">{sesion.mensaje}</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  if (sesion.datos.perfil.rol !== "TURISTA") {
    return (
      <p role="alert">
        La verificación está disponible para cuentas de turista.
      </p>
    );
  }
  return (
    <>
      <EscanerVisita
        key={
          codigo !== undefined && !codigoInicial
            ? "qr-invalido"
            : rutaEscanerVisita(slug, id)
        }
        destino={slug}
        codigoInicial={codigoInicial ?? undefined}
        avisoInicial={
          codigo !== undefined && !codigoInicial
            ? "Este enlace no contiene un QR válido. Escanea el código que muestra el encargado."
            : undefined
        }
        demoHabilitada={process.env.MUNAY_DEMO_ESCANEO === "true"}
      />
      <MenuMovilVisitante />
    </>
  );
}

export default function PaginaVerificarVisita({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-5 py-8">
      <Link href="/destinos" className="font-semibold text-teal-900 underline">
        Volver a destinos
      </Link>
      <h1 className="text-3xl font-bold text-teal-950">Verificar visita</h1>
      <p>
        Usa el código QR que muestra el encargado del destino para verificar tu
        visita.
      </p>
      <Suspense fallback={<p role="status">Comprobando sesión…</p>}>
        <Escaneo consulta={searchParams} />
      </Suspense>
    </main>
  );
}
