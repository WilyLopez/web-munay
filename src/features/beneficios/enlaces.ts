export function regresoBeneficios(valor: string) {
  try {
    const url = new URL(valor, "https://munay.local");
    if (url.origin !== "https://munay.local" || url.pathname !== "/beneficios")
      return null;
    return url.searchParams.get("seccion") === "canjes"
      ? "/beneficios?seccion=canjes"
      : "/beneficios";
  } catch {
    return null;
  }
}
