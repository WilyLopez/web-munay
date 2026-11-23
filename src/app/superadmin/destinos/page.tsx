import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  estadosFicha,
  type EstadoFicha,
} from "@/features/destinos/informacion";
import { solicitarVisitas } from "@/features/visitas/api";

type FilaDestino = {
  id: string;
  nombre: string;
  slug: string;
  estadoEditorial: EstadoFicha;
};

const coloresEstado: Record<EstadoFicha, string> = {
  borrador: "bg-stone-100 text-stone-700",
  en_revision: "bg-amber-100 text-amber-800",
  publicada: "bg-teal-50 text-teal-800",
  archivada: "bg-slate-100 text-slate-600",
};

async function ListaDestinos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; buscar?: string }>;
}) {
  await connection();
  const { estado: filtroEstado, buscar } = await searchParams;

  const respuesta = await solicitarVisitas<FilaDestino[]>(
    "/destinos/administracion/resumen",
  );
  if (!respuesta.ok)
    return (
      <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900">
        {respuesta.mensaje}
      </p>
    );

  let filas = respuesta.datos.toSorted(
    (a, b) =>
      Number(b.estadoEditorial === "en_revision") -
      Number(a.estadoEditorial === "en_revision"),
  );

  if (
    filtroEstado &&
    ["borrador", "en_revision", "publicada", "archivada"].includes(filtroEstado)
  ) {
    filas = filas.filter((d) => d.estadoEditorial === filtroEstado);
  }

  if (buscar) {
    const termino = buscar.toLowerCase();
    filas = filas.filter((d) => d.nombre.toLowerCase().includes(termino));
  }

  const totalBorrador = respuesta.datos.filter(
    (d) => d.estadoEditorial === "borrador",
  ).length;
  const totalRevision = respuesta.datos.filter(
    (d) => d.estadoEditorial === "en_revision",
  ).length;
  const totalPublicado = respuesta.datos.filter(
    (d) => d.estadoEditorial === "publicada",
  ).length;

  const filtros: { valor: string; etiqueta: string; cuenta: number }[] = [
    { valor: "", etiqueta: "Todos", cuenta: respuesta.datos.length },
    { valor: "en_revision", etiqueta: "En revisión", cuenta: totalRevision },
    { valor: "publicada", etiqueta: "Publicados", cuenta: totalPublicado },
    { valor: "borrador", etiqueta: "Borradores", cuenta: totalBorrador },
  ];

  const estadoActual = filtroEstado ?? "";

  return (
    <div className="space-y-5">
      <nav
        aria-label="Filtrar por estado"
        className="flex flex-wrap gap-2"
      >
        {filtros.map(({ valor, etiqueta, cuenta }) => {
          const activo = estadoActual === valor;
          const params = new URLSearchParams();
          if (valor) params.set("estado", valor);
          if (buscar) params.set("buscar", buscar);
          return (
            <Link
              key={valor}
              href={params.size ? `?${params}` : "/superadmin/destinos"}
              aria-current={activo ? "page" : undefined}
              className="flex items-center gap-1.5 rounded-full border border-[#ccd9cf] px-3 py-1.5 text-sm font-semibold hover:bg-[#edf3ec] aria-[current=page]:border-[#174238] aria-[current=page]:bg-[#dbece0]"
            >
              {etiqueta}
              <span className="rounded-full bg-[#dce3da] px-1.5 py-0.5 text-[10px] font-bold text-[#173b32]">
                {cuenta}
              </span>
            </Link>
          );
        })}
      </nav>

      {filas.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#edf3ec]">
              <tr>
                <th scope="col" className="p-4 font-semibold text-[#173b32] sm:px-5">
                  Atractivo
                </th>
                <th scope="col" className="p-4 font-semibold text-[#173b32]">
                  Estado editorial
                </th>
                <th scope="col" className="p-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e9e1]">
              {filas.map(({ id, nombre, slug, estadoEditorial }) => (
                <tr key={id} className="hover:bg-[#f9faf8]">
                  <th
                    scope="row"
                    className="p-4 font-semibold text-[#173b32] sm:px-5"
                  >
                    <Link
                      href={`/superadmin/destinos/${encodeURIComponent(slug)}`}
                      className="underline underline-offset-4 hover:text-[#174238]"
                    >
                      {nombre}
                    </Link>
                  </th>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coloresEstado[estadoEditorial]}`}
                    >
                      {estadosFicha[estadoEditorial]}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/superadmin/destinos/${encodeURIComponent(slug)}`}
                      className="rounded-lg bg-[#edf4ed] px-3 py-1.5 text-xs font-semibold text-[#174238] hover:bg-[#174238] hover:text-white"
                    >
                      {estadoEditorial === "en_revision" ? "Revisar" : "Ver ficha"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#dce3da] px-5 py-3">
            <p className="text-xs text-[#4d665b]">
              {filas.length} {filas.length === 1 ? "atractivo" : "atractivos"}{" "}
              {estadoActual ? `con estado "${estadosFicha[estadoActual as EstadoFicha]}"` : "en total"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#dce3da] bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4ed] text-[#174238]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[#173b32]">Sin resultados</p>
            <p className="mt-1 text-sm text-[#4d665b]">
              {buscar
                ? `No encontramos atractivos que coincidan con "${buscar}".`
                : "No hay atractivos en este estado."}
            </p>
          </div>
          {(buscar || estadoActual) && (
            <Link
              href="/superadmin/destinos"
              className="rounded-lg border border-[#bdcfc2] px-3 py-2 text-sm font-semibold hover:bg-[#edf4ed]"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function PaginaRevisionDestinos(
  props: PageProps<"/superadmin/destinos">,
) {
  return (
    <main className="max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl tracking-tight text-[#173b32] sm:text-4xl">
          Revisión de destinos
        </h1>
        <p className="text-sm text-[#4d665b]">
          Gestiona el estado editorial de los atractivos turísticos de la plataforma.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-5">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 animate-pulse rounded-full bg-[#dce3da]"
                />
              ))}
            </div>
            <div
              role="status"
              className="h-64 animate-pulse rounded-2xl bg-[#e0e9e0]"
            >
              <span className="sr-only">Cargando destinos</span>
            </div>
          </div>
        }
      >
        <ListaDestinos searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
