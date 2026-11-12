export type DestinoVisita = { id: string; nombre: string; slug: string };
export type Visita = { id: string; verificadaEn: string };

export type Verificacion = {
  visita: Visita;
  destino: DestinoVisita;
  yaVerificada: boolean;
};

export type PantallaVisitas = {
  destino: DestinoVisita;
  codigo: { id: string; valor: string; creadoEn: string; venceEn: string };
  horaServidor: string;
  recientes: Visita[];
  totalHoy: number;
};

export type HistorialVisitas = { registros: Visita[]; hayMas: boolean };

export type Resultado<T> =
  { ok: true; datos: T } | { ok: false; estado: number; mensaje: string };

export const fechaVisita = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  dateStyle: "short",
  timeStyle: "medium",
});
