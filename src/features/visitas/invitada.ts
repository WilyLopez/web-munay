import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { solicitarVisitas } from "./api";

const NOMBRE = "munay-visita-invitada";
export async function tokenVisitaInvitada(crear = false) {
  const almacen = await cookies();
  const actual = almacen.get(NOMBRE)?.value;
  if (actual && /^[a-f0-9]{64}$/.test(actual)) return actual;
  if (!crear) return undefined;
  const token = randomBytes(32).toString("hex");
  almacen.set(NOMBRE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return token;
}

export async function reclamarVisitaInvitada(tokenSesion: string) {
  const token = await tokenVisitaInvitada();
  if (!token) return null;
  const resultado = await solicitarVisitas<{
    visitaId: string | null;
    slug: string;
  }>("/visitas/invitadas/reclamar", { token }, { token: tokenSesion });
  if (resultado.ok) (await cookies()).delete(NOMBRE);
  return resultado;
}
