"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function publicarResena(
  slug: string,
  calificacion: number,
  comentario: string,
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/resenas/${encodeURIComponent(slug)}`,
    { calificacion, comentario },
  );
  if (resultado.ok) {
    revalidatePath("/destinos");
    revalidatePath("/destinos/[slug]", "page");
    revalidatePath("/resenas");
  }
  return resultado;
}

export async function votarResena(id: string, util: boolean) {
  return solicitarVisitas<void>(
    `/resenas/${encodeURIComponent(id)}/util`,
    undefined,
    {
      metodo: util === true ? "PUT" : "DELETE",
    },
  );
}
