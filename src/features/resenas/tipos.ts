export type Resena = {
  id: string;
  comentario: string;
  calificacion: number;
  creadaEn: string;
  fechaVisita?: string | null;
  fotoUrl?: string | null;
  totalRespuestas?: number;
  respuestaOficial?: boolean;
  usuario: { nombreCompleto: string };
  destino: { nombre: string; slug: string; imagenUrl?: string | null };
  verificada: boolean;
  utiles: number;
  votoPropio: boolean;
  integridad?: { huella: string; transaccion: string | null } | null;
};

export type ListadoResenas = {
  fechaVisita?: string | null;
  puntosResena?: number;
  puntosSelfie?: number;
  puedeResponder?: boolean;
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

export type RespuestaResena = {
  id: string;
  comentario: string;
  creadaEn: string;
  usuario: { nombreCompleto: string };
  propia: boolean;
  oficial?: boolean;
};

export type ListadoRespuestas = {
  respuestas: RespuestaResena[];
  hayMas: boolean;
  puedeResponder: boolean;
};

export type PreparacionResena = {
  destino: {
    id: string;
    nombre: string;
    slug: string;
    imagenUrl: string | null;
  };
  fechaVisita: string | null;
  estado: "habilitada" | "bloqueada" | "publicada" | "retirada";
  resenaId: string | null;
  puntosResena: number;
  puntosSelfie: number;
};

export type RecompensaResena = {
  estado: "acreditada" | "pendiente" | "revertida";
  destino: { nombre: string; slug: string };
  registradoEn: string;
  puntosResena: number;
  puntosSelfie: number;
  total: number;
  previstos: number;
};
