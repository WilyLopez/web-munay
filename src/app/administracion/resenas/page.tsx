import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { ReportarResena } from "@/features/administracion/controles-reporte";
import type { ListadoResenas } from "@/features/resenas/tipos";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita, type DestinoVisita } from "@/features/visitas/tipos";

type Consulta = { destino?: string; pagina?: string };

async function ResenasAsignadas({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel())) return null;
  const [{ destino, pagina }, acceso] = await Promise.all([
    consulta,
    solicitarVisitas<DestinoVisita[]>("/visitas/administracion"),
  ]);
  if (!acceso.ok) return <p role="alert">{acceso.mensaje}</p>;
  if (!acceso.datos.length)
    return <p>Tu cuenta aún no tiene atractivos asignados.</p>;
  const elegido = destino
    ? acceso.datos.find(({ slug }) => slug === destino)
    : acceso.datos[0];
  if (!elegido)
    return <p role="alert">El atractivo no está disponible para tu cuenta.</p>;
  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const filtro = new URLSearchParams({ destino: elegido.slug });
  const resultado = await solicitarVisitas<ListadoResenas>(
    `/resenas?${filtro}&pagina=${actual}`,
  );
  if (!resultado.ok) return <p role="alert">{resultado.mensaje}</p>;
  return (
    <>
      <form
        action="/administracion/resenas"
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Atractivo
          <select
            name="destino"
            defaultValue={elegido.slug}
            className="rounded-lg border border-[#bdcfc2] bg-white px-3 py-2"
          >
            {acceso.datos.map(({ id, slug, nombre }) => (
              <option key={id} value={slug}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white">
          Ver reseñas
        </button>
      </form>
      {resultado.datos.resenas.length ? (
        <ul className="divide-y divide-[#dce3da] rounded-2xl border border-[#dce3da] bg-white">
          {resultado.datos.resenas.map((resena) => (
            <li key={resena.id} className="space-y-2 p-5">
              <p className="font-semibold">
                {resena.usuario.nombreCompleto} · {resena.calificacion} de 5
              </p>
              <p className="text-xs text-[#4d665b]">
                {fechaVisita.format(new Date(resena.creadaEn))} ·{" "}
                {resena.verificada ? "Visita verificada" : "Sin verificación"}
              </p>
              <p className="wrap-anywhere text-sm">{resena.comentario}</p>
              <ReportarResena id={resena.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay reseñas en esta página.</p>
      )}
      <nav
        aria-label="Páginas de reseñas"
        className="flex gap-4 text-sm font-semibold"
      >
        {actual > 1 && (
          <Link className="underline" href={`?${filtro}&pagina=${actual - 1}`}>
            Anterior
          </Link>
        )}
        {resultado.datos.hayMas && (
          <Link className="underline" href={`?${filtro}&pagina=${actual + 1}`}>
            Siguiente
          </Link>
        )}
      </nav>
    </>
  );
}

export default function PaginaResenas({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="max-w-4xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">
        Reseñas de atractivos
      </h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-40 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando reseñas</span>
          </div>
        }
      >
        <ResenasAsignadas consulta={searchParams} />
      </Suspense>
    </main>
  );
}
