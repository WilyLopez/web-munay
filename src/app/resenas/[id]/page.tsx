import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Navbar } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { ReintentarOpiniones } from "@/features/resenas/reintentar-opiniones";
import { TarjetaResena } from "@/features/resenas/tarjeta-resena";
import type { Resena } from "@/features/resenas/tipos";
import { solicitarVisitas } from "@/features/visitas/api";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Reseña de visitante · Munay" };

async function ContenidoResena({ params }: Props) {
  await connection();
  const { id } = await params;
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) notFound();
  const resultado = await solicitarVisitas<Resena>(
    `/resenas/${encodeURIComponent(id)}`,
    undefined,
    { publica: true },
  );
  if (!resultado.ok && (resultado.estado === 404 || resultado.estado === 400))
    notFound();
  return resultado.ok ? (
    <TarjetaResena resena={resultado.datos} mostrarDestino />
  ) : (
    <div className="space-y-3">
      <p role="alert">No pudimos cargar esta reseña.</p>
      <ReintentarOpiniones />
    </div>
  );
}

export default function PaginaResena(props: Props) {
  return (
    <>
      <div className="sticky top-0 z-40 -mx-8 -mt-8">
        <Navbar />
      </div>
      <main className="mx-auto max-w-3xl space-y-5 py-8">
        <Link
          href="/resenas"
          className="font-semibold underline underline-offset-4"
        >
          Volver a las reseñas
        </Link>
        <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8">
          <h1 className="font-serif text-3xl font-semibold text-teal-950">
            Reseña de visitante
          </h1>
          <Suspense fallback={<p role="status">Cargando reseña…</p>}>
            <ContenidoResena {...props} />
          </Suspense>
        </section>
      </main>
      <PiePagina className="-mx-8 -mb-8" />
    </>
  );
}
