"use server";

import { revalidatePath, updateTag } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function publicarResena(
  slug: string,
  calificacion: number,
  comentario: string,
  solicitudId?: string,
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/resenas/${encodeURIComponent(slug)}`,
    { calificacion, comentario, solicitudId },
  );
  if (resultado.ok) {
    updateTag("destinos");
    revalidatePath("/");
    revalidatePath("/mi-perfil");
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
