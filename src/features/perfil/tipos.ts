export const seccionesPerfil = [
  ["visitas", "Mis visitas"],
  ["resenas", "Mis reseñas"],
  ["fotos", "Mis fotos"],
  ["respuestas", "Mis respuestas"],
  ["favoritos", "Favoritos"],
  ["puntos", "Mis puntos"],
] as const;

export type SeccionPerfil = (typeof seccionesPerfil)[number][0];

export type ResumenPerfil = {
  nombre: string;
  correo: string;
  rol: "TURISTA";
  visitas: number;
  resenas: number;
  favoritos: number;
  fotos: number;
  respuestas: number;
  saldo: number;
  puntosPendientes: number;
  posicion: number | null;
  ranking: {
    nombre: string;
    saldo: number;
    posicion: number;
    propia: boolean;
  }[];
};

export type DestinoHistorial = {
  slug: string;
  nombre: string;
  ubicacion: string;
  imagenUrl: string | null;
  estadoEditorial: string;
};

type DatosResena = {
  id: string;
  creadaEn: string;
  comentario: string;
  calificacion: number;
  retiradaEn: string | null;
  fotoUrl: string | null;
  selfieDeclarada: boolean;
  visita: { verificadaEn: string } | null;
  movimientosPuntos: { tipo: string; puntos: number }[];
  _count: { respuestas: number };
  destino: DestinoHistorial;
};

export type HistorialPerfilDatos = { hayMas: boolean } & (
  | {
      seccion: "visitas";
      filas: {
        id: string;
        verificadaEn: string;
        resena: { id: string; retiradaEn: string | null } | null;
        destino: DestinoHistorial;
      }[];
    }
  | { seccion: "resenas" | "fotos"; filas: DatosResena[] }
  | {
      seccion: "respuestas";
      filas: {
        id: string;
        creadaEn: string;
        comentario: string;
        resena: {
          id: string;
          retiradaEn: string | null;
          destino: DestinoHistorial;
        };
      }[];
    }
  | {
      seccion: "favoritos";
      filas: { id: string; creadoEn: string; destino: DestinoHistorial }[];
    }
  | {
      seccion: "puntos";
      filas: {
        id: string;
        creadoEn: string;
        tipo: string;
        puntos: number;
        resena: {
          id: string;
          selfieDeclarada: boolean;
          destino: DestinoHistorial;
        } | null;
        canje?: {
          id: string;
          nombre: string;
          beneficio: { destino: DestinoHistorial };
        } | null;
      }[];
    }
);

export function enlaceHistorial(seccion: SeccionPerfil, pagina = 1) {
  return `/mi-perfil?seccion=${seccion}&pagina=${pagina}#historial`;
}
