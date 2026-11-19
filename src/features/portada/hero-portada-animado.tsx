"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { CreditoFoto } from "@/features/destinos/credito-foto";

export type HeroDestinoProps = {
  slug: string;
  nombre: string;
  ubicacion: string;
  imagenUrl: string;
  categoria?: string;
};

export function HeroPortadaAnimado({ destino }: { destino: HeroDestinoProps }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const tarjetaRef = useRef<HTMLAnchorElement>(null);
  const imagenRef = useRef<HTMLDivElement>(null);

  const [posicionRaton, setPosicionRaton] = useState<{ x: number; y: number } | null>(null);
  const [estaSobre, setEstaSobre] = useState(false);

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, no animamos el scroll
    const prefiereReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefiereReducido) return;

    let animacionId: number;
    let ultimoScrollY = -1;

    const actualizarScroll = () => {
      const scrollY = window.scrollY;

      // Optimización: solo calcular si cambió la posición
      if (scrollY !== ultimoScrollY) {
        ultimoScrollY = scrollY;

        // Calculamos el desplazamiento hacia abajo conforme el usuario scrollea.
        // Hacemos que la imagen baje suavemente hacia la sección inferior ("otras vistas").
        // Límite máximo de 135px en pantallas grandes para que conecte de forma armoniosa.
        const factor = window.innerWidth >= 768 ? 0.28 : 0.16;
        const maxDesplazamiento = window.innerWidth >= 768 ? 135 : 65;
        const desplazamientoY = Math.min(maxDesplazamiento, Math.max(0, scrollY * factor));

        if (tarjetaRef.current) {
          tarjetaRef.current.style.transform = `translate3d(0, ${desplazamientoY.toFixed(2)}px, 0)`;
        }

        // Parallax sutil en sentido contrario para la imagen interior (sensación de profundidad de ventana)
        if (imagenRef.current) {
          const contraParallax = -desplazamientoY * 0.22;
          imagenRef.current.style.transform = `scale(1.08) translate3d(0, ${contraParallax.toFixed(2)}px, 0)`;
        }
      }

      animacionId = requestAnimationFrame(actualizarScroll);
    };

    animacionId = requestAnimationFrame(actualizarScroll);

    return () => {
      cancelAnimationFrame(animacionId);
    };
  }, []);

  const manejarMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const tarjeta = tarjetaRef.current;
    if (!tarjeta) return;

    const rect = tarjeta.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosicionRaton({ x, y });

    // Inclinación 3D sutil interactiva
    const centroX = rect.width / 2;
    const centroY = rect.height / 2;
    const rotacionX = ((y - centroY) / centroY) * -5;
    const rotacionY = ((x - centroX) / centroX) * 5;

    tarjeta.style.setProperty("--rot-x", `${rotacionX.toFixed(2)}deg`);
    tarjeta.style.setProperty("--rot-y", `${rotacionY.toFixed(2)}deg`);
  };

  const manejarMouseEnter = () => {
    setEstaSobre(true);
  };

  const manejarMouseLeave = () => {
    setEstaSobre(false);
    setPosicionRaton(null);
    if (tarjetaRef.current) {
      tarjetaRef.current.style.removeProperty("--rot-x");
      tarjetaRef.current.style.removeProperty("--rot-y");
    }
  };

  return (
    <figure ref={contenedorRef} className="relative min-w-0 space-y-2 py-2">
      <Link
        ref={tarjetaRef}
        href={enlaceFicha(destino.slug)}
        onMouseMove={manejarMouseMove}
        onMouseEnter={manejarMouseEnter}
        onMouseLeave={manejarMouseLeave}
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
        }}
        className="group relative block aspect-[5/4] overflow-hidden rounded-t-[2.75rem] rounded-b-2xl bg-[#193b33] shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-[#174238]/30 focus-visible:outline-2 focus-visible:outline-offset-4 sm:aspect-[4/3]"
      >
        {/* Capa de imagen con contra-parallax interno */}
        <div
          ref={imagenRef}
          className="absolute inset-0 h-full w-full will-change-transform transition-transform duration-300 ease-out"
          style={{ transform: "scale(1.08) translate3d(0, 0, 0)" }}
        >
          <Image
            src={destino.imagenUrl}
            alt={destino.nombre}
            fill
            preload
            sizes="(min-width: 1280px) 590px, (min-width: 768px) 50vw, 100vw"
            unoptimized={!destino.imagenUrl.startsWith("/")}
            className="object-cover"
          />
        </div>

        {/* Reflejo / Resplandor interactivo dinámico que sigue el cursor */}
        {estaSobre && posicionRaton && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${posicionRaton.x}px ${posicionRaton.y}px, rgba(255, 255, 255, 0.16), transparent 70%)`,
            }}
          />
        )}

        {/* Insignia interactiva flotante "Destino destacado" con indicador en vivo */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-105 sm:top-5 sm:right-5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span>Destino destacado</span>
        </div>

        {/* Información superpuesta del destino */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/95 via-black/70 to-transparent px-5 pt-20 pb-5 text-white sm:px-7 sm:pb-7">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-200/90 sm:text-sm">
            <svg
              className="h-4 w-4 shrink-0 text-emerald-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{destino.ubicacion}</span>
          </div>

          <p className="mt-1.5 text-balance font-serif text-2xl leading-tight sm:text-3xl text-white drop-shadow-sm">
            {destino.nombre}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-200 underline-offset-4 group-hover:underline">
            <span>Ver detalles</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1.5"
            >
              →
            </span>
          </div>
        </div>
      </Link>

      <figcaption className="pt-1">
        <CreditoFoto imagenUrl={destino.imagenUrl} />
      </figcaption>
    </figure>
  );
}
