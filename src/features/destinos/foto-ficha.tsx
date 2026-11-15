"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CreditoFoto } from "./credito-foto";
import type { InformacionDestino } from "./informacion";

export function FotoFicha({
  url,
  adicionales = [],
  nombre,
  verificado,
  informacion,
  children,
}: {
  url: string | null;
  adicionales?: string[];
  nombre: string;
  verificado: boolean;
  informacion?: InformacionDestino;
  children?: ReactNode;
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
    <figure className="space-y-2">
      <div className="relative isolate flex min-h-[26rem] items-end overflow-hidden rounded-3xl bg-teal-950 text-white sm:min-h-[34rem]">
        {principal ? (
          <Image
            key={principal}
            src={principal}
            alt={metadatos?.alt || nombre}
            fill
            priority
            unoptimized={
              !principal.startsWith("/") && !principal.includes("wikimedia.org")
            }
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="-z-20 object-cover"
            onError={() =>
              cambiarFallidas((anteriores) => [...anteriores, principal])
            }
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/95 via-black/45 to-black/10" />
        {verificado && (
          <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-teal-950">
            Destino verificado
          </span>
        )}
        <div className="w-full p-6 sm:p-10">{children}</div>
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
