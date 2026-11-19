export function textoTarifa(
  valor: number | null | undefined,
  modalidad?: string,
) {
  if (valor == null && modalidad === "libre") return "Entrada libre";
  if (valor == null || !Number.isFinite(valor) || valor < 0)
    return "Por confirmar";
  if (valor === 0) return "Entrada libre";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(valor);
}

export function optimizarFoto(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const host = new URL(url).hostname;
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return (
      ["upload.wikimedia.org", "commons.wikimedia.org"].includes(host) ||
      Boolean(supabase && new URL(supabase).hostname === host)
    );
  } catch {
    return false;
  }
}
