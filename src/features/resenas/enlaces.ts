export function enlaceEscribirResena(slug: string, visitaPrevia = false) {
  return `/resenas/escribir?destino=${encodeURIComponent(slug)}${visitaPrevia ? "&aviso=visita-verificada" : ""}`;
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
      return enlaceEscribirResena(
        slug,
        url.searchParams.get("aviso") === "visita-verificada",
      );
    }
  } catch {
    return null;
  }
  return null;
}

export function enlaceDetalleResena(id: string) {
  return `/resenas/${encodeURIComponent(id.toLowerCase())}`;
}

export function regresoDetalleResena(valor: string) {
  try {
    const url = new URL(valor, "https://munay.local");
    if (url.origin !== "https://munay.local") return null;
    const coincidencia =
      /^\/resenas\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.exec(
        url.pathname,
      );
    return coincidencia ? enlaceDetalleResena(coincidencia[1]) : null;
  } catch {
    return null;
  }
}

export function ingresoParaResena(id: string) {
  return `/ingresar?${new URLSearchParams({ aviso: "sesion", volver: enlaceDetalleResena(id) })}`;
}
