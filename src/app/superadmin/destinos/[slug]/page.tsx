import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  FormularioFicha,
  type FichaOperativa,
} from "@/features/administracion/formulario-ficha";
import { RevisionFicha } from "@/features/administracion/revision-ficha";
import { solicitarVisitas } from "@/features/visitas/api";

type Props = { params: Promise<{ slug: string }> };

async function Detalle({ params }: Props) {
  await connection();
  const { slug } = await params;
  const respuesta = await solicitarVisitas<FichaOperativa>(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
  );
  if (!respuesta.ok) return <p role="alert">{respuesta.mensaje}</p>;
  const ficha = respuesta.datos;
  return (
    <>
      <h1 className="font-serif text-4xl">{ficha.nombre}</h1>
      <RevisionFicha slug={slug} estado={ficha.estadoEditorial} verificado={ficha.verificado} />
      <FormularioFicha ficha={ficha} slug={slug} soloLectura />
    </>
  );
}

export default function PaginaRevisionFicha(props: Props) {
  return (
    <main className="max-w-4xl space-y-5">
      <Link href="/superadmin/destinos" className="font-semibold underline">
        Volver a revisión de destinos
      </Link>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-48 rounded-2xl bg-teal-100 motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando ficha</span>
          </div>
        }
      >
        <Detalle {...props} />
      </Suspense>
    </main>
  );
}
