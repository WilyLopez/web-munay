import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  estadosFicha,
  type EstadoFicha,
} from "@/features/destinos/informacion";
import { solicitarVisitas } from "@/features/visitas/api";

async function Destinos() {
  await connection();
  const respuesta = await solicitarVisitas<
    { id: string; nombre: string; slug: string; estadoEditorial: EstadoFicha }[]
  >("/destinos/administracion/resumen");
  if (!respuesta.ok) return <p role="alert">{respuesta.mensaje}</p>;
  const filas = respuesta.datos.toSorted(
    (a, b) =>
      Number(b.estadoEditorial === "en_revision") -
      Number(a.estadoEditorial === "en_revision"),
  );
  return filas.length ? (
    <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white px-5">
      {filas.map(({ id, nombre, slug, estadoEditorial }) => (
        <li
          key={id}
          className="flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <Link
            href={`/superadmin/destinos/${encodeURIComponent(slug)}`}
            className="font-semibold underline underline-offset-4"
          >
            {nombre}
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-sm ${estadoEditorial === "en_revision" ? "bg-amber-100" : "bg-teal-50"}`}
          >
            {estadosFicha[estadoEditorial]}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p>Todavía no hay destinos registrados.</p>
  );
}

export default function PaginaRevisionDestinos() {
  return (
    <main className="max-w-4xl space-y-5">
      <h1 className="font-serif text-4xl">Revisión de destinos</h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-36 rounded-2xl bg-teal-100 motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando destinos</span>
          </div>
        }
      >
        <Destinos />
      </Suspense>
    </main>
  );
}
