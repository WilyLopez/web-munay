import { resolverUrlApi } from "@/lib/api-url";

export function solicitarDestinos(
  token?: string,
  ruta = "/destinos",
  metodo = "GET",
) {
  const esLecturaPublica = !token && metodo === "GET";

  return fetch(resolverUrlApi(ruta), {
    method: metodo,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    ...(esLecturaPublica
      ? { next: { revalidate: 60, tags: ["destinos"] } }
      : { cache: "no-store" }),
    signal: AbortSignal.timeout(10000),
  });
}
