"use client";

import Image from "next/image";
import { useState } from "react";
import { CreditoFoto } from "./credito-foto";
import type { InformacionDestino } from "./informacion";

export function FotoFicha({
  url,
  adicionales = [],
  nombre,
  verificado,
  informacion,
}: {
  url: string | null;
  adicionales?: string[];
  nombre: string;
  verificado: boolean;
  informacion?: InformacionDestino;
}) {
  const fotos = Array.from(new Set(url ? [url, ...adicionales] : adicionales));
  const [seleccion, cambiarSeleccion] = useState<string>();
  const [fallidas, cambiarFallidas] = useState<string[]>([]);
  const disponibles = fotos.filter((foto) => !fallidas.includes(foto));
  const principal =
    seleccion && disponibles.includes(seleccion) ? seleccion : disponibles[0];
  const metadatos =
    principal === url
      ? {
          alt: informacion?.portadaAlt,
          autor: informacion?.portadaAutor,
          licencia: informacion?.portadaLicencia,
          descripcion: "",
        }
      : informacion?.galeria?.find((foto) => foto.url === principal);

  return (
    <figure className="min-w-0 space-y-2">
      <div className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-[#193b33] text-white sm:aspect-[16/10]">
        {principal ? (
          <Image
            key={principal}
            src={principal}
            alt={metadatos?.alt || nombre}
            fill
            preload={principal === fotos[0]}
            unoptimized={
              !principal.startsWith("/") && !principal.includes("wikimedia.org")
            }
            sizes="(min-width: 1280px) 640px, (min-width: 1024px) 54vw, 100vw"
            className="-z-20 object-cover"
            onError={() =>
              cambiarFallidas((anteriores) => [...anteriores, principal])
            }
          />
        ) : (
          <p className="grid h-full place-items-center px-4 text-center text-sm">
            Fotografías aún no disponibles
          </p>
        )}
        {verificado && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-950">
            Destino verificado
          </span>
        )}
      </div>
      {disponibles.length > 1 && (
        <ul
          aria-label="Fotos del destino"
          className="flex max-w-full gap-2 overflow-x-auto p-1"
        >
          {disponibles.map((foto, indice) => (
            <li key={foto}>
              <button
                type="button"
                aria-label={`Mostrar foto ${indice + 1}`}
                aria-pressed={foto === principal}
                className="relative block h-13 w-19 overflow-hidden rounded-lg border-2 border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-teal-900 sm:h-16 sm:w-24"
                onClick={() => cambiarSeleccion(foto)}
              >
                <Image
                  src={foto}
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 640px) 96px, 76px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {principal && (
        <figcaption className="text-sm text-stone-700">
          {metadatos?.descripcion && <p>{metadatos.descripcion}</p>}
          {metadatos?.autor || metadatos?.licencia ? (
            <p>
              {[metadatos.autor, metadatos.licencia]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : (
            <CreditoFoto imagenUrl={principal} />
          )}
        </figcaption>
      )}
    </figure>
  );
}
