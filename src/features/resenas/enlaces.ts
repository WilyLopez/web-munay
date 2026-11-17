export function enlaceEscribirResena(slug: string) {
  return `/resenas/escribir?destino=${encodeURIComponent(slug)}`;
}

export function regresoEscribirResena(valor: string) {
  try {
    const url = new URL(valor, "https://munay.local");
    const slug = url.searchParams.get("destino");
    if (
      url.origin === "https://munay.local" &&
      url.pathname === "/resenas/escribir" &&
      slug &&
      slug.length <= 180 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)
    ) {
      return enlaceEscribirResena(slug);
    }
  } catch {
    return null;
  }
  return null;
}
