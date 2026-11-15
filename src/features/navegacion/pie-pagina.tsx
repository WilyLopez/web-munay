import Image from "next/image";
import Link from "next/link";

const enlaces = [
  ["/destinos", "Destinos"],
  ["/destinos?vista=mapa", "Mapa interactivo"],
  ["/resenas", "Reseñas de visitantes"],
  ["/solicitar-acceso", "Gestionar un atractivo"],
] as const;

const redes = [
  [
    "Instagram",
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z",
  ],
  [
    "Facebook",
    "M14 22v-9h3l.5-3H14V8c0-.9.3-1.5 1.6-1.5h2V3.8c-.4-.1-1.4-.3-2.6-.3-2.7 0-4.5 1.6-4.5 4.6V10H8v3h2.5v9H14Z",
  ],
  [
    "TikTok",
    "M16 2c.3 2.8 1.8 4.5 4.5 4.7V10a8 8 0 0 1-4.5-1.4v6.9a6.5 6.5 0 1 1-7.5-6.4v3.4a3.2 3.2 0 1 0 4.2 3V2H16Z",
  ],
] as const;

const estiloEnlace =
  "inline-flex min-h-11 items-center rounded-sm text-[#e5eee7] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8f4ea] motion-reduce:transition-none";

export function PiePagina({ className = "" }: { className?: string }) {
  return (
    <footer className={`bg-[#12362e] text-[#f8f4ea] ${className}`}>
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.2fr_auto] lg:gap-10 lg:py-14">
          <div>
            <Link
              href="/"
              aria-label="Munay, inicio"
              className="inline-block rounded-lg bg-[#f8f4ea] px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Image
                src="/marca/logo-navbar.webp"
                alt=""
                width={360}
                height={80}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#c9dbd1]">
              Explora los destinos de Lambayeque y descubre qué cuentan quienes
              ya los visitaron.
            </p>
          </div>
          <nav aria-label="Explora Munay">
            <h2 className="mb-1 font-semibold">Explora</h2>
            <ul className="text-sm">
              {enlaces.map(([href, nombre]) => (
                <li key={href}>
                  <Link href={href} className={estiloEnlace}>
                    {nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section>
            <h2 className="font-semibold">Sobre Munay</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#c9dbd1]">
              Verifica tu visita con el QR del destino antes de publicar una
              reseña.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Síguenos</h2>
            <ul className="mt-3 flex gap-2">
              {redes.map(([nombre, forma]) => (
                <li
                  key={nombre}
                  className="grid size-11 place-items-center rounded-full border border-[#638379] text-[#e5eee7]"
                >
                  <span className="sr-only">{nombre}</span>
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={forma} />
                  </svg>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 border-t border-[#527268] py-3 text-sm">
          <p className="py-2 text-[#c9dbd1]">© 2026 Munay</p>
          <nav
            aria-label="Información legal"
            className="flex flex-wrap gap-x-5"
          >
            <Link href="/terminos-de-uso" className={estiloEnlace}>
              Términos de uso
            </Link>
            <Link href="/politica-de-privacidad" className={estiloEnlace}>
              Política de privacidad
            </Link>
            <Link href="/politica-de-cookies" className={estiloEnlace}>
              Política de cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
