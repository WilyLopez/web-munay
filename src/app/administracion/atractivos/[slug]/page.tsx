import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import type { FichaOperativa } from "@/features/administracion/formulario-ficha";
import { PanelFichaAtractivo } from "@/features/administracion/panel-ficha-atractivo";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";

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
  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/ingresar?aviso=sesion");
    return (
      <section className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p role="alert">{respuesta.mensaje}</p>
        {![403, 404].includes(respuesta.estado) && (
          <BotonActualizarPanel reintentar />
        )}
      </section>
    );
  }

  return (
    <PanelFichaAtractivo
      key={slug}
      ficha={respuesta.datos}
      slug={slug}
      editorId={perfil.id}
    />
  );
}

export default function PaginaEditarFicha({
  params,
}: PageProps<"/administracion/atractivos/[slug]">) {
  return (
    <main className="w-full min-w-0 space-y-4">
      <Link
        href="/administracion"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Volver al Dashboard
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
