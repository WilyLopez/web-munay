"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function guardarOrdenPortada(
  id: string,
  _estado: { mensaje: string; error: boolean },
  datos: FormData,
) {
  const valor = datos.get("orden");
  if (
    typeof valor !== "string" ||
    (valor !== "" && (!/^[1-9]\d*$/.test(valor) || Number(valor) > 2147483647))
  ) {
    return { mensaje: "Escribe un número entero positivo.", error: true };
  }
  const respuesta = await solicitarVisitas(
    `/destinos/${encodeURIComponent(id)}/orden-portada`,
    { ordenPortada: valor === "" ? null : Number(valor) },
    { metodo: "PUT" },
  );
  if (!respuesta.ok) {
    return {
      mensaje:
        respuesta.estado === 403
          ? "Tu cuenta no puede editar la portada."
          : respuesta.mensaje,
      error: true,
    };
  }
  revalidatePath("/");
  revalidatePath("/superadmin");
  return { mensaje: "Orden guardado.", error: false };
}
