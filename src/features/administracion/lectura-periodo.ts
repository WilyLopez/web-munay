type DatosLectura = {
  tendencia: { mes: string; total: number }[];
  recientes: { calificacion: number }[];
};

export function leerPeriodo({ tendencia, recientes }: DatosLectura) {
  const total = tendencia.reduce((suma, periodo) => suma + periodo.total, 0);
  const maximo = Math.max(0, ...tendencia.map(({ total }) => total));
  const destacados =
    maximo > 0
      ? tendencia.filter(({ total }) => total === maximo).map(({ mes }) => mes)
      : [];
  const porcentaje = total > 0 ? (maximo / total) * 100 : 0;
  const favorables = recientes.filter(
    ({ calificacion }) => calificacion >= 4,
  ).length;
  const bajas = recientes.filter(
    ({ calificacion }) => calificacion <= 2,
  ).length;
  const cantidad = recientes.length;
  const observacion =
    cantidad === 0
      ? "Aún no hay reseñas en este período para orientar una lectura de las opiniones."
      : `Entre las reseñas recientes mostradas (${cantidad}), hay ${favorables} con 4 o 5 estrellas y ${bajas} con 1 o 2. ${bajas > 0 ? "Revisa los comentarios con menor calificación para identificar oportunidades de mejora." : "Revisa los comentarios para conocer qué valoran tus visitantes."}`;
  return { destacados, maximo, porcentaje, observacion };
}

