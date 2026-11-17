export type AccesoEncargado = {
  id: string;
  tipo: "invitacion" | "solicitud";
  estado: "pendiente" | "aprobada" | "rechazada" | "revocada";
  correo: string;
  motivo: string | null;
  contacto: string | null;
  propuesta: {
    nombre: string;
    ubicacion: string;
    descripcion: string;
    provincia: string;
    categoria: string;
    latitud: number;
    longitud: number;
  } | null;
  destino: { id: string; nombre: string } | null;
  creadoEn: string;
  venceEn: string | null;
  vencida: boolean;
  observacion: string | null;
};

export type ListadoAccesos = { filas: AccesoEncargado[]; hayMas: boolean };
export type OpcionDestino = { id: string; nombre: string };

export type DetalleInvitacion = {
  valida: boolean;
  estado: string;
  vencida: boolean;
  correo: string;
  nuevo: boolean;
  destino: {
    id: string;
    nombre: string;
    ubicacion: string;
    imagenUrl: string | null;
    provincia: string;
    categoria: string;
    descripcion?: string;
  } | null;
  venceEn: string | null;
};
export const campo =
  "min-w-0 w-full min-h-12 rounded-xl border border-[#bdcfc2] bg-white px-3 py-2.5 text-base sm:text-sm font-normal";
export const principal =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#174238] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-60";
export const secundario =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-[#bdcfc2] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60";
export const estados = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  revocada: "Revocada",
};


export function mensajeInvitacionNoDisponible(detalle: DetalleInvitacion) {
  if (detalle.estado === "aprobada") return "Esta invitación ya fue utilizada.";
  if (detalle.estado === "revocada") return "Esta invitación fue revocada.";
  if (detalle.vencida) return "El enlace de invitación ha vencido.";
  return "Esta invitación ya no está activa.";
}
