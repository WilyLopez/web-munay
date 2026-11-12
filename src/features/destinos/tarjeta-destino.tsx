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

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-[16/9] bg-teal-950">
        {mostrarImagen && destino.imagenUrl ? (
          <Image
            src={destino.imagenUrl}
            alt={destino.nombre}
            fill
            unoptimized
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
      <div className="space-y-2 p-5">
        <p className="text-sm font-semibold text-teal-800">
          {categorias[destino.categoria]}
        </p>
        <h2 className="text-xl font-bold">
          <Link
            href={enlaceFicha(destino.slug, volver)}
            className="hover:underline"
          >
            {destino.nombre}
          </Link>
        </h2>
        <p className="text-sm text-stone-700">{destino.ubicacion}</p>
        <p className="text-sm font-medium text-stone-700">
          {destino.calificacionPromedio === null
            ? "Sin calificaciones"
            : `${formatoCalificacion.format(destino.calificacionPromedio)} de 5`}
        </p>
        <p className="leading-relaxed text-stone-700">{destino.descripcion}</p>
        <Link
          href={enlaceMapa}
          className="inline-block text-sm font-semibold text-teal-800 underline"
        >
          Ver en el mapa
        </Link>
        {mostrarImagen && <CreditoFoto imagenUrl={destino.imagenUrl} />}
      </div>
    </article>
  );
}
