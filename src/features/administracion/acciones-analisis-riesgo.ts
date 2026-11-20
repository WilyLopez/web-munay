"use server";
import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";
export async function reintentarAnalisisRiesgo(id: string) {
  const resultado = await solicitarVisitas<{ estado: string }>(`/reportes-resenas/analisis/${encodeURIComponent(id)}/reintentar`, {}, { metodo: "PUT" });
  if (resultado.ok) revalidatePath("/superadmin/reportes");
  return resultado;
}
