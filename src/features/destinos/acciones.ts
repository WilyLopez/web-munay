"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarDestinos } from "./api";

export async function actualizarFavorito(destinoId: string, favorito: boolean) {
  if (
    !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(destinoId) ||
    typeof favorito !== "boolean"
  ) {
    return "El destino no es válido.";
  }

  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/ingresar?aviso=sesion");
  }

  let respuesta;

  try {
    respuesta = await solicitarDestinos(
      data.session.access_token,
      `/destinos/${destinoId}/favorito`,
      favorito ? "PUT" : "DELETE",
    );
  } catch {
    return "No se pudo guardar el cambio. Intenta de nuevo.";
  }

  if (respuesta.status === 401) {
    redirect("/ingresar?aviso=sesion");
  }

  if (!respuesta.ok) {
    return "No se pudo guardar el cambio. Intenta de nuevo.";
  }

  revalidatePath("/destinos");
  revalidatePath("/destinos/[slug]", "page");
  return null;
}
