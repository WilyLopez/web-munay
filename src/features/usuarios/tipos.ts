export const roles = {
  TURISTA: "Usuario",
  ADMIN_DESTINO: "Admin",
  SUPER_ADMIN: "Super Administrador",
};

export type Cuenta = {
  id: string;
  nombreCompleto: string;
  correo: string;
  confirmado: boolean;
  rol: keyof typeof roles;
  activo: boolean;
  creadaEn: string;
  asignados: number;
};

export type Destino = { id: string; nombre: string; slug: string };
export type Detalle = Cuenta & {
  propia: boolean;
  destinos: Destino[];
  visitas: number;
  resenas: number;
  historial: {
    id: string;
    actorId: string;
    accion: string;
    creadaEn: string;
    cambios: Record<string, unknown>;
  }[];
};
export type Pagina = {
  usuarios: Cuenta[];
  total: number;
  pagina: number;
  limite: number;
};
export type Cambio = {
  accion: string;
  valor: string | boolean;
  titulo: string;
  mensaje: string;
  peligro?: boolean;
};

export const campo =
  "min-w-0 rounded-lg border border-[#bdcfc2] bg-white px-3 py-2 text-sm";
export const boton =
  "rounded-lg border border-[#bdcfc2] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-50";
export const principal =
  "rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white hover:bg-[#25594b] disabled:opacity-50";
export const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "America/Lima",
});
