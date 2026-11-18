import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  crearSupabaseServidor,
  borrarCookiesSesion,
} from "@/features/autenticacion/supabase/servidor";
import { solicitarSesion } from "@/features/autenticacion/sesion";
import { destinoSesion } from "@/features/autenticacion/destino-sesion";
import { regresoEscribirResena } from "@/features/resenas/enlaces";
import { regresoQrVisita } from "@/features/visitas/enlace-qr";
import { retomarActivacion } from "@/features/accesos/activacion-pendiente";
import { reclamarVisitaInvitada } from "@/features/visitas/invitada";

export async function GET(request: NextRequest) {
  const almacen = await cookies();
  const volver = almacen.get("munay-google-volver")?.value ?? "";
  almacen.delete("munay-google-volver");
  let destino = `/ingresar?${new URLSearchParams({ aviso: "google-error", ...(volver && { volver }) })}`;
  try {
    const codigo = request.nextUrl.searchParams.get("code");
    if (codigo && !request.nextUrl.searchParams.has("error")) {
      const supabase = await crearSupabaseServidor();
      const { data, error } =
        await supabase.auth.exchangeCodeForSession(codigo);
      if (!error && data.session) {
        const sesion = await solicitarSesion(data.session.access_token, "POST");
        if (sesion.ok) {
          const datos = (await sesion.json()) as { perfil?: { rol?: string } };
          const panel = destinoSesion(datos.perfil?.rol);
          if (panel) {
            destino = panel;
            const activacion = await retomarActivacion(
              data.session.access_token,
              data.user?.email,
            );
            if (activacion?.ok) destino = "/administracion";
            else if (datos.perfil?.rol === "TURISTA") {
              await reclamarVisitaInvitada(data.session.access_token);
              destino =
                regresoEscribirResena(volver) ??
                regresoQrVisita(volver) ??
                panel;
            }
          } else await borrarCookiesSesion();
        } else await borrarCookiesSesion();
      }
    }
  } catch {
    await borrarCookiesSesion();
  }
  const respuesta = NextResponse.redirect(new URL(destino, request.url));
  respuesta.headers.set("Cache-Control", "private, no-store");
  return respuesta;
}
