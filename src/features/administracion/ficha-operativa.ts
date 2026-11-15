"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function guardarFichaOperativa(
  slug: string,
  _estado: { mensaje: string; error: boolean },
  formulario: FormData,
) {
  const leer = (campo: string) => {
    const valor = formulario.get(campo);
    return typeof valor === "string" ? valor.trim() || null : null;
  };
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
    {
      horario: leer("horario"),
      tarifaGeneral: leer("tarifaGeneral")?.replace(",", ".") ?? null,
      tarifaEstudiantes: leer("tarifaEstudiantes")?.replace(",", ".") ?? null,
    },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, error: true };
  revalidatePath("/destinos");
  revalidatePath(`/destinos/${encodeURIComponent(slug)}`);
  return { mensaje: "Ficha pública actualizada.", error: false };
}
