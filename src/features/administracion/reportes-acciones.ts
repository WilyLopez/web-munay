"use server";

import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";

export async function reportarResena(
  id: string,
  _estado: { mensaje: string; ok: boolean },
  datos: FormData,
) {
  const categoria = datos.get("categoria");
  const motivoTexto = String(datos.get("motivo") ?? "").trim();
  const motivo =
    categoria && categoria !== "otro"
      ? `[${categoria}] ${motivoTexto}`
      : motivoTexto;

  const respuesta = await solicitarVisitas(
    `/reportes-resenas/resena/${encodeURIComponent(id)}`,
    { motivo },
    { metodo: "PUT" },
  );
  return respuesta.ok
    ? { mensaje: "Reporte enviado al SuperAdmin.", ok: true }
    : { mensaje: respuesta.mensaje, ok: false };
}

export async function revisarReporte(
  id: string,
  _estado: { mensaje: string; ok: boolean },
  datos: FormData,
) {
  const decision = datos.get("decision");
  const respuesta = await solicitarVisitas(
    `/reportes-resenas/${encodeURIComponent(id)}/revision`,
    { decision, motivo: datos.get("motivo") },
    { metodo: "PUT" },
  );
  if (!respuesta.ok) return { mensaje: respuesta.mensaje, ok: false };
  revalidatePath("/superadmin/reportes");
  if (decision === "retirar") {
    revalidatePath("/");
    revalidatePath("/mi-perfil");
    revalidatePath("/destinos");
    revalidatePath("/destinos/[slug]", "page");
    revalidatePath("/resenas");
    revalidatePath("/administracion/estadisticas");
    revalidatePath("/administracion/resenas");
  }
  return {
    mensaje:
      decision === "retirar"
        ? "Reseña retirada."
        : "La reseña permanece publicada.",
    ok: true,
  };
}
