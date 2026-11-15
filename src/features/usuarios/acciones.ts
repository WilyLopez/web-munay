"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function guardarUsuario(
  id: string,
  accion: string,
  valor: string | boolean,
) {
  const resultado = await solicitarVisitas(
    `/superadmin/usuarios/${encodeURIComponent(id)}`,
    { accion, valor },
    { metodo: "PATCH" },
  );
  if (resultado.ok && accion === "nombre")
    revalidatePath("/superadmin", "layout");
  return resultado.ok ? null : resultado.mensaje;
}
