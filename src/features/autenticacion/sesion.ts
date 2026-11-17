import { resolverUrlApi } from "@/lib/api-url";

export async function solicitarSesion(
  token: string,
  metodo: "GET" | "POST" | "DELETE",
) {
  return fetch(resolverUrlApi("/autenticacion/sesion"), {
    method: metodo,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}
