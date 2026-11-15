import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import {
  FormularioFicha,
  type FichaOperativa,
} from "@/features/administracion/formulario-ficha";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { solicitarVisitas } from "@/features/visitas/api";

async function Editar({
  params,
}: Pick<PageProps<"/administracion/atractivos/[slug]">, "params">) {
  const perfil = await accesoPanel();
  if (!perfil) return null;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin");
  const { slug } = await params;
  const respuesta = await solicitarVisitas<FichaOperativa>(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
  );
  if (!respuesta.ok) return <p role="alert">{respuesta.mensaje}</p>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl tracking-tight">
          {respuesta.datos.nombre}
        </h1>
        {respuesta.datos.estadoEditorial === "publicada" && (
          <Link
            href={enlaceFicha(slug)}
            className="text-sm font-semibold underline underline-offset-4"
          >
            Ver detalles públicos
          </Link>
        )}
      </div>
      <FormularioFicha key={slug} ficha={respuesta.datos} slug={slug} />
    </>
  );
}

export default function PaginaEditarFicha({
  params,
}: PageProps<"/administracion/atractivos/[slug]">) {
  return (
    <main className="max-w-3xl space-y-5">
      <Link
        href="/administracion"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Volver a Mis atractivos
      </Link>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-64 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando ficha</span>
          </div>
        }
      >
        <Editar params={params} />
      </Suspense>
    </main>
  );
}
