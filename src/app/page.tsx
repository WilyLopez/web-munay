import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { categorias, enlaceFicha, provincias } from "@/features/destinos/catalogo";
import { CreditoFoto } from "@/features/destinos/credito-foto";
import { Navbar, cargarCatalogoPublico } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { OpinionesPortada } from "@/features/portada/opiniones-portada";

const contenedor = "mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-12";
const enlaceMapa = "/destinos?vista=mapa";
const enlaceVisible =
  "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4";
const botonPrincipal =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[#174238] px-6 py-3 text-sm font-semibold text-white hover:bg-[#23574a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174238]";
const marcoHero = "relative block aspect-[5/4] overflow-hidden rounded-t-[2.75rem] rounded-b-2xl bg-[#193b33] sm:aspect-[4/3]";
const formatoNota = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

const descripciones = {
  HISTORIA: "Museos y sitios arqueológicos",
  NATURALEZA: "Bosques y áreas naturales",
  CULTURA: "Tradiciones y patrimonio local",
  PLAYAS: "Paseos en la costa",
} satisfies Record<keyof typeof categorias, string>;

async function obtenerSeleccionPortada() {
  const catalogo = await cargarCatalogoPublico();
  return (catalogo?.destinos ?? [])
    .flatMap((destino) => {
      const imagenUrl = destino.imagenUrl?.trim();
      return imagenUrl && (/^\/(?!\/)/.test(imagenUrl) || /^https?:\/\//.test(imagenUrl))
        ? [{ ...destino, imagenUrl }]
        : [];
    })
    .sort(
      (a, b) =>
        (a.ordenPortada ?? Number.MAX_SAFE_INTEGER) -
        (b.ordenPortada ?? Number.MAX_SAFE_INTEGER),
    );
}

function EsqueletoProtagonista() {
  return (
    <div className="aspect-[5/4] rounded-t-[2.75rem] rounded-b-2xl bg-[#e8dfcd] sm:aspect-[4/3]" role="status">
      <span className="sr-only">Cargando destino de portada…</span>
    </div>
  );
}

async function DestinoProtagonista() {
  const [destino] = await obtenerSeleccionPortada();
  if (!destino) return null;

  return (
    <figure className="min-w-0 space-y-2">
      <Link href={enlaceFicha(destino.slug)} className={`${marcoHero} group focus-visible:outline-2 focus-visible:outline-offset-4`}>
        <Image
          src={destino.imagenUrl}
          alt=""
          fill
          preload
          sizes="(min-width: 1280px) 590px, (min-width: 768px) 50vw, 100vw"
          unoptimized={!destino.imagenUrl.startsWith("/")}
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/65 to-transparent px-5 pt-16 pb-5 text-white sm:px-7 sm:pb-7">
          <p className="text-sm text-white/90">{destino.ubicacion}</p>
          <p className="mt-1 text-balance font-serif text-2xl leading-tight sm:text-3xl">{destino.nombre}</p>
          <span className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">Ver detalles</span>
        </div>
      </Link>
      <figcaption><CreditoFoto imagenUrl={destino.imagenUrl} /></figcaption>
    </figure>
  );
}

function ExplorarIntereses() {
  return (
    <section aria-labelledby="titulo-intereses" className="border-y border-[#dedacf] py-8 sm:py-10">
      <h2 id="titulo-intereses" className="mb-5 font-serif text-3xl tracking-tight sm:text-4xl">Explora por interés</h2>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Object.entries(descripciones).map(([clave, descripcion]) => (
          <li key={clave} className="min-w-0">
            <Link
              href={`/destinos?${new URLSearchParams({ categoria: clave })}`}
              prefetch={false}
              className="flex h-full min-h-20 items-start justify-between gap-1 rounded-xl border border-[#dedacf] bg-[#fffdf6] p-3 hover:border-[#628171] hover:bg-[#edf0e8] focus-visible:outline-2 focus-visible:outline-offset-3 sm:p-4"
            >
              <span>
                <span className="block font-semibold">{categorias[clave as keyof typeof categorias]}</span>
                <span className="mt-1 block text-sm leading-snug text-[#465a50]">{descripcion}</span>
              </span>
              <span aria-hidden="true" className="text-[#536d60]">↗</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function DestinosDestacados() {
  const destacados = (await obtenerSeleccionPortada()).slice(1, 5);
  if (!destacados.length) return null;

  return (
    <section aria-labelledby="titulo-destinos" className="py-10 md:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-destinos" className="font-serif text-3xl tracking-tight sm:text-4xl">Destinos destacados</h2>
        <Link href="/destinos" className={`${enlaceVisible} inline-flex min-h-11 items-center text-sm font-semibold`}>
          Ver todo el catálogo
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destacados.map((destino) => (
          <li key={destino.slug} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dedacf] bg-[#fffdf6]">
            <div className="relative aspect-[16/10] bg-[#dedacf]">
              <Image
                src={destino.imagenUrl}
                alt=""
                fill
                loading="lazy"
                unoptimized={!destino.imagenUrl.startsWith("/")}
                sizes="(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <p className="text-sm font-semibold text-[#8d402d]">{categorias[destino.categoria]} · {destino.ubicacion}</p>
              <h3 className="font-serif text-2xl leading-tight">{destino.nombre}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-[#465a50]">{destino.descripcion}</p>
              {destino.calificacionPromedio != null && (destino.totalResenas ?? 0) >= 2 && (
                <p className="text-sm font-semibold">
                  <span aria-hidden="true">★ </span>{formatoNota.format(destino.calificacionPromedio)} de 5 · {destino.totalResenas} reseñas
                </p>
              )}
              <Link
                href={enlaceFicha(destino.slug)}
                aria-label={`Ver detalles de ${destino.nombre}`}
                className={`${enlaceVisible} mt-auto inline-flex min-h-11 items-center self-start text-sm font-semibold`}
              >
                Ver detalles
              </Link>
              <CreditoFoto imagenUrl={destino.imagenUrl} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlaneaTuVisita() {
  return (
    <section aria-labelledby="titulo-mapa" className="my-10 rounded-2xl bg-[#193b33] px-6 py-7 text-white sm:px-8 md:my-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="titulo-mapa" className="font-serif text-3xl tracking-tight sm:text-4xl">Planea tu recorrido</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#e0eee7] sm:text-base">
            Elige una provincia y ubica sus destinos en el mapa.
          </p>
        </div>
        <Link href={enlaceMapa} prefetch={false} className="inline-flex min-h-11 items-center rounded-full bg-[#f8f4ea] px-5 py-3 text-sm font-semibold text-[#193b33] hover:bg-[#e9e6d9] focus-visible:outline-2 focus-visible:outline-offset-4">
          Abrir mapa interactivo
        </Link>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2 border-t border-white/25 pt-4">
        {Object.entries(provincias).map(([clave, nombre]) => (
          <li key={clave}>
            <Link
              href={`${enlaceMapa}&${new URLSearchParams({ provincia: clave })}`}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3"
            >
              {nombre}
            </Link>
          </li>
        ))}
      </ul>
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
          className="grid items-center gap-6 pb-9 pt-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10 md:py-14 lg:gap-16"
        >
          <div className="entrada-portada">
            <h1 id="titulo-portada" className="max-w-[12ch] text-balance font-serif text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.94] tracking-[-0.055em]">
              Explora Lambayeque
            </h1>
            <p className="mt-4 max-w-[38ch] leading-relaxed text-[#465a50] sm:text-lg">
              Encuentra museos, pirámides de adobe y bosques secos. Elige dónde ir y descubre cómo llegar.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link href="/destinos" className={botonPrincipal}>Explorar destinos</Link>
              <Link href={enlaceMapa} prefetch={false} className="inline-flex min-h-11 items-center rounded-full border border-[#81938a] px-4 py-3 text-sm font-semibold hover:bg-[#e9e6d9] focus-visible:outline-2 focus-visible:outline-offset-4">
                Ver el mapa
              </Link>
            </div>
          </div>
          <Suspense fallback={<EsqueletoProtagonista />}>
            <DestinoProtagonista />
          </Suspense>
        </section>
        <ExplorarIntereses />
        <Suspense>
          <DestinosDestacados />
        </Suspense>
        <PlaneaTuVisita />
        <Suspense>
          <OpinionesPortada />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}
