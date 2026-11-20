"use server";
import { regresoBeneficios } from "@/features/beneficios/enlaces";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { crearSupabaseServidor } from "./supabase/servidor";
import {
  regresoEscribirResena,
  regresoDetalleResena,
} from "@/features/resenas/enlaces";
import { regresoQrVisita } from "@/features/visitas/enlace-qr";

export async function ingresarGoogle(
  _estado: { mensaje?: string },
  datos: FormData,
): Promise<{ mensaje?: string }> {
  const volver =
    regresoEscribirResena(String(datos.get("volver") ?? "")) ??
    regresoQrVisita(String(datos.get("volver") ?? "")) ??
    regresoDetalleResena(String(datos.get("volver") ?? "")) ??
    regresoBeneficios(String(datos.get("volver") ?? "")) ??
    "/destinos";
  let url: string | undefined;
  try {
    const cabeceras = await headers();
    const origen = cabeceras.get("origin");
    if (!origen)
      return { mensaje: "Abre el acceso desde Munay e inténtalo nuevamente." };
    const retorno = new URL("/autenticacion/google/retorno", origen);
    if (!["http:", "https:"].includes(retorno.protocol))
      return { mensaje: "El enlace de acceso no es válido." };
    const almacen = await cookies();
    almacen.set("munay-google-volver", volver, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    const supabase = await crearSupabaseServidor();
    const resultado = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: retorno.href,
        queryParams: { prompt: "select_account" },
      },
    });
    if (resultado.error || !resultado.data.url)
      return { mensaje: "No pudimos abrir Google. Inténtalo de nuevo." };
    url = resultado.data.url;
  } catch {
    return { mensaje: "No pudimos conectar con Google. Inténtalo nuevamente." };
  }
  redirect(url);
}
