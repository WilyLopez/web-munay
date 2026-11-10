type SesionMunay = {
  perfil: { nombreCompleto: string };
  venceEn: string;
};

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

export async function consultarSesion(
  token: string,
): Promise<SesionMunay | null> {
  const respuesta = await solicitarSesion(token, "GET");

  if (respuesta.status === 401) {
    return null;
  }

  if (!respuesta.ok) {
    throw new Error("La sesión no está disponible en este momento.");
  }

  return (await respuesta.json()) as SesionMunay;
}
