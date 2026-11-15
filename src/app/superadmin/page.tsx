import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { FormularioOrden } from "@/features/administracion/formulario-orden";
import { enlaceFicha, type Catalogo } from "@/features/destinos/catalogo";
import { solicitarVisitas } from "@/features/visitas/api";

async function PortadaEditorial() {
  if (!(await accesoPanel(true))) return null;
  const respuesta = await solicitarVisitas<Catalogo>("/destinos");
  if (!respuesta.ok) return <p role="alert">{respuesta.mensaje}</p>;
  if (!respuesta.datos.destinos.length)
    return <p>El catálogo todavía está vacío.</p>;

  return (
    <ul className="divide-y divide-[#dce3da] overflow-hidden rounded-2xl border border-[#dce3da] bg-white">
      {respuesta.datos.destinos.map(
        ({ id, nombre, slug, ubicacion, imagenUrl, ordenPortada }) => (
          <li
            key={id}
            className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 px-5 py-4"
          >
            <div className="space-y-1">
              <Link
                href={enlaceFicha(slug)}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {nombre}
              </Link>
              <p className="text-sm text-[#4d665b]">
                {ubicacion}
                {!imagenUrl && " · Sin foto"}
              </p>
            </div>
            <FormularioOrden id={id} nombre={nombre} orden={ordenPortada} />
          </li>
        ),
      )}
    </ul>
  );
}

export default function PaginaSuperAdmin() {
  return (
    <main className="space-y-5">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl tracking-tight">
          Gestión de portada
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#4d665b]">
          El orden 1 aparece primero. La portada muestra hasta cuatro destinos
          con foto. Deja el campo vacío para usar la selección automática de ese
          destino cuando no haya prioridades asignadas.
        </p>
      </div>
      <Suspense fallback={<p role="status">Cargando destinos…</p>}>
        <PortadaEditorial />
      </Suspense>
    </main>
  );
}
