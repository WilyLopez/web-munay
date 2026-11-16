import { PiePagina } from "@/features/navegacion/pie-pagina";
import { Navbar } from "@/features/navegacion/navbar";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Opiniones, paginaResenas } from "@/features/resenas/opiniones";

type Consulta = { destino?: string; orden?: string; pagina?: string };

export const metadata: Metadata = {
  title: "Opiniones de visitantes · Munay",
  description: "Consulta las reseñas de los destinos turísticos de Lambayeque.",
};

async function Contenido({ consulta }: { consulta: Promise<Consulta> }) {
  await connection();
  const { destino, orden, pagina } = await consulta;
  return (
    <Opiniones
      filtro={typeof destino === "string" ? destino : undefined}
      orden={typeof orden === "string" ? orden : undefined}
      pagina={paginaResenas(pagina)}
    />
  );
}

export default function PaginaResenas({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <div className="-m-8 min-h-dvh bg-[#f8f4ea] text-[#193b33]">
      <Navbar />
      <main className="mx-auto max-w-[82rem] px-4 pb-12 sm:px-8 lg:px-12">
        <header className="border-b border-[#d9d2c2] py-7 sm:py-10">
          <Link
            href="/destinos"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Explorar destinos
          </Link>
          <h1 className="text-balance font-serif text-[clamp(2.4rem,6.5vw,5rem)] leading-none tracking-tight">
            Opiniones de visitantes
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#465a50] sm:text-base">
            Conoce cómo vivieron otros viajeros su visita a Lambayeque.
          </p>
        </header>
        <Suspense fallback={<EsqueletoOpiniones />}>
          <Contenido consulta={searchParams} />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}

function EsqueletoOpiniones() {
  return (
    <div role="status" className="space-y-4 py-6">
      <span className="sr-only">Cargando reseñas…</span>
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <div className="h-18 rounded-xl bg-[#e4ded1]" />
        <div className="h-52 rounded-2xl bg-[#e4ded1]" />
        <div className="h-36 rounded-2xl bg-[#e4ded1]" />
      </div>
    </div>
  );
}
