export function solicitarDestinos(
  token?: string,
  ruta = "/destinos",
  metodo = "GET",
) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("Falta configurar la URL de la API.");
  }

  return fetch(new URL(ruta, base), {
    method: metodo,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}
