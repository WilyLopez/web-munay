export async function solicitarSesion(
  token: string,
  metodo: "GET" | "POST" | "DELETE",
) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("Falta configurar la URL de la API.");
  }

  return fetch(new URL("/autenticacion/sesion", base), {
    method: metodo,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}
