export function resolverUrlApi(ruta: string): URL {
  const base =
    (typeof window === "undefined" && process.env.API_INTERNAL_URL) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3001";

  const url = new URL(ruta, base);
  // En Node.js (servidor), resolver localhost directamente a 127.0.0.1 para evitar la demora de ~400ms por intento de IPv6 (::1) en Windows
  if (typeof window === "undefined" && url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }
  return url;
}
