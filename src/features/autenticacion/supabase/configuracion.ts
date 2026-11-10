export function obtenerConfiguracionSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clave) {
    throw new Error("Falta configurar Supabase Auth.");
  }

  return { url, clave };
}

export const nombreCookieSesion = "munay-auth";

export const opcionesCookies = {
  name: nombreCookieSesion,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
