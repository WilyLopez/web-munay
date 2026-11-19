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
  const infoRef = useRef<HTMLDivElement>(null);
  const insigniaRef = useRef<HTMLDivElement>(null);

  const [posicionRaton, setPosicionRaton] = useState<{ x: number; y: number } | null>(null);
  const [estaSobre, setEstaSobre] = useState(false);

  useEffect(() => {
    const prefiereReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefiereReducido) return;

    let animacionId: number;
    let observer: ResizeObserver | null = null;

    let deltaY = 0;
    let deltaX = 0;
    let targetScale = 0.5;
    let scrollStart = 0;
    let scrollEnd = 600;
    let medicionLista = false;

    const medir = () => {
      const tarjeta = tarjetaRef.current;
      const slot = document.getElementById("slot-imagen-protagonista");
      if (!tarjeta || !slot) return;

      const scrollY = window.scrollY;
      const tarjetaRect = tarjeta.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();

      const tarjetaAbsTop = tarjetaRect.top + scrollY;
      const tarjetaAbsRight = tarjetaRect.right;
      const slotAbsTop = slotRect.top + scrollY;
      const slotAbsRight = slotRect.right;

      deltaY = slotAbsTop - tarjetaAbsTop;
      deltaX = slotAbsRight - tarjetaAbsRight;
      targetScale = slotRect.width > 0 && tarjetaRect.width > 0 ? slotRect.width / tarjetaRect.width : 0.52;

      scrollStart = Math.max(0, tarjetaAbsTop - 40);
      scrollEnd = Math.max(scrollStart + 120, slotAbsTop - window.innerHeight * 0.45);
      medicionLista = true;
    };

    medir();

    // Intentar medir si el slot tardó en renderizarse
    const timer = setTimeout(medir, 300);

    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        medir();
      });
      if (contenedorRef.current) observer.observe(contenedorRef.current);
      const slot = document.getElementById("slot-imagen-protagonista");
      if (slot) observer.observe(slot);
    }

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let ultimoProgreso = -1;

    const actualizar = () => {
      if (!medicionLista) {
        medir();
      }

      const scrollY = window.scrollY;
      const rango = Math.max(1, scrollEnd - scrollStart);
      const progresoCrudo = Math.min(1, Math.max(0, (scrollY - scrollStart) / rango));
      const progreso = easeInOutCubic(progresoCrudo);

      const imagenDocked = document.getElementById("imagen-docked-protagonista");
      const tarjeta = tarjetaRef.current;
      const info = infoRef.current;
      const insignia = insigniaRef.current;

      if (Math.abs(progreso - ultimoProgreso) > 0.0005) {
        ultimoProgreso = progreso;

        if (tarjeta) {
          if (progreso >= 0.96) {
            // Llegó al destino: mostramos la imagen fija de la grilla y ocultamos la flotante
            tarjeta.style.opacity = "0";
            tarjeta.style.pointerEvents = "none";
            if (imagenDocked) imagenDocked.style.opacity = "1";
          } else {
            // En transición o arriba: mostramos la flotante y ocultamos la fija
            tarjeta.style.opacity = "1";
            tarjeta.style.pointerEvents = "auto";
            if (imagenDocked) imagenDocked.style.opacity = "0";

            const currY = progreso * deltaY;
            const currX = progreso * deltaX;
            const currScale = 1 - progreso * (1 - targetScale);

            tarjeta.style.transformOrigin = "top right";
            tarjeta.style.transform = `translate3d(${currX.toFixed(2)}px, ${currY.toFixed(2)}px, 0) scale(${currScale.toFixed(4)})`;

            // Transición suave de border radius hacia el estilo de tarjeta de grilla
            if (progreso > 0.4) {
              tarjeta.style.borderRadius = "1rem";
            } else {
              tarjeta.style.borderRadius = "";
            }

            // Desvanecer el texto superpuesto para que al llegar a la grilla se vea limpia
            if (info) {
              const alphaTexto = Math.max(0, 1 - progreso * 1.5);
              info.style.opacity = alphaTexto.toFixed(2);
            }

            if (insignia) {
              const alphaInsignia = Math.max(0, 1 - progreso * 2);
              insignia.style.opacity = alphaInsignia.toFixed(2);
            }
          }
        }
      }

      animacionId = requestAnimationFrame(actualizar);
    };

    animacionId = requestAnimationFrame(actualizar);

    window.addEventListener("resize", medir, { passive: true });

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animacionId);
      window.removeEventListener("resize", medir);
      if (observer) observer.disconnect();
    };
  }, []);

  const manejarMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Solo aplicar inclinación 3D cuando no se ha scrolleado significativamente
    if (window.scrollY > 80) return;

    const tarjeta = tarjetaRef.current;
    if (!tarjeta) return;

    const rect = tarjeta.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosicionRaton({ x, y });
  };

  const manejarMouseEnter = () => {
    if (window.scrollY <= 80) {
      setEstaSobre(true);
    }
  };

  const manejarMouseLeave = () => {
    setEstaSobre(false);
    setPosicionRaton(null);
  };

  return (
    <figure ref={contenedorRef} className="relative z-30 min-w-0 space-y-2 py-2">
      <Link
        ref={tarjetaRef}
        href={enlaceFicha(destino.slug)}
        onMouseMove={manejarMouseMove}
        onMouseEnter={manejarMouseEnter}
        onMouseLeave={manejarMouseLeave}
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform, opacity",
        }}
        className="group relative block aspect-[5/4] overflow-hidden rounded-t-[2.75rem] rounded-b-2xl bg-[#193b33] shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-[#174238]/30 focus-visible:outline-2 focus-visible:outline-offset-4 sm:aspect-[4/3]"
      >
        {/* Imagen principal */}
        <div className="absolute inset-0 h-full w-full">
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

        {/* Reflejo interactivo dinámico que sigue el cursor */}
        {estaSobre && posicionRaton && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(500px circle at ${posicionRaton.x}px ${posicionRaton.y}px, rgba(255, 255, 255, 0.2), transparent 70%)`,
            }}
          />
        )}

        {/* Insignia interactiva flotante "Destino destacado" */}
        <div
          ref={insigniaRef}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-opacity duration-300 sm:top-5 sm:right-5"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span>Destino destacado</span>
        </div>

        {/* Información superpuesta del destino (se desvanece al encogerse y llegar a la grilla) */}
        <div
          ref={infoRef}
          className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/95 via-black/70 to-transparent px-5 pt-20 pb-5 text-white transition-opacity duration-300 sm:px-7 sm:pb-7"
        >
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
