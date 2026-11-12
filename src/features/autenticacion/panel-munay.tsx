import Image from "next/image";

export function PanelMunay() {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-[#174238] p-8 text-white sm:p-12 lg:p-16 xl:p-20">
      <Image
        src="/destinos/tucume.webp"
        alt="Pirámides y paisaje de Túcume en Lambayeque"
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#0e2721] via-[#174238]/90 to-[#174238]/80" />

      <div className="relative z-10 space-y-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#e0eee7] backdrop-blur-xs">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-[#e5b382]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          LAMBAYEQUE · PERÚ
        </span>

        <div>
          <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight text-[#fffdf6] sm:text-4xl xl:text-5xl">
            Descubre el encanto y la herencia de Munay
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#d6e4dc] sm:text-base">
            En lengua quechua, <strong className="font-semibold text-white">Munay</strong> significa amar, apreciar con el alma y tener la voluntad de cuidar. Esta plataforma conecta a los viajeros con la historia viva de nuestra costa norte.
          </p>
        </div>

        <div className="space-y-5 pt-2">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#e5b382]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4 22h16" />
                <path d="M2 18h20" />
                <path d="M4 18v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7" />
                <path d="M12 2l8 8H4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">
                Patrimonio milenario
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#c1d7cc] sm:text-sm">
                Explora museos reales, complejos de adobe y bosques secos de las culturas Moche y Sicán.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#e5b382]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">
                Rutas y mapa interactivo
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#c1d7cc] sm:text-sm">
                Planifica tu recorrido por provincias, consulta distancias y encuentra cómo llegar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#e5b382]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01" />
                <path d="M17 7h.01" />
                <path d="M7 17h.01" />
                <path d="M17 17h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">
                Pasaporte y visitas
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#c1d7cc] sm:text-sm">
                Guarda tus atractivos favoritos y valida tus visitas en cada destino con código QR.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/15 pt-6">
        <p className="text-xs italic leading-relaxed text-[#c1d7cc] sm:text-sm">
          “El aprecio por nuestra historia comienza cuando aprendemos a caminar por ella con respeto y admiración.”
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Guía cultural de Lambayeque
        </p>
      </div>
    </div>
  );
}
