import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { solicitarVisitas } from "@/features/visitas/api";
import { PantallaTransmision } from "@/features/visitas/pantalla-transmision";
import type { DestinoVisita } from "@/features/visitas/tipos";

export const metadata: Metadata = {
  title: "Pantalla QR de Visitas · Munay",
  description:
    "Transmisión en vivo del código QR dinámico de visita para tablets, pantallas y guías turísticos.",
};

async function ContenidoPantalla({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  await connection();
  const [{ destino }, respuesta] = await Promise.all([
    searchParams,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
  ]);

  if (!respuesta.ok) {
    if (respuesta.estado === 401) {
      const volver = destino
        ? `/pantalla-qr?destino=${encodeURIComponent(destino)}`
        : "/pantalla-qr";
      redirect(`/ingresar?aviso=sesion&volver=${encodeURIComponent(volver)}`);
    }
    return (
      <main className="grid min-h-dvh place-items-center bg-[#f8f4ea] p-6 text-center text-[#193b33]">
        <div className="max-w-md rounded-2xl border border-[#dedacf] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-red-900">
            Acceso restringido
          </h1>
          <p className="mt-3 text-sm text-[#465a50]">
            {respuesta.estado === 403
              ? "Esta pantalla requiere una cuenta de encargado o administrador de destino."
              : respuesta.mensaje}
          </p>
        </div>
      </main>
    );
  }

  const destinos = respuesta.datos;
  if (!destinos.length) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#f8f4ea] p-6 text-center text-[#193b33]">
        <div className="max-w-md rounded-2xl border border-[#dedacf] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold">
            Sin destinos asignados
          </h1>
          <p className="mt-3 text-sm text-[#465a50]">
            Tu cuenta todavía no tiene destinos turísticos asignados para transmitir códigos QR.
          </p>
        </div>
      </main>
    );
  }

  const destinoInicial = destino
    ? destinos.find((d) => d.slug === destino)?.slug ?? destinos[0].slug
    : destinos[0].slug;

  return (
    <PantallaTransmision
      destinos={destinos}
      destinoInicial={destinoInicial}
    />
  );
}

export default function PaginaPantallaQr({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-[#f8f4ea] text-[#193b33]">
          <p className="font-medium animate-pulse">
            Cargando pantalla de transmisión…
          </p>
        </div>
      }
    >
      <ContenidoPantalla searchParams={searchParams} />
    </Suspense>
  );
}
