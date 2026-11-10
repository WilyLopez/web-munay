import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  nombreCookieSesion,
  obtenerConfiguracionSupabase,
  opcionesCookies,
} from "./configuracion";

export async function crearSupabaseServidor() {
  const almacen = await cookies();
  const { url, clave } = obtenerConfiguracionSupabase();

  return createServerClient(url, clave, {
    cookieOptions: opcionesCookies,
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (cambios) => {
        try {
          for (const { name, value, options } of cambios) {
            almacen.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });
}

export async function borrarCookiesSesion() {
  const almacen = await cookies();

  for (const { name } of almacen.getAll()) {
    if (
      name === nombreCookieSesion ||
      name.startsWith(`${nombreCookieSesion}.`) ||
      name.startsWith(`${nombreCookieSesion}-`)
    ) {
      almacen.delete(name);
    }
  }
}
