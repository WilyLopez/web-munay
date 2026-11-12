export const categorias = {
  HISTORIA: "Historia",
  CULTURA: "Cultura",
  NATURALEZA: "Naturaleza",
  PLAYAS: "Playas",
} as const;

export type Categoria = keyof typeof categorias;

export const provincias = {
  CHICLAYO: "Chiclayo",
  LAMBAYEQUE: "Lambayeque",
  FERRENAFE: "Ferreñafe",
} as const;

export type Destino = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  categoria: Categoria;
  provincia: keyof typeof provincias;
  latitud: number;
  longitud: number;
  imagenUrl: string | null;
  horario: string | null;
  tarifaGeneral: number | null;
  tarifaEstudiantes: number | null;
  calificacionPromedio: number | null;
  verificado: boolean;
  favorito: boolean;
};

export function enlaceFicha(slug: string, volver?: string) {
  const ruta = `/destinos/${encodeURIComponent(slug)}`;
  return volver && volver !== "/destinos"
    ? `${ruta}?${new URLSearchParams({ volver })}`
    : ruta;
}

export type FichaDestino = {
  destino: Destino & {
    fotosAdicionales: string[];
    diasAtencion: number[];
    rutaDesdeChiclayo: string | null;
    distanciaKm: number | null;
    duracionMinutos: number | null;
    recomendacion: string | null;
    fuenteRutaUrl: string | null;
  };
  tieneSesion: boolean;
};

export type Catalogo = {
  sesion: {
    perfil: { nombreCompleto: string; rol: string };
    venceEn: string;
  } | null;
  destinos: Destino[];
};
