"use server";

import { solicitarVisitas } from "./api";
import type {
  HistorialVisitas,
  PantallaVisitas,
  PreparacionVisita,
  UbicacionVisita,
  Verificacion,
} from "./tipos";

export async function prepararVisita(codigo: string, destino?: string) {
  return solicitarVisitas<PreparacionVisita>("/visitas/verificar/preparar", {
    codigo,
    destino,
  });
}

export async function verificarVisita(
  codigo: string,
  ubicacion: UbicacionVisita,
  destino?: string,
) {
  return solicitarVisitas<Verificacion>("/visitas/verificar", {
    codigo,
    destino,
    ubicacion,
  });
}

export async function sincronizarPantalla(slug: string, codigoId?: string) {
  return solicitarVisitas<PantallaVisitas>(
    `/visitas/administracion/${encodeURIComponent(slug)}/codigo`,
    { renovar: codigoId !== undefined, codigoId },
  );
}

export async function consultarHistorial(slug: string, pagina: number) {
  const consulta = new URLSearchParams({ pagina: String(pagina) });
  return solicitarVisitas<HistorialVisitas>(
    `/visitas/administracion/${encodeURIComponent(slug)}/historial?${consulta}`,
  );
}


export async function consultarPantallaPublica(slug: string) {
  return solicitarVisitas<Omit<PantallaVisitas, "recientes" | "totalHoy">>(
    `/visitas/pantalla/${encodeURIComponent(slug)}`,
    undefined,
    { publica: true },
  );
}
