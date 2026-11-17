"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function actualizarPerfilVisitante(
  _estado: { ok: boolean; mensaje: string },
  datos: FormData,
) {
  const entrada = datos.get("nombreCompleto");
  const nombreCompleto = typeof entrada === "string" ? entrada.trim() : "";
  if (nombreCompleto.length < 2 || nombreCompleto.length > 120)
    return { ok: false, mensaje: "Escribe tu nombre de 2 a 120 caracteres." };
  const respuesta = await solicitarVisitas(
    "/autenticacion/sesion/perfil-visitante",
    { nombreCompleto },
    { metodo: "PATCH" },
  );
  if (!respuesta.ok) return { ok: false, mensaje: respuesta.mensaje };
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Tu nombre se actualizó correctamente." };
}
