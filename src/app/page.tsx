import { PiePagina } from "@/features/navegacion/pie-pagina";
import Image from "next/image";
import Link from "next/link";
import { CreditoFoto } from "@/features/destinos/credito-foto";
import { Suspense } from "react";
import { categorias, enlaceFicha } from "@/features/destinos/catalogo";
import { CarruselDestinos } from "@/features/portada/carrusel-destinos";
import { Navbar, cargarCatalogo } from "@/features/navegacion/navbar";

const contenedor = "mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-12";
const botonPrincipal =
  "inline-flex items-center justify-center gap-3 rounded-full bg-[#174238] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#23574a]";
const enlaceMapa = "/destinos?vista=mapa";

async function obtenerDestacados() {
  const catalogo = await cargarCatalogo();
  const fotografiados = (catalogo?.destinos ?? []).flatMap((destino) => {
    const imagenUrl = destino.imagenUrl?.trim();
    return imagenUrl &&
      (/^\/(?!\/)/.test(imagenUrl) || /^https?:\/\//.test(imagenUrl))
      ? [{ ...destino, imagenUrl }]
      : [];
  });
  const seleccionados = fotografiados.filter(
    ({ ordenPortada }) => ordenPortada != null,
  );
  return (
    seleccionados.length
      ? seleccionados.sort(
          (a, b) => (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0),
        )
      : fotografiados
  ).slice(0, 4);
}

async function HeroDestinos() {
  const destinos = await obtenerDestacados();
  return destinos.length ? <CarruselDestinos destinos={destinos} /> : null;
}

async function DestinosDestacados() {
  const destacados = await obtenerDestacados();
  if (!destacados.length) return null;
  return (
    <section
      aria-labelledby="titulo-destinos"
      className="border-t border-[#dedacf] py-10 md:py-14"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h2
          id="titulo-destinos"
          className="font-serif text-4xl tracking-tight sm:text-5xl"
        >
          Destinos destacados
        </h2>
        <Link
          href="/destinos"
          className="text-sm font-semibold underline underline-offset-4"
        >
          Ver todo el catálogo <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destacados.map((destino) => (
          <article
            key={destino.slug}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#dedacf] bg-[#fffdf6]"
          >
            <Link
              href={enlaceFicha(destino.slug)}
              aria-label={`Ver ${destino.nombre}`}
              className="group relative block aspect-[16/10] overflow-hidden bg-[#dedacf]"
            >
              <Image
                src={destino.imagenUrl}
                alt={destino.nombre}
                fill
                unoptimized={!destino.imagenUrl.startsWith("/")}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8d402d]">
                {categorias[destino.categoria]} · {destino.ubicacion}
              </p>
              <h3 className="font-serif text-2xl leading-tight">
                <Link
                  href={enlaceFicha(destino.slug)}
                  className="underline-offset-4 hover:underline"
                >
                  {destino.nombre}
                </Link>
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-[#465a50]">
                {destino.descripcion}
              </p>
              <CreditoFoto imagenUrl={destino.imagenUrl} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Portada() {
  return (
    <div className="-m-8 min-h-screen bg-[#f8f4ea] text-[#193b33]">
      <Navbar />
      <main className={contenedor}>
        <section
          aria-labelledby="titulo-portada"
          className="grid items-center gap-7 pb-12 pt-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10 md:pb-16 md:pt-14 lg:gap-16"
        >
          <div className="entrada-portada">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#8d402d]">
              Costa norte del Perú
            </p>
            <h1
              id="titulo-portada"
              className="max-w-[12ch] font-serif text-[clamp(3.1rem,7.2vw,6.5rem)] leading-[0.93] tracking-[-0.06em]"
            >
              Explora <span className="text-[#98452f]">Lambayeque</span>
            </h1>
            <p className="mt-6 max-w-[35ch] text-base leading-relaxed text-[#465a50] sm:text-lg">
              Encuentra museos, pirámides de adobe y bosques secos. Elige tu
              próxima visita y ubícala en el mapa.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/destinos" className={botonPrincipal}>
                Explorar destinos <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href={enlaceMapa}
                className="rounded-full border border-[#81938a] px-5 py-3 text-sm font-semibold hover:bg-[#e9e6d9]"
              >
                Ver el mapa
              </Link>
            </div>
          </div>

          <Suspense
            fallback={
              <div
                className="aspect-[4/3] rounded-3xl bg-[#e8dfcd] motion-safe:animate-pulse"
                role="status"
              >
                <span className="sr-only">Cargando destinos destacados</span>
              </div>
            }
          >
            <HeroDestinos />
          </Suspense>
        </section>

        <Suspense>
          <DestinosDestacados />
        </Suspense>

        <section
          aria-labelledby="titulo-mapa"
          className="mb-12 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#193b33] px-6 py-8 text-white sm:px-9 md:mb-16"
        >
          <div>
            <h2
              id="titulo-mapa"
              className="font-serif text-3xl tracking-tight sm:text-4xl"
            >
              Planea tu recorrido
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#e0eee7] sm:text-base">
              Ubica los atractivos de Lambayeque, filtra por provincia y abre
              las indicaciones para llegar.
            </p>
          </div>
          <Link
            href={enlaceMapa}
            className="inline-flex items-center gap-3 rounded-full bg-[#f8f4ea] px-5 py-3 text-sm font-semibold text-[#193b33] hover:bg-[#e9e6d9]"
          >
            Abrir mapa interactivo <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <PiePagina />
    </div>
  );
}
