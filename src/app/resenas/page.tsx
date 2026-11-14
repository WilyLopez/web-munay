import { PiePagina } from "@/features/navegacion/pie-pagina";
import { Navbar } from "@/features/navegacion/navbar";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Opiniones, paginaResenas } from "@/features/resenas/opiniones";

type Consulta = { destino?: string; orden?: string; pagina?: string };

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
    <>
      <div className="sticky top-0 z-40 -mx-8 -mt-8">
        <Navbar />
      </div>
      <main className="mx-auto max-w-5xl space-y-5 py-8">
        <Link href="/destinos" className="font-semibold underline">
          Volver a destinos
        </Link>
        <h1 className="text-3xl font-bold">Opiniones de visitantes</h1>
        <Suspense fallback={<p role="status">Cargando reseñas…</p>}>
          <Contenido consulta={searchParams} />
        </Suspense>
      </main>
      <PiePagina className="-mx-8 -mb-8" />
    </>
  );
}
