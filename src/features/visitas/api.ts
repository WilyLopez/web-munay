import "server-only";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { resolverUrlApi } from "@/lib/api-url";
import type { Resultado } from "./tipos";

export async function solicitarVisitas<T>(
  ruta: string,
  datos?: Record<string, unknown>,
  opciones?: {
    publica?: boolean;
    metodo?: "PUT" | "DELETE" | "PATCH";
    token?: string;
  },
): Promise<Resultado<T>> {
  try {
    const supabase = await crearSupabaseServidor();
    const { data } = await supabase.auth.getSession();
    const tokenActivo = opciones?.token ?? data.session?.access_token;
    if (!tokenActivo && !opciones?.publica) {
      return {
        ok: false,
        estado: 401,
        mensaje: "Inicia sesión para continuar.",
      };
    }

    const respuesta = await fetch(resolverUrlApi(ruta), {
      method: opciones?.metodo ?? (datos ? "POST" : "GET"),
      headers: {
        ...(tokenActivo && {
          Authorization: `Bearer ${tokenActivo}`,
        }),
        ...(datos && { "Content-Type": "application/json" }),
      },
      body: datos ? JSON.stringify(datos) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (respuesta.status === 401 && opciones?.publica && tokenActivo) {
      const publica = await fetch(resolverUrlApi(ruta), {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (publica.ok) return { ok: true, datos: (await publica.json()) as T };
    }
    if (respuesta.ok)
      return {
        ok: true,
        datos: (respuesta.status === 204
          ? undefined
          : await respuesta.json()) as T,
      };
    const error = (await respuesta.json().catch(() => null)) as {
      mensaje?: unknown;
      message?: unknown;
      codigo?: unknown;
      geocerca?: { distanciaMetros?: unknown; radioMetros?: unknown };
    } | null;
    const mensaje = error?.mensaje ?? error?.message;
    return {
      ok: false,
      estado: respuesta.status,
      mensaje:
        respuesta.status >= 500 || typeof mensaje !== "string"
          ? "No pudimos completar la solicitud. Intenta de nuevo."
          : mensaje,
      codigo: typeof error?.codigo === "string" ? error.codigo : undefined,
      geocerca:
        typeof error?.geocerca?.distanciaMetros === "number" &&
        Number.isFinite(error.geocerca.distanciaMetros) &&
        error.geocerca.distanciaMetros >= 0 &&
        typeof error.geocerca.radioMetros === "number" &&
        Number.isFinite(error.geocerca.radioMetros) &&
        error.geocerca.radioMetros > 0
          ? {
              distanciaMetros: error.geocerca.distanciaMetros,
              radioMetros: error.geocerca.radioMetros,
            }
          : undefined,
    };
  } catch {
    return {
      ok: false,
      estado: 0,
      mensaje: "Se perdió la conexión. Intenta de nuevo.",
    };
  }
}
