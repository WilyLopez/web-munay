import Link from "next/link";
import { solicitarDestinos } from "@/features/destinos/api";

const categorias = [
  [
    "positivas",
    "Positivas",
    "Predominan las opiniones positivas.",
    "bg-emerald-700",
  ],
  ["neutras", "Neutras", "Predominan las opiniones neutras.", "bg-stone-500"],
  [
    "negativas",
    "Negativas",
    "Predominan las opiniones negativas.",
    "bg-rose-700",
  ],
] as const;

type Resumen = {
  total: number;
  positivas: number;
  neutras: number;
  negativas: number;
  temas: string[];
};

async function cargarResumen(slug: string) {
  try {
    const respuesta = await solicitarDestinos(
      undefined,
      `/resenas/sentimiento/${encodeURIComponent(slug)}`,
    );
    return respuesta.ok ? ((await respuesta.json()) as Resumen) : null;
  } catch {
    return null;
  }
}

export async function TarjetaSentimiento({
  slug,
  ocultarSinDatos = false,
}: {
  slug: string;
  ocultarSinDatos?: boolean;
}) {
  const resumen = await cargarResumen(slug);
  const total = resumen
    ? resumen.positivas + resumen.neutras + resumen.negativas
    : 0;
  if (ocultarSinDatos && (!resumen || total === 0)) return null;

  return (
    <section
      aria-labelledby="titulo-sentimiento"
      className="space-y-4 rounded-3xl border border-teal-200 bg-teal-50 p-5 sm:p-8"
    >
      <h2 id="titulo-sentimiento" className="text-2xl font-bold text-teal-950">
        Qué opinan los visitantes
      </h2>
      {!resumen ? (
        <p className="text-sm">
          El análisis no está disponible en este momento.
        </p>
      ) : total === 0 ? (
        <p className="text-sm">
          Todavía no hay suficientes reseñas analizadas para mostrar un resumen.
        </p>
      ) : (
        <Distribucion resumen={resumen} total={total} />
      )}
      <Link
        href={`/resenas?destino=${encodeURIComponent(slug)}#opiniones`}
        className="inline-block text-sm font-semibold text-teal-950 underline underline-offset-4"
      >
        Ver todas las reseñas
      </Link>
    </section>
  );
}

function Distribucion({ resumen, total }: { resumen: Resumen; total: number }) {
  const filas = categorias.map(([clave, etiqueta, predominio, color]) => {
    const cantidad = resumen[clave];
    const exacto = (cantidad * 100) / total;
    const porcentaje = Math.floor(exacto);
    return {
      clave,
      etiqueta,
      predominio,
      color,
      cantidad,
      porcentaje,
      resto: exacto - porcentaje,
    };
  });
  const faltantes =
    100 - filas.reduce((suma, fila) => suma + fila.porcentaje, 0);
  const redondeadas = new Set(
    filas
      .toSorted((a, b) => b.resto - a.resto)
      .slice(0, faltantes)
      .map(({ clave }) => clave),
  );
  const maximo = Math.max(...filas.map(({ cantidad }) => cantidad));
  const predominantes = filas.filter(({ cantidad }) => cantidad === maximo);
  const temas = new Intl.ListFormat("es-PE").format(resumen.temas);

  return (
    <>
      <p className="text-sm text-teal-950">
        {total} {total === 1 ? "reseña analizada" : "reseñas analizadas"} con
        IA.
        {total === resumen.total
          ? " Análisis actualizado."
          : ` ${resumen.total - total} pendientes de análisis.`}
      </p>
      <dl className="grid grid-cols-3 gap-2">
        {filas.map(({ clave, etiqueta, color, cantidad, porcentaje }) => (
          <div
            key={clave}
            className="min-w-0 rounded-xl bg-white p-2 text-center sm:p-3"
          >
            <dt className="text-xs text-stone-700 sm:text-sm">{etiqueta}</dt>
            <dd className="text-lg font-bold text-teal-950 sm:text-xl">
              {porcentaje + Number(redondeadas.has(clave))}%
            </dd>
            <dd className="text-xs text-stone-700">
              {cantidad} {cantidad === 1 ? "reseña" : "reseñas"}
            </dd>
            <div
              aria-hidden="true"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"
            >
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${(cantidad * 100) / total}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
      <p className="text-sm text-teal-950">
        {predominantes.length === 1
          ? predominantes[0].predominio
          : "Ningún sentimiento predomina en la muestra."}
        {temas &&
          ` Los temas más mencionados son: ${temas.toLocaleLowerCase("es-PE")}.`}
      </p>
      <p className="text-xs text-stone-700">
        El análisis resume opiniones de visitantes. La clasificación es
        experimental y puede equivocarse.
      </p>
    </>
  );
}

export function EsqueletoSentimiento() {
  return (
    <div
      role="status"
      className="h-40 rounded-3xl border border-teal-200 bg-teal-50 motion-safe:animate-pulse"
    >
      <span className="sr-only">Cargando análisis de sentimiento</span>
    </div>
  );
}
