import { PiePagina } from "@/features/navegacion/pie-pagina";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import type { Catalogo } from "@/features/destinos/catalogo";
import { CatalogoDestinos } from "@/features/destinos/catalogo-destinos";

import { Navbar, NavbarCatalogo } from "@/features/navegacion/navbar";

async function DestinosPublicos({ searchParams }: PageProps<"/destinos">) {
  await connection();
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();

  let respuesta;

  try {
    const token = data.session?.access_token;
    respuesta = await solicitarDestinos(token);

    if (token && respuesta.status === 401) {
      respuesta = await solicitarDestinos();
    }
  } catch {
    respuesta = null;
  }

  if (!respuesta?.ok) {
    return (
      <>
        <div className="-mx-8 -mt-8">
          <Navbar />
        </div>
        <main className="mx-auto max-w-3xl py-10">
          <h1 className="text-2xl font-bold">No pudimos cargar el catálogo</h1>
          <Link
            className="mt-4 inline-block font-semibold text-teal-800 underline"
            href="/destinos"
          >
            Reintentar
          </Link>
        </main>
        <PiePagina className="-mx-8 -mb-8" />
      </>
    );
  }

  const catalogo = (await respuesta.json()) as Catalogo;
  const { buscar } = await searchParams;

  return (
    <>
      <div className="sticky top-0 z-40 -mx-8 -mt-8">
        <NavbarCatalogo catalogo={catalogo} />
      </div>
      <main className="mx-auto max-w-6xl space-y-7 py-4 sm:py-8">
        <div className="rounded-2xl bg-teal-950 px-6 py-9 text-white sm:px-9">
          <h1 className="text-3xl font-bold sm:text-5xl">Explorar destinos</h1>
          <p className="mt-3 max-w-xl text-teal-50">
            Descubre lugares para visitar en Lambayeque.
          </p>
        </div>
        <CatalogoDestinos
          key={typeof buscar === "string" ? buscar : ""}
          destinos={catalogo.destinos}
          tieneSesion={Boolean(catalogo.sesion)}
        />
      </main>
      <PiePagina className="-mx-8 -mb-8" />
    </>
  );
}

export default function PaginaDestinos(props: PageProps<"/destinos">) {
  return (
    <Suspense fallback={<p role="status">Cargando destinos…</p>}>
      <DestinosPublicos {...props} />
    </Suspense>
  );
}
