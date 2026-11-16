"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FavoritoDestino } from "./favorito-destino";
import { CreditoFoto } from "./credito-foto";
import { categorias, enlaceFicha, type Destino } from "./catalogo";

const formatoCalificacion = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

export function TarjetaDestino({
  destino,
  tieneSesion,
  enlaceMapa,
  volver,
}: {
  destino: Destino;
  tieneSesion: boolean;
  enlaceMapa: string;
  volver: string;
}) {
  const [imagenFallida, marcarImagenFallida] = useState<string | null>(null);
  const mostrarImagen =
    destino.imagenUrl && imagenFallida !== destino.imagenUrl;
  const ficha = enlaceFicha(destino.slug, volver);
  const enlace =
    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dedacf] bg-[#fffdf6]">
      <div className="relative aspect-[16/9] bg-teal-950">
        {mostrarImagen && destino.imagenUrl ? (
          <Image
            src={destino.imagenUrl}
            alt={destino.nombre}
            fill
            unoptimized={
              !destino.imagenUrl.startsWith("/") &&
              !destino.imagenUrl.includes("wikimedia.org")
            }
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            onError={() => marcarImagenFallida(destino.imagenUrl)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-teal-900 to-emerald-700 px-5 text-center text-sm font-medium text-white">
            Sin fotografía
          </div>
        )}
        {destino.verificado && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-900">
            Verificado
          </span>
        )}
        <FavoritoDestino destino={destino} tieneSesion={tieneSesion} compacto />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-semibold text-[#8d402d]">
            {categorias[destino.categoria]}
          </p>
          {destino.calificacionPromedio !== null && (
            <p className="font-medium text-[#465a50]">
              <span aria-hidden="true">★ </span>
              {formatoCalificacion.format(destino.calificacionPromedio)} de 5
              {Boolean(destino.totalResenas) && (
                <span className="ms-1">
                  ({destino.totalResenas}{" "}
                  {destino.totalResenas === 1 ? "reseña" : "reseñas"})
                </span>
              )}
            </p>
          )}
        </div>
        <h2 className="wrap-anywhere font-serif text-2xl leading-tight">
          {destino.nombre}
        </h2>
        <p className="text-sm text-[#465a50]">{destino.ubicacion}</p>
        <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-[#465a50]">
          {destino.descripcion}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#dedacf] pt-3">
          <Link
            href={ficha}
            aria-label={`Ver detalles de ${destino.nombre}`}
            className={`${enlace} bg-[#174238] text-white hover:bg-[#23574a]`}
          >
            Ver detalles
          </Link>
          <Link
            href={enlaceMapa}
            prefetch={false}
            aria-label={`Ver ${destino.nombre} en el mapa`}
            className={`${enlace} border border-[#b9c4b9] hover:bg-[#e8eee6]`}
          >
            Ver en el mapa
          </Link>
        </div>
        {mostrarImagen && <CreditoFoto imagenUrl={destino.imagenUrl} />}
      </div>
    </article>
  );
}
