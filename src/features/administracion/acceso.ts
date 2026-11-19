import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { destinoSesion } from "@/features/autenticacion/destino-sesion";
import { solicitarVisitas } from "@/features/visitas/api";

type PerfilPanel = {
  id: string;
  nombreCompleto: string;
  rol: "ADMIN_DESTINO" | "SUPER_ADMIN";
};

const consultarPerfil = cache(async () => {
  await connection();
  return solicitarVisitas<{ perfil: PerfilPanel }>("/autenticacion/sesion");
});

export async function accesoPanel(soloSuperAdmin = false) {
  const sesion = await consultarPerfil();
  if (!sesion.ok) {
    if (sesion.estado === 401) redirect("/ingresar?aviso=sesion");
    return null;
  }
  const perfil = sesion.datos.perfil;
  if (
    perfil.rol !== "SUPER_ADMIN" &&
    (soloSuperAdmin || perfil.rol !== "ADMIN_DESTINO")
  ) {
    redirect(destinoSesion(perfil.rol) ?? "/");
  }
  return perfil;
}
