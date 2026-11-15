"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function actualizarPerfilAdmin(
  _estado: { mensaje: string; ok: boolean },
  datos: FormData,
) {
  const entrada = datos.get("nombreCompleto");
  const nombreCompleto = typeof entrada === "string" ? entrada.trim() : "";
  if (nombreCompleto.length < 2 || nombreCompleto.length > 120) {
    return { mensaje: "Escribe un nombre de 2 a 120 caracteres.", ok: false };
  }
  const respuesta = await solicitarVisitas(
    "/autenticacion/sesion/perfil-admin",
    { nombreCompleto },
    { metodo: "PATCH" },
  );
  if (!respuesta.ok) return { mensaje: respuesta.mensaje, ok: false };
  revalidatePath("/administracion", "layout");
  return { mensaje: "Tu nombre se actualizó.", ok: true };
}
