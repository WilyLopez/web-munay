import { connection } from "next/server";
import { cache, Suspense } from "react";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "@/features/destinos/api";
import type { Catalogo } from "@/features/destinos/catalogo";
import { BarraNavegacion, type DestinoBusqueda } from "./barra-navegacion";
import { MenuMovilVisitante } from "./menu-movil-visitante";

export const cargarCatalogoPublico = cache(
  async (): Promise<Catalogo | null> => {
    try {
      const respuesta = await solicitarDestinos();
      return respuesta.ok ? ((await respuesta.json()) as Catalogo) : null;
    } catch {
      return null;
    }
  },
);

export const cargarCatalogo = cache(async (): Promise<Catalogo | null> => {
  await connection();

  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    let respuesta = await solicitarDestinos(token);
    if (token && respuesta.status === 401)
      respuesta = await solicitarDestinos();
    return respuesta.ok ? ((await respuesta.json()) as Catalogo) : null;
  } catch {
    return null;
  }
});

async function ContenidoNavbar() {
  const catalogo = await cargarCatalogo();
  return catalogo ? <NavbarCatalogo catalogo={catalogo} /> : <BarraNavegacion />;
}

export function NavbarCatalogo({ catalogo }: { catalogo: Catalogo }) {
  const destinos: DestinoBusqueda[] = catalogo.destinos.map(
    ({ slug, nombre, ubicacion }) => ({ slug, nombre, ubicacion }),
  );
  return (
    <>
      <BarraNavegacion destinos={destinos} sesion={catalogo.sesion} />
      {catalogo.sesion?.perfil.rol === "TURISTA" && <MenuMovilVisitante />}
    </>
  );
}

export function Navbar() {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-[4.5rem] border-b border-[#e5ded0]"
        />
      }
    >
      <ContenidoNavbar />
    </Suspense>
  );
}
