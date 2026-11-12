import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  obtenerConfiguracionSupabase,
  opcionesCookies,
} from "@/features/autenticacion/supabase/configuracion";

export async function proxy(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });
  const { url, clave } = obtenerConfiguracionSupabase();
  const supabase = createServerClient(url, clave, {
    cookieOptions: opcionesCookies,
    cookies: {
      getAll: () => peticion.cookies.getAll(),
      setAll: (cambios) => {
        for (const { name, value } of cambios) {
          peticion.cookies.set(name, value);
        }

        respuesta = NextResponse.next({ request: peticion });

        for (const { name, value, options } of cambios) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getClaims();
  respuesta.headers.set("Cache-Control", "private, no-store");
  return respuesta;
}

export const config = {
  matcher: [
    "/",
    "/destinos/:path*",
    "/verificar-visita",
    "/administracion/:path*",
  ],
};
