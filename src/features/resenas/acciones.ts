"use server";

import { revalidatePath, updateTag } from "next/cache";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import type {
  ListadoRespuestas,
  PreparacionResena,
  RecompensaResena,
} from "./tipos";
import { solicitarVisitas } from "@/features/visitas/api";

export async function comprobarSesionResena(slug: string) {
  return solicitarVisitas<PreparacionResena>(
    `/resenas/escribir/${encodeURIComponent(slug)}`,
  );
}

export async function consultarRecompensaResena(id: string) {
  return solicitarVisitas<RecompensaResena>(
    `/puntos/resenas/${encodeURIComponent(id)}/recompensa`,
  );
}

export async function publicarResena(
  slug: string,
  calificacion: number,
  comentario: string,
  solicitudId?: string,
  foto?: { archivo: string; selfie: boolean; consentimiento: boolean },
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/resenas/${encodeURIComponent(slug)}`,
    {
      calificacion,
      comentario,
      solicitudId,
      fotoArchivo: foto?.archivo,
      selfieDeclarada: foto?.selfie,
      consentimientoFoto: foto?.consentimiento,
    },
  );
  if (resultado.ok) {
    updateTag("destinos");
    revalidatePath("/");
    revalidatePath("/mi-perfil");
    revalidatePath("/destinos");
    revalidatePath("/destinos/[slug]", "page");
    revalidatePath("/administracion");
    revalidatePath("/administracion/resenas");
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

export async function prepararFotoResena(slug: string, tipo: string) {
  const extensiones: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!extensiones[tipo]) return { error: "Elige una imagen JPG, PNG o WebP." };
  const resultado = await solicitarVisitas<PreparacionResena>(
    `/resenas/escribir/${encodeURIComponent(slug)}`,
  );
  if (!resultado.ok || resultado.datos.estado !== "habilitada")
    return { error: "Verifica tu visita antes de añadir una foto." };
  const destino = resultado.datos.destino;
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Inicia sesión para subir tu foto." };
  const archivo = `${data.user.id}/${destino.id}/${crypto.randomUUID()}.${extensiones[tipo]}`;
  const almacen = supabase.storage.from("resenas");
  const subida = await almacen.createSignedUploadUrl(archivo);
  if (subida.error)
    return { error: "No pudimos preparar la foto. Inténtalo de nuevo." };
  return {
    archivo,
    token: subida.data.token,
    url: almacen.getPublicUrl(archivo).data.publicUrl,
  };
}

export async function consultarRespuestas(id: string, pagina: number) {
  return solicitarVisitas<ListadoRespuestas>(
    `/resenas/${encodeURIComponent(id)}/respuestas?pagina=${pagina}`,
    undefined,
    { publica: true },
  );
}

export async function publicarRespuesta(
  id: string,
  comentario: string,
  solicitudId: string,
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/resenas/${encodeURIComponent(id)}/respuestas`,
    { comentario, solicitudId },
  );
  if (resultado.ok) {
    revalidatePath("/resenas");
    revalidatePath("/destinos/[slug]", "page");
    revalidatePath("/administracion");
    revalidatePath("/administracion/resenas");
  }
  return resultado;
}

export async function retirarRespuesta(id: string) {
  const resultado = await solicitarVisitas<void>(
    `/resenas/respuestas/${encodeURIComponent(id)}`,
    undefined,
    { metodo: "DELETE" },
  );
  if (resultado.ok) {
    revalidatePath("/resenas");
    revalidatePath("/destinos/[slug]", "page");
    revalidatePath("/administracion");
    revalidatePath("/administracion/resenas");
  }
  return resultado;
}
