import Link from "next/link";
import { Suspense } from "react";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

const secciones = [
  ["visitas", "Visitas verificadas"],
  ["resenas", "Mis reseñas"],
] as const;

type Seccion = (typeof secciones)[number][0];
type Fila = {
  id: string;
  destino: { nombre: string; slug: string; ubicacion: string };
};
type Historial = { hayMas: boolean } & (
  | { seccion: "visitas"; filas: (Fila & { verificadaEn: string })[] }
  | {
      seccion: "resenas";
      filas: (Fila & {
        creadaEn: string;
        comentario: string;
        calificacion: number;
        retiradaEn: string | null;
      })[];
    }
);

const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "America/Lima",
});

function enlaceHistorial(seccion: Seccion, pagina = 1) {
  return `/mi-perfil?seccion=${seccion}&pagina=${pagina}#historial` as const;
}

async function FilasHistorial({
  seccion,
  pagina,
}: {
  seccion: Seccion;
  pagina: number;
}) {
  const resultado = await solicitarVisitas<Historial>(
    `/puntos/mi-historial?seccion=${seccion}&pagina=${pagina}`,
  );
  if (!resultado.ok) {
    return (
      <div role="alert" className="space-y-2 rounded-2xl bg-stone-100 p-5">
        <p>No pudimos cargar tu historial.</p>
        <BotonActualizarPanel reintentar />
      </div>
    );
  }

  const { filas, hayMas } = resultado.datos;
  return (
    <>
      {filas.length > 0 ? (
        <ul className="divide-y divide-stone-200">
          {filas.map((fila) => (
            <li key={fila.id} className="space-y-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={enlaceFicha(fila.destino.slug)}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {fila.destino.nombre}
                </Link>
                {"verificadaEn" in fila ? (
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
                    Verificada
                  </span>
                ) : (
                  <span className="text-sm font-semibold">
                    {fila.calificacion} de 5
                  </span>
                )}
              </div>
              {"verificadaEn" in fila ? (
                <p className="text-sm text-stone-600">
                  {fila.destino.ubicacion} ·{" "}
                  {fecha.format(new Date(fila.verificadaEn))}
                </p>
              ) : (
                <>
                  <p className="text-sm text-stone-600">
                    {fecha.format(new Date(fila.creadaEn))}
                    {fila.retiradaEn && " · Retirada"}
                  </p>
                  <p className="whitespace-pre-wrap wrap-anywhere text-sm">
                    {fila.comentario}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2 rounded-2xl bg-stone-100 p-5 text-sm">
          <p>
            {pagina > 1
              ? "Esta página ya no tiene resultados."
              : seccion === "visitas"
                ? "Verifica tu primera visita escaneando el código QR del destino."
                : "Tus reseñas aparecerán aquí cuando compartas tu primera experiencia."}
          </p>
          <Link
            href={pagina > 1 ? enlaceHistorial(seccion) : "/destinos"}
            className="inline-block font-semibold underline underline-offset-4"
          >
            {pagina > 1
              ? "Volver al inicio del historial"
              : "Explorar destinos"}
          </Link>
        </div>
      )}
      {(pagina > 1 || hayMas) && (
        <nav
          aria-label="Paginación del historial"
          className="flex flex-wrap items-center gap-4 text-sm"
        >
          {pagina > 1 && (
            <Link
              className="font-semibold underline"
              href={enlaceHistorial(seccion, pagina - 1)}
            >
              Anterior
            </Link>
          )}
          <span>Página {pagina}</span>
          {hayMas && (
            <Link
              className="font-semibold underline"
              href={enlaceHistorial(seccion, pagina + 1)}
            >
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

export function HistorialPerfil({
  consulta,
}: {
  consulta: Record<string, string | string[] | undefined>;
}) {
  const seccion = consulta.seccion === "resenas" ? "resenas" : "visitas";
  const pagina =
    typeof consulta.pagina === "string" &&
    /^[1-9]\d{0,3}$/.test(consulta.pagina)
      ? Number(consulta.pagina)
      : 1;

  return (
    <section
      id="historial"
      className="scroll-mt-24 space-y-4 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"
    >
      <h2 className="font-serif text-2xl">Mi historial</h2>
      <nav
        aria-label="Secciones del historial"
        className="flex flex-wrap gap-2"
      >
        {secciones.map(([valor, etiqueta]) => (
          <Link
            key={valor}
            aria-current={valor === seccion ? "page" : undefined}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold hover:border-teal-800 aria-[current=page]:border-teal-900 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white"
            href={enlaceHistorial(valor)}
          >
            {etiqueta}
          </Link>
        ))}
      </nav>
      <Suspense
        key={`${seccion}-${pagina}`}
        fallback={
          <div role="status" className="space-y-3">
            <span className="sr-only">Cargando historial</span>
            {[1, 2, 3].map((fila) => (
              <div
                key={fila}
                className="h-16 rounded-xl bg-stone-100 motion-safe:animate-pulse"
              />
            ))}
          </div>
        }
      >
        <FilasHistorial seccion={seccion} pagina={pagina} />
      </Suspense>
    </section>
  );
}
