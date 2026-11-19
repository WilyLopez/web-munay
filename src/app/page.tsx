import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { categorias, enlaceFicha, provincias } from "@/features/destinos/catalogo";
import { CreditoFoto } from "@/features/destinos/credito-foto";
import { Navbar, cargarCatalogoPublico } from "@/features/navegacion/navbar";
import { PiePagina } from "@/features/navegacion/pie-pagina";
import { HeroPortadaAnimado } from "@/features/portada/hero-portada-animado";
import { OpinionesPortada } from "@/features/portada/opiniones-portada";

const contenedor = "mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-12";
const enlaceMapa = "/destinos?vista=mapa";
const enlaceVisible =
  "inline-flex min-h-12 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4";
const botonPrincipal =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#174238] px-6 py-3 text-base sm:text-sm font-semibold text-white hover:bg-[#23574a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#174238] shadow-sm active:scale-95 transition-transform";
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

  return <HeroPortadaAnimado destino={destino} />;
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
  const todos = await obtenerSeleccionPortada();
  if (!todos.length) return null;

  const protagonista = todos[0];
  const otros = todos.slice(1, 4);
  // Colocamos los otros tres primero y al protagonista como 4to (columna derecha donde aterriza al scrollear)
  const destacados = otros.length > 0 ? [...otros, protagonista] : todos;

  return (
    <section aria-labelledby="titulo-destinos" className="py-10 md:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-destinos" className="font-serif text-3xl tracking-tight sm:text-4xl">Destinos destacados</h2>
        <Link href="/destinos" className={`${enlaceVisible} text-sm font-semibold`}>
          Ver todo el catálogo
        </Link>
      </div>
      <ul className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {destacados.map((destino, index) => {
          const esProtagonista = destino.slug === protagonista.slug && index === destacados.length - 1;

          return (
            <li
              key={`${destino.slug}-${index}`}
              id={esProtagonista ? "slot-destino-protagonista" : undefined}
              className="flex w-[82vw] max-w-[20rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#dedacf] bg-[#fffdf6] shadow-sm sm:w-auto sm:max-w-none lg:transition-transform lg:duration-200 lg:hover:-translate-y-1 lg:hover:shadow-md"
            >
              <div
                id={esProtagonista ? "slot-imagen-protagonista" : undefined}
                className="relative aspect-[16/10] bg-[#dedacf] overflow-hidden"
              >
                <Image
                  id={esProtagonista ? "imagen-docked-protagonista" : undefined}
                  src={destino.imagenUrl}
                  alt=""
                  fill
                  loading="lazy"
                  unoptimized={!destino.imagenUrl.startsWith("/")}
                  sizes="(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className={`object-cover transition-opacity duration-300 ${esProtagonista ? "opacity-0" : ""}`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="text-sm font-semibold text-[#8d402d]">
                  {categorias[destino.categoria]} · {destino.ubicacion}
                </p>
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
                  className={`${enlaceVisible} mt-auto self-start text-sm font-semibold`}
                >
                  Ver detalles
                </Link>
                <CreditoFoto imagenUrl={destino.imagenUrl} />
              </div>
            </li>
          );
        })}
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
        <Link href={enlaceMapa} className="inline-flex min-h-12 items-center rounded-full bg-[#f8f4ea] px-5 py-3 text-base sm:text-sm font-semibold text-[#193b33] hover:bg-[#e9e6d9] focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-95 transition-transform">
          Abrir mapa interactivo
        </Link>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2 border-t border-white/25 pt-4">
        {Object.entries(provincias).map(([clave, nombre]) => (
          <li key={clave}>
            <Link
              href={`${enlaceMapa}&${new URLSearchParams({ provincia: clave })}`}
              className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 active:scale-95 transition-transform"
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
    <div className="min-h-dvh bg-[#f8f4ea] text-[#193b33] overflow-x-clip">
      <Navbar />
      <main className={contenedor}>
        <section
          aria-labelledby="titulo-portada"
          className="grid items-center gap-6 pb-9 pt-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10 md:py-14 lg:gap-16"
        >
          <div className="entrada-portada">
            <h1 id="titulo-portada" className="max-w-[12ch] text-balance font-serif text-[clamp(2.35rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.04em]">
              Explora Lambayeque
            </h1>
            <p className="mt-4 max-w-[38ch] leading-relaxed text-[#465a50] sm:text-lg">
              Encuentra museos, pirámides de adobe y bosques secos. Elige dónde ir y descubre cómo llegar.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link href="/destinos" className={botonPrincipal}>Explorar destinos</Link>
              <Link href={enlaceMapa} className="inline-flex min-h-12 items-center rounded-full border border-[#81938a] px-5 py-3 text-base sm:text-sm font-semibold hover:bg-[#e9e6d9] focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-95 transition-transform">
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
