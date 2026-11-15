export type Resena = {
  id: string;
  comentario: string;
  calificacion: number;
  creadaEn: string;
  usuario: { nombreCompleto: string };
  destino: { nombre: string; slug: string };
  verificada: boolean;
  utiles: number;
  votoPropio: boolean;
  integridad?: { huella: string; transaccion: string | null } | null;
};

export type ListadoResenas = {
  resenas: Resena[];
  destinos: Resena["destino"][];
  total: number;
  verificadas: number;
  promedio: number | null;
  distribucion: { calificacion: number; total: number }[];
  hayMas: boolean;
  estado: "visitante" | "habilitada" | "bloqueada" | "publicada" | "retirada";
  recompensa?: { puntos: number; creadoEn: string; destino: string } | null;
};
