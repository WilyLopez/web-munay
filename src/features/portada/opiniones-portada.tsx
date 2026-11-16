import Link from "next/link";
import { enlaceFicha } from "@/features/destinos/catalogo";
import type { ListadoResenas } from "@/features/resenas/tipos";

async function obtenerOpiniones() {
  try {
    const respuesta = await fetch(
      new URL("/resenas?orden=fecha&pagina=1", process.env.NEXT_PUBLIC_API_URL),
      { next: { revalidate: 120 }, signal: AbortSignal.timeout(3500) },
    );
    if (!respuesta.ok) return [];
    const { resenas } = (await respuesta.json()) as ListadoResenas;
    return resenas
      .filter(({ comentario }) => comentario.trim())
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function OpinionesPortada() {
  const opiniones = await obtenerOpiniones();
  if (opiniones.length < 2) return null;

  return (
    <section aria-labelledby="titulo-opiniones-portada" className="border-t border-[#dedacf] py-10 md:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-opiniones-portada" className="font-serif text-3xl tracking-tight sm:text-4xl">
          Opiniones de visitantes
        </h2>
        <Link href="/resenas" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Ver todas las reseñas
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opiniones.map(({ id, comentario, calificacion, destino, verificada }) => (
          <li key={id} className="min-w-0 space-y-3 rounded-xl border border-[#dedacf] bg-[#fffdf6] p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-[#8d402d]">
                <span aria-hidden="true">★ </span>{calificacion} de 5
              </span>
              {verificada && <span className="rounded-full bg-[#e8eee6] px-2.5 py-1 text-xs font-semibold">Visita verificada</span>}
            </div>
            <blockquote className="wrap-anywhere text-sm leading-relaxed text-[#465a50]">
              {comentario.length > 170 ? `${comentario.slice(0, 169).trimEnd()}…` : comentario}
            </blockquote>
            <Link href={`${enlaceFicha(destino.slug)}#opiniones`} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
              {destino.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}