"use server";
import { revalidatePath } from "next/cache";
import { solicitarVisitas } from "@/features/visitas/api";
import type {
  ComprobanteCanje,
  AuditoriaBeneficio,
  DetalleBeneficio,
} from "./tipos";

function actualizar() {
  for (const ruta of [
    "/beneficios",
    "/mi-perfil",
    "/administracion/beneficios",
    "/superadmin/beneficios",
  ])
    revalidatePath(ruta);
}
export async function confirmarCanje(
  beneficioId: string,
  solicitudId: string,
  costo: number,
  version: number,
) {
  const resultado = await solicitarVisitas<ComprobanteCanje>(
    "/beneficios/canjear",
    { beneficioId, solicitudId, costo, version },
  );
  if (resultado.ok) actualizar();
  return resultado;
}
export async function guardarBeneficio(
  datos: Record<string, unknown>,
  id?: string,
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/beneficios/administracion${id ? `/${encodeURIComponent(id)}` : ""}`,
    datos,
    id ? { metodo: "PUT" } : undefined,
  );
  if (resultado.ok) actualizar();
  return resultado;
}
export async function comprobarCanje(codigo: string, confirmar: boolean) {
  return solicitarVisitas<{
    nombre: string;
    local: string;
    condiciones: string;
    venceEn: string;
    estado: string;
    puedeEntregar: boolean;
    aviso: string | null;
    detalle?: Partial<DetalleBeneficio>;
  }>("/beneficios/comprobar", { codigo, confirmar });
}

export async function cambiarEstadoBeneficio(
  id: string,
  accion: "pausar" | "reanudar",
  revision: number,
) {
  const resultado = await solicitarVisitas<{ id: string }>(
    `/beneficios/administracion/${encodeURIComponent(id)}/estado`,
    { accion, revision },
  );
  if (resultado.ok) actualizar();
  return resultado;
}
export async function consultarHistorialBeneficio(id: string, pagina: number) {
  return solicitarVisitas<AuditoriaBeneficio>(
    `/beneficios/administracion/${encodeURIComponent(id)}/historial?pagina=${pagina}`,
  );
}
