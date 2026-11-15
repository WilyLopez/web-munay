import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { solicitarVisitas } from "@/features/visitas/api";
import type { DestinoVisita } from "@/features/visitas/tipos";

async function Atractivos() {
  const perfil = await accesoPanel();
  if (!perfil) return null;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin");
  const respuesta = await solicitarVisitas<DestinoVisita[]>(
    "/visitas/administracion",
  );
  if (!respuesta.ok) return <p role="alert">{respuesta.mensaje}</p>;
  if (!respuesta.datos.length)
    return (
      <p className="rounded-xl border border-[#dce3da] bg-white p-6">
        Tu cuenta todavía no tiene destinos asignados.
      </p>
    );

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {respuesta.datos.map(({ id, nombre, slug }) => {
        const consulta = new URLSearchParams({ destino: slug });
        return (
          <li
            key={id}
            className="flex flex-col justify-between gap-6 rounded-2xl border border-[#dce3da] bg-white p-5"
          >
            <h2 className="font-serif text-2xl">{nombre}</h2>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href={`/administracion/atractivos/${encodeURIComponent(slug)}`}
                className="rounded-lg border border-[#ccd9cf] px-3 py-2 hover:bg-[#e6eee6]"
              >
                Editar ficha
              </Link>
              <Link
                href={`/administracion/estadisticas?${consulta}`}
                className="rounded-lg bg-[#174238] px-3 py-2 text-white hover:bg-[#23574a]"
              >
                Ver estadísticas
              </Link>
              <Link
                href={`/administracion/visitas?${consulta}`}
                className="rounded-lg border border-[#ccd9cf] px-3 py-2 hover:bg-[#e6eee6]"
              >
                Gestionar QR
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function PaginaAdministracion() {
  return (
    <main className="space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Mis atractivos</h1>
      <p className="text-sm text-[#4d665b]">
        Actualiza la ficha pública y gestiona las visitas de tus atractivos
        asignados.
      </p>
      <Suspense
        fallback={
          <div
            role="status"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Cargando atractivos asignados</span>
            {[1, 2, 3].map((fila) => (
              <div
                key={fila}
                aria-hidden="true"
                className="h-36 rounded-2xl border border-[#dce3da] bg-[#e0e9e0] motion-safe:animate-pulse"
              />
            ))}
          </div>
        }
      >
        <Atractivos />
      </Suspense>
    </main>
  );
}
