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
export const campo =
  "min-w-0 w-full rounded-xl border border-[#bdcfc2] bg-white px-3 py-2.5 text-sm font-normal";
export const principal =
  "rounded-xl bg-[#174238] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-60";
export const secundario =
  "rounded-xl border border-[#bdcfc2] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-60";
export const estados = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  revocada: "Revocada",
};
