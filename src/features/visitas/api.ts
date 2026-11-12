import "server-only";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import type { Resultado } from "./tipos";

export async function solicitarVisitas<T>(
  ruta: string,
  datos?: Record<string, unknown>,
): Promise<Resultado<T>> {
  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      return {
        ok: false,
        estado: 401,
        mensaje: "Inicia sesión para continuar.",
      };
    }

    const respuesta = await fetch(
      new URL(ruta, process.env.NEXT_PUBLIC_API_URL),
      {
        method: datos ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          ...(datos && { "Content-Type": "application/json" }),
        },
        body: datos ? JSON.stringify(datos) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (respuesta.ok) return { ok: true, datos: (await respuesta.json()) as T };
    const error = (await respuesta.json().catch(() => null)) as {
      mensaje?: unknown;
      message?: unknown;
    } | null;
    const mensaje = error?.mensaje ?? error?.message;
    return {
      ok: false,
      estado: respuesta.status,
      mensaje:
        respuesta.status >= 500 || typeof mensaje !== "string"
          ? "No pudimos completar la solicitud. Intenta de nuevo."
          : mensaje,
    };
  } catch {
    return {
      ok: false,
      estado: 0,
      mensaje: "Se perdió la conexión. Intenta de nuevo.",
    };
  }
}
