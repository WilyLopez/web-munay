export function solicitarDestinos(
  token?: string,
  ruta = "/destinos",
  metodo = "GET",
) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("Falta configurar la URL de la API.");
  }

  const esLecturaPublica = !token && metodo === "GET";

  return fetch(new URL(ruta, base), {
    method: metodo,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    ...(esLecturaPublica
      ? { next: { revalidate: 60, tags: ["destinos"] } }
      : { cache: "no-store" }),
    signal: AbortSignal.timeout(10000),
  });
}
