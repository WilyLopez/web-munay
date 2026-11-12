"use client";

import Image from "next/image";
import { useState } from "react";
import { CreditoFoto } from "./credito-foto";

export function FotoFicha({
  url,
  adicionales = [],
  nombre,
  verificado,
}: {
  url: string | null;
  adicionales?: string[];
  nombre: string;
  verificado: boolean;
}) {
  const fotos = Array.from(new Set(url ? [url, ...adicionales] : adicionales));
  const [seleccion, cambiarSeleccion] = useState<string>();
  const [fallidas, cambiarFallidas] = useState<string[]>([]);
  const disponibles = fotos.filter((foto) => !fallidas.includes(foto));
  const principal =
    seleccion && disponibles.includes(seleccion) ? seleccion : disponibles[0];

  return (
    <figure className="space-y-2">
      <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-3xl bg-teal-950 text-white">
        {principal ? (
          <Image
            key={principal}
            src={principal}
            alt={nombre}
            fill
            unoptimized
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
            onError={() =>
              cambiarFallidas((anteriores) => [...anteriores, principal])
            }
          />
        ) : (
          <p>Fotografía no disponible</p>
        )}
        {verificado && (
          <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-teal-950">
            Destino verificado
          </span>
        )}
      </div>
      {disponibles.length > 1 && (
        <ul
          aria-label="Fotos del destino"
          className="flex flex-wrap gap-3 pt-2"
        >
          {disponibles.map((foto, indice) => (
            <li key={foto}>
              <button
                type="button"
                aria-label={`Mostrar foto ${indice + 1}`}
                aria-pressed={foto === principal}
                className="relative block h-16 w-24 overflow-hidden rounded-lg border-2 border-stone-300 aria-pressed:border-teal-900"
                onClick={() => cambiarSeleccion(foto)}
              >
                <Image
                  src={foto}
                  alt=""
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {principal && (
        <figcaption>
          <CreditoFoto imagenUrl={principal} />
        </figcaption>
      )}
    </figure>
  );
}
