import { PiePagina } from "@/features/navegacion/pie-pagina";
import { connection } from "next/server";
import { Suspense } from "react";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import type { Catalogo } from "@/features/destinos/catalogo";
import { CatalogoDestinos } from "@/features/destinos/catalogo-destinos";
import { ErrorDestinos } from "@/features/destinos/error-destinos";
import { EsqueletoCatalogo } from "@/features/destinos/esqueletos";

import { Navbar, NavbarCatalogo } from "@/features/navegacion/navbar";

async function DestinosPublicos() {
  await connection();
  let catalogo: Catalogo | undefined;

  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    let respuesta = await solicitarDestinos(token);

    if (token && respuesta.status === 401) {
      respuesta = await solicitarDestinos();
    }
    if (respuesta.ok) catalogo = (await respuesta.json()) as Catalogo;
  } catch {
    catalogo = undefined;
  }

  if (!catalogo) {
    return (
      <>
        <div className="-mx-8 -mt-8">
          <Navbar />
        </div>
        <ErrorDestinos titulo="No pudimos cargar el catálogo" />
        <PiePagina className="-mx-8 -mb-8" />
      </>
    );
  }

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
          destinos={catalogo.destinos}
          tieneSesion={Boolean(catalogo.sesion)}
        />
      </main>
      <PiePagina className="-mx-8 -mb-8" />
    </>
  );
}

export default function PaginaDestinos() {
  return (
    <Suspense fallback={<EsqueletoCatalogo />}>
      <DestinosPublicos />
    </Suspense>
  );
}
