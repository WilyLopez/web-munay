import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { consultarPantallaPublica } from "@/features/visitas/acciones";
import { PantallaTransmision } from "@/features/visitas/pantalla-transmision";

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
  const { destino } = await searchParams;
  const respuesta = typeof destino === "string" && destino
    ? await consultarPantallaPublica(destino)
    : undefined;

  if (!respuesta?.ok) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#f8f4ea] p-6 text-center text-[#193b33]">
        <div className="max-w-md rounded-2xl border border-[#dedacf] bg-white p-8">
          <h1 className="font-serif text-2xl font-bold">Pantalla no disponible</h1>
          <p role="alert" className="mt-3 text-sm">
            {respuesta && !respuesta.ok ? respuesta.mensaje : "Abre el enlace del QR del atractivo que deseas visitar."}
          </p>
        </div>
      </main>
    );
  }
  const destinos = [respuesta.datos.destino];
  const destinoInicial = respuesta.datos.destino.slug;

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
