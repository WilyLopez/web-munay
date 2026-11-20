export type Beneficio = {
  id: string;
  destinoId: string;
  nombre: string;
  categoria: string;
  local: string;
  condiciones: string;
  horario: string;
  costo: number;
  disponibles: number;
  unUso: boolean;
  activo: boolean;
  revision: number;
  estado: string;
  estadoVista: string;
  tipo: "PORCENTAJE" | "IMPORTE" | "ENTRADA" | "EXPERIENCIA";
  valor: number | null;
  iniciaEn: string;
  limitePorPersona: number | null;
  dias: number[];
  horaInicio: string | null;
  horaFin: string | null;
  consumoMinimo: number;
  exclusiones: string;
  reservaPrevia: boolean;
  acumulable: boolean;
  aprobadoRevision: number | null;
  venceEn: string;
  actualizadoEn: string;
  destino: { id: string; nombre: string; slug: string };
};
export type CatalogoBeneficios = {
  beneficios: Beneficio[];
  total: number;
  hayMas: boolean;
  saldo: number;
  usuarioId: string;
  destinos: Beneficio["destino"][];
};
export type ComprobanteCanje = {
  id: string;
  nombre: string;
  local: string;
  condiciones: string;
  horario: string;
  codigo: string;
  costo: number;
  creadoEn: string;
  venceEn: string;
  estado: "disponible" | "usado" | "vencido";
  saldo: number;
  destino: Beneficio["destino"];
  detalle?: Partial<DetalleBeneficio>;
};

export type DetalleBeneficio = Pick<
  Beneficio,
  | "tipo"
  | "valor"
  | "limitePorPersona"
  | "dias"
  | "horaInicio"
  | "horaFin"
  | "consumoMinimo"
  | "exclusiones"
  | "reservaPrevia"
  | "acumulable"
>;
export const estadosBeneficio: Record<string, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente de aprobación",
  publicado: "Publicado",
  pausado: "Pausado",
  agotado: "Agotado",
  vencido: "Vencido",
  programado: "Programado",
};
export type AuditoriaBeneficio = {
  registros: {
    id: string;
    accion: string;
    creadaEn: string;
    cambios: unknown;
    actor: { nombreCompleto: string };
  }[];
  hayMas: boolean;
};
export type CanjesRecibidos = {
  canjes: {
    id: string;
    codigoParcial: string;
    nombre: string;
    local: string;
    costo: number;
    creadoEn: string;
    venceEn: string;
    usadoEn: string | null;
    confirmadoPor: string | null;
    estado: string;
    usuario: { nombreCompleto: string };
  }[];
  total: number;
  hayMas: boolean;
};
