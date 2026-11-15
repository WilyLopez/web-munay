"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function reintentarAnclaje(id: string) {
  const resultado = await solicitarVisitas(
    `/anclajes-resenas/${encodeURIComponent(id)}/reintentar`,
    {},
    { metodo: "PUT" },
  );
  if (!resultado.ok) return resultado.mensaje;
  revalidatePath("/superadmin/blockchain");
  return "El registro volvió a la cola.";
}
