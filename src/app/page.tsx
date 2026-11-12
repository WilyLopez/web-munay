import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CreditoFoto } from "@/features/destinos/credito-foto";
import {
  AccesoPortada,
  AccesoVisitante,
} from "@/features/portada/acceso-portada";

const destacados = [
  {
    nombre: "Museo Tumbas Reales de Sipán",
    categoria: "Cultura",
    lugar: "Lambayeque",
    descripcion:
      "Conoce los hallazgos de la tumba del Señor de Sipán y la historia de la cultura moche.",
    foto: "/destinos/tumbas-reales.webp",
    enlace: "/destinos/museo-tumbas-reales-de-sipan",
  },
  {
    nombre: "Complejo Arqueológico de Túcume",
    categoria: "Historia",
    lugar: "Túcume",
    descripcion:
      "Explora las pirámides de adobe y el museo de sitio del valle de Lambayeque.",
    foto: "/destinos/tucume.webp",
    enlace: "/destinos/complejo-arqueologico-de-tucume",
  },
  {
    nombre: "Santuario Histórico Bosque de Pómac",
    categoria: "Naturaleza",
    lugar: "Pítipo, Ferreñafe",
    descripcion:
      "Descubre un bosque seco de algarrobos junto a los vestigios de la cultura Sicán.",
    foto: "/destinos/bosque-de-pomac.webp",
    enlace: "/destinos/santuario-historico-bosque-de-pomac",
  },
];

const contenedor = "mx-auto w-full max-w-[82rem] px-5 sm:px-8 lg:px-12";
const botonPrincipal =
  "inline-flex items-center justify-center gap-3 rounded-full bg-[#174238] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#23574a]";
const enlaceMapa = "/destinos?vista=mapa";

export default function Portada() {
  return (
    <div className="-m-8 min-h-screen bg-[#f8f4ea] text-[#193b33]">
      <header className="border-b border-[#dedacf]">
        <div
          className={`${contenedor} grid min-h-20 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 py-3 md:grid-cols-[1fr_auto_1fr]`}
        >
          <Link
            href="/"
            aria-label="Munay, inicio"
            className="w-fit text-[1.65rem] font-black tracking-tight"
          >
            munay
            <span aria-hidden="true" className="text-[#a54b36]">
              .
            </span>
          </Link>
          <nav
            aria-label="Navegación principal"
            className="order-last col-span-2 flex flex-wrap items-center gap-6 border-t border-[#dedacf] pt-3 text-sm font-semibold md:order-none md:col-span-1 md:border-0 md:pt-0"
          >
            <Link
              href="/destinos"
              className="underline-offset-4 hover:underline"
            >
              Destinos
            </Link>
            <Link
              href={enlaceMapa}
              className="underline-offset-4 hover:underline"
            >
              Mapa
            </Link>
          </nav>
          <Suspense fallback={<AccesoVisitante />}>
            <AccesoPortada />
          </Suspense>
        </div>
      </header>

      <main className={contenedor}>
        <section
          aria-labelledby="titulo-portada"
          className="grid items-center gap-7 pb-12 pt-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10 md:pb-16 md:pt-14 lg:gap-16"
        >
          <div>
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

          <figure className="min-w-0">
            <div className="relative aspect-[5/4] overflow-hidden rounded-t-[3.5rem] rounded-b-2xl bg-[#d8c7aa] sm:aspect-[4/3]">
              <Image
                src="/destinos/tumbas-reales.webp"
                alt="Fachada roja del Museo Tumbas Reales de Sipán"
                fill
                preload
                sizes="(min-width: 768px) 52vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-5 pb-5 pt-16 text-white sm:px-7">
                <p className="text-sm font-semibold">
                  Museo Tumbas Reales de Sipán
                </p>
                <p className="mt-0.5 text-xs text-white/90">Lambayeque</p>
              </div>
            </div>
            <figcaption className="mt-2">
              <CreditoFoto imagenUrl="/destinos/tumbas-reales.webp" />
            </figcaption>
          </figure>
        </section>

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
          <div className="grid gap-5 md:grid-cols-3">
            {destacados.map((destino) => (
              <article
                key={destino.nombre}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#dedacf] bg-[#fffdf6]"
              >
                <Link
                  href={destino.enlace}
                  aria-label={`Ver ${destino.nombre} en el catálogo`}
                  className="group relative block aspect-[16/10] overflow-hidden bg-[#dedacf]"
                >
                  <Image
                    src={destino.foto}
                    alt={destino.nombre}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8d402d]">
                    {destino.categoria} · {destino.lugar}
                  </p>
                  <h3 className="font-serif text-2xl leading-tight">
                    <Link
                      href={destino.enlace}
                      className="underline-offset-4 hover:underline"
                    >
                      {destino.nombre}
                    </Link>
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-[#465a50]">
                    {destino.descripcion}
                  </p>
                  <CreditoFoto imagenUrl={destino.foto} />
                </div>
              </article>
            ))}
          </div>
        </section>

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

      <footer className="border-t border-[#dedacf] bg-[#eee9dc]">
        <div
          className={`${contenedor} flex flex-wrap items-start justify-between gap-7 py-9`}
        >
          <div>
            <Link href="/" className="text-2xl font-black tracking-tight">
              munay
              <span aria-hidden="true" className="text-[#a54b36]">
                .
              </span>
            </Link>
            <p className="mt-1 text-sm text-[#465a50]">
              Guía de destinos de Lambayeque.
            </p>
          </div>
          <nav
            aria-label="Enlaces del pie de página"
            className="flex max-w-full flex-wrap gap-x-5 gap-y-3 pt-1 text-sm font-semibold"
          >
            <Link href="/destinos" className="hover:underline">
              Destinos
            </Link>
            <Link href={enlaceMapa} className="hover:underline">
              Mapa
            </Link>
            <Link href="/terminos-de-uso" className="hover:underline">
              Términos de uso
            </Link>
            <Link href="/politica-de-privacidad" className="hover:underline">
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
