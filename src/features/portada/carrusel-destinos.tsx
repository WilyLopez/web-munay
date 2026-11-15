"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { CreditoFoto } from "@/features/destinos/credito-foto";

type DestinoVisual = {
  slug: string;
  nombre: string;
  ubicacion: string;
  imagenUrl: string;
};

export function CarruselDestinos({ destinos }: { destinos: DestinoVisual[] }) {
  const [seleccion, elegir] = useState(0);
  const indice = Math.min(seleccion, destinos.length - 1);
  const destino = destinos[indice];

  if (!destino) return null;

  const mover = (paso: number) =>
    elegir((indice + paso + destinos.length) % destinos.length);

  return (
    <section aria-label="Destinos en portada" className="min-w-0 space-y-3">
      <figure className="space-y-2">
        <Link
          key={destino.slug}
          href={enlaceFicha(destino.slug)}
          className="entrada-portada group relative block aspect-[5/4] overflow-hidden rounded-t-[3rem] rounded-b-3xl bg-[#193b33] focus-visible:outline-2 focus-visible:outline-offset-4 sm:aspect-[4/3]"
          aria-label={`Ver detalles de ${destino.nombre}`}
        >
          <Image
            src={destino.imagenUrl}
            alt=""
            fill
            priority={indice === 0}
            sizes="(min-width: 768px) 52vw, 100vw"
            unoptimized={!destino.imagenUrl.startsWith("/")}
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04] motion-safe:group-focus-visible:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/65 to-transparent px-5 pt-20 pb-5 text-white sm:px-7 sm:pb-7">
            <p className="text-xs font-medium text-white/85">
              {destino.ubicacion}
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">
              {destino.nombre}
            </p>
            <span className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
              Ver detalles <span aria-hidden="true">↗</span>
            </span>
          </div>
        </Link>
        <figcaption>
          <CreditoFoto imagenUrl={destino.imagenUrl} />
        </figcaption>
      </figure>
      {destinos.length > 1 && (
        <div
          className="flex items-center justify-center gap-3"
          aria-label="Controles de destinos"
        >
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Destino anterior"
            className="size-11 rounded-full border border-[#bdb9ad] text-xl hover:bg-[#eae5d8]"
          >
            ←
          </button>
          <div className="flex">
            {destinos.map(({ slug, nombre }, posicion) => (
              <button
                key={slug}
                type="button"
                aria-label={`Mostrar ${nombre}`}
                aria-pressed={indice === posicion}
                onClick={() => elegir(posicion)}
                className="group grid size-10 place-items-center rounded-full"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-[#a6aca1] group-aria-pressed:bg-[#174238]"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Destino siguiente"
            className="size-11 rounded-full border border-[#bdb9ad] text-xl hover:bg-[#eae5d8]"
          >
            →
          </button>
          <span className="sr-only" role="status">
            {destino.nombre}, {indice + 1} de {destinos.length}
          </span>
        </div>
      )}
    </section>
  );
}
