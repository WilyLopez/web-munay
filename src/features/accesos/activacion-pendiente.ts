import "server-only";

import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import { solicitarVisitas } from "@/features/visitas/api";

const nombreCookie = "munay-activacion-encargado";

type Activacion = {
  correo: string;
  token: string;
  propuesta?: Record<string, unknown>;
};

export function codificarActivacion(activacion: Activacion) {
  return deflateRawSync(JSON.stringify(activacion)).toString("base64url");
}

export async function guardarActivacion(valor: string) {
  const almacen = await cookies();
  almacen.set(nombreCookie, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 72 * 60 * 60,
  });
}

export async function obtenerActivacion(correo?: string) {
  const valor = (await cookies()).get(nombreCookie)?.value;
  if (!correo || !valor || valor.length > 3800) return undefined;
  try {
    const activacion = JSON.parse(
      inflateRawSync(Buffer.from(valor, "base64url"), { maxOutputLength: 16000 }).toString(),
    ) as Activacion;
    if (activacion.correo === correo.toLowerCase() && /^[\w-]{43}$/.test(activacion.token)) {
      return activacion;
    }
  } catch {
    return undefined;
  }
}

export async function borrarActivacion() {
  (await cookies()).delete(nombreCookie);
}

export function aceptarAsignacion(
  token: string,
  propuesta?: Record<string, unknown>,
  acceso?: string,
) {
  return solicitarVisitas("/gestion-accesos/aceptar", { token, propuesta }, { token: acceso });
}

export async function retomarActivacion(tokenSesion: string, correo?: string) {
  const activacion = await obtenerActivacion(correo);
  if (!activacion) return undefined;
  const resultado = await aceptarAsignacion(
    activacion.token,
    activacion.propuesta,
    tokenSesion,
  );
  if (resultado.ok || resultado.estado === 410) await borrarActivacion();
  return resultado;
}
