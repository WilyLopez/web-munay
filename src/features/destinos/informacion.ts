export const gruposInformacion = [
  [
    "Identidad e historia",
    [
      ["distrito", "Distrito", 100],
      ["etiquetas", "Etiquetas (una por línea)", 400, "lista"],
      ["detalles", "Qué encontrarás", 5000, "area"],
      ["historia", "Historia y valor cultural o natural", 8000, "area"],
      [
        "fuentesHistoria",
        "Fuentes de la historia (un enlace HTTPS por línea)",
        2500,
        "enlaces",
      ],
    ],
  ],
  [
    "Contacto y redes oficiales",
    [
      ["telefono", "Teléfono", 40],
      ["whatsapp", "WhatsApp con código de país", 20, "whatsapp"],
      ["correo", "Correo oficial", 254, "email"],
      ["sitioWeb", "Sitio web", 500, "url"],
      ["facebook", "Facebook", 500, "url"],
      ["instagram", "Instagram", 500, "url"],
      ["tiktok", "TikTok", 500, "url"],
      ["youtube", "Canal de YouTube", 500, "url"],
    ],
  ],
  [
    "Fotos y video",
    [
      ["portadaAlt", "Texto alternativo de portada", 180],
      ["portadaAutor", "Autor de portada", 120],
      ["portadaLicencia", "Licencia de portada", 120],
      ["videoTitulo", "Título del video", 160],
      ["videoYoutube", "Video de YouTube", 500, "url"],
    ],
  ],
  [
    "Información para la visita",
    [
      ["condicion", "Condición de visita", 40, "condicion"],
      ["motivoCierre", "Motivo del cierre o restricción", 500, "area"],
      ["reapertura", "Reapertura estimada", 10, "date"],
      ["ultimoIngreso", "Último ingreso", 5, "time"],
      ["excepcionesHorario", "Excepciones de horario", 1000, "area"],
      ["modalidadIngreso", "Modalidad de ingreso", 40, "modalidad"],
      [
        "tarifasAdicionales",
        "Otras tarifas en soles (una por línea)",
        1200,
        "lista",
      ],
      ["metodosPago", "Métodos de pago (uno por línea)", 500, "lista"],
      ["reservaUrl", "Enlace oficial de reservas", 500, "url"],
      ["accesoSilla", "Acceso para silla de ruedas", 20, "acceso"],
      ["rampas", "Rampas", 20, "acceso"],
      ["banosAdaptados", "Baños adaptados", 20, "acceso"],
      ["terreno", "Condiciones del terreno", 1000, "area"],
      ["servicios", "Servicios e instalaciones (uno por línea)", 1200, "lista"],
      ["idiomas", "Idiomas de atención (uno por línea)", 500, "lista"],
      ["reglas", "Reglas y restricciones", 1500, "area"],
      ["actividades", "Actividades (una por línea)", 1200, "lista"],
      ["duracionVisita", "Duración sugerida de la visita", 120],
      ["dificultad", "Dificultad del recorrido", 80],
      ["temporada", "Temporada recomendada", 120],
    ],
  ],
  [
    "Cómo llegar",
    [
      ["transporte", "Transporte disponible", 1000, "area"],
      ["estacionamiento", "Información de estacionamiento", 500, "area"],
      ["mapaUrl", "Enlace de ubicación oficial", 500, "url"],
      ["latitudIngreso", "Latitud de la entrada", 25, "latitud"],
      ["longitudIngreso", "Longitud de la entrada", 25, "longitud"],
    ],
  ],
  [
    "Aviso temporal",
    [
      ["aviso", "Mensaje para visitantes", 800, "area"],
      ["avisoDesde", "Fecha de inicio", 10, "date"],
      ["avisoHasta", "Fecha de fin", 10, "date"],
    ],
  ],
] as const;

export const opcionesInformacion = {
  condicion: [
    ["abierto", "Abierto"],
    ["cerrado", "Cerrado temporalmente"],
    ["restringido", "Acceso restringido"],
  ],
  modalidad: [
    ["libre", "Entrada libre"],
    ["pago", "Entrada de pago"],
    ["reserva", "Con reserva"],
  ],
  acceso: [
    ["si", "Disponible"],
    ["no", "No disponible"],
  ],
} as const;

type CampoInformacion = (typeof gruposInformacion)[number][1][number][0];
export type FotoDestino = {
  url: string;
  alt: string;
  descripcion: string;
  autor: string;
  licencia: string;
};
export type InformacionDestino = Partial<Record<CampoInformacion, string>> & {
  galeria?: FotoDestino[];
};
export type EstadoFicha =
  "borrador" | "en_revision" | "publicada" | "archivada";
export const estadosFicha: Record<EstadoFicha, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicada: "Publicada",
  archivada: "Archivada",
};
