import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogoDestinos } from "@/features/destinos/catalogo-destinos";
import { ErrorDestinos } from "@/features/destinos/error-destinos";
import { EsqueletoCatalogo } from "@/features/destinos/esqueletos";
import { Navbar, cargarCatalogo } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";

export const metadata: Metadata = {
  title: "Explorar destinos · Munay",
  description:
    "Encuentra destinos turísticos de Lambayeque y ubícalos en el mapa.",
};

async function DestinosPublicos() {
  const catalogo = await cargarCatalogo();
  if (!catalogo)
    return <ErrorDestinos titulo="No pudimos cargar el catálogo" />;

  return (
    <CatalogoDestinos
      destinos={catalogo.destinos}
      tieneSesion={Boolean(catalogo.sesion)}
    />
  );
}

export default function PaginaDestinos() {
  return (
    <div className="-m-8 min-h-dvh bg-[#f8f4ea] text-[#193b33]">
      <Navbar />
      <main className="mx-auto max-w-[82rem] px-4 pb-12 sm:px-8 lg:px-12">
        <header className="border-b border-[#d9d2c2] py-7 sm:py-10">
          <h1 className="text-balance font-serif text-[clamp(2.4rem,6.5vw,5rem)] leading-none tracking-tight">
            Explorar destinos
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#465a50] sm:text-base">
            Encuentra lugares para visitar en Lambayeque y ubícalos en el mapa.
          </p>
        </header>
        <Suspense fallback={<EsqueletoCatalogo />}>
          <DestinosPublicos />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
