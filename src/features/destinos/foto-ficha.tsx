"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CreditoFoto } from "./credito-foto";
import { optimizarFoto } from "./presentacion-ficha";
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
  const fotos = Array.from(
    new Set(
      [
        url,
        ...adicionales,
        ...(informacion?.galeria?.map((foto) => foto.url) ?? []),
      ].filter((foto): foto is string => !!foto),
    ),
  );
  const [seleccion, cambiarSeleccion] = useState<string>();
  const [fallidas, cambiarFallidas] = useState<string[]>([]);
  const [cargadas, cambiarCargadas] = useState<string[]>([]);
  const [abierta, cambiarAbierta] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const disponibles = fotos.filter((foto) => !fallidas.includes(foto));
  const principal =
    seleccion && disponibles.includes(seleccion) ? seleccion : disponibles[0];
  const indice = principal ? disponibles.indexOf(principal) : 0;
  const metadatos =
    principal === url
      ? {
          alt: informacion?.portadaAlt,
          autor: informacion?.portadaAutor,
          licencia: informacion?.portadaLicencia,
          descripcion: "",
        }
      : informacion?.galeria?.find((foto) => foto.url === principal);
  useEffect(() => {
    if (!abierta) return;
    const elemento = dialogo.current;
    const anterior = document.body.style.overflow;
    elemento?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      elemento?.close();
      document.body.style.overflow = anterior;
    };
  }, [abierta]);
  function mover(paso: number) {
    if (disponibles.length)
      cambiarSeleccion(
        disponibles[(indice + paso + disponibles.length) % disponibles.length],
      );
  }
  function terminar(evento: React.TouchEvent) {
    if (!inicio.current) return;
    const fin = evento.changedTouches[0];
    const dx = inicio.current.x - fin.clientX,
      dy = inicio.current.y - fin.clientY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
      mover(dx > 0 ? 1 : -1);
    inicio.current = null;
  }
  const credito = principal && (
    <figcaption className="text-xs leading-relaxed text-[#52675b]">
      {metadatos?.descripcion && <p>{metadatos.descripcion}</p>}
      {metadatos?.autor || metadatos?.licencia ? (
        <p>
          {[metadatos.autor, metadatos.licencia].filter(Boolean).join(" · ")}
        </p>
      ) : (
        <CreditoFoto imagenUrl={principal} />
      )}
    </figcaption>
  );
  return (
    <figure className="min-w-0 space-y-3">
      <div
        className={`grid gap-2 ${disponibles.length >= 4 ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}
      >
        <div
          className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-[#193b33] text-white touch-pan-y sm:aspect-[16/10]"
          onTouchStart={(evento) => {
            inicio.current = {
              x: evento.touches[0].clientX,
              y: evento.touches[0].clientY,
            };
          }}
          onTouchEnd={terminar}
          onTouchCancel={() => {
            inicio.current = null;
          }}
        >
          {principal ? (
            <button
              type="button"
              className="absolute inset-0 focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
              aria-label={`Ampliar foto ${indice + 1} de ${nombre}`}
              onClick={() => cambiarAbierta(true)}
            >
              <Image
                key={principal}
                src={principal}
                alt={metadatos?.alt || nombre}
                fill
                preload={principal === fotos[0]}
                unoptimized={!optimizarFoto(principal)}
                sizes="(min-width: 1024px) 650px, 100vw"
                className="object-cover"
                onLoad={() =>
                  cambiarCargadas((actuales) =>
                    actuales.includes(principal)
                      ? actuales
                      : [...actuales, principal],
                  )
                }
                onError={() =>
                  cambiarFallidas((actuales) => [...actuales, principal])
                }
              />
            </button>
          ) : (
            <p className="grid h-full place-items-center px-4 text-center text-sm">
              Fotografías aún no disponibles
            </p>
          )}
          {principal && !cargadas.includes(principal) && (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 grid place-items-center bg-[#e8eee6] text-sm text-[#174238] motion-safe:animate-pulse"
            >
              Cargando fotografía…
            </div>
          )}
          {verificado && (
            <span
              title="El equipo de Munay verificó la información de este destino. No es una garantía de calidad."
              className="pointer-events-none absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#174238] shadow-sm"
            >
              Destino verificado
            </span>
          )}
          {principal && (
            <button
              type="button"
              onClick={() => cambiarAbierta(true)}
              className="absolute bottom-3 right-3 min-h-11 rounded-xl bg-white px-3 text-xs font-semibold text-[#174238] shadow-sm hover:bg-[#edf4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver{" "}
              {disponibles.length === 1
                ? "foto"
                : `las ${disponibles.length} fotos`}
            </button>
          )}
        </div>
        {disponibles.length >= 4 && (
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            {disponibles
              .filter((foto) => foto !== principal)
              .slice(0, 2)
              .map((foto, i) => (
                <button
                  key={foto}
                  type="button"
                  className="relative min-h-0 overflow-hidden rounded-xl bg-[#e8eee6] focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label={`Ampliar otra foto de ${nombre}, ${i + 1}`}
                  onClick={() => {
                    cambiarSeleccion(foto);
                    cambiarAbierta(true);
                  }}
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="220px"
                    unoptimized={!optimizarFoto(foto)}
                    className="object-cover"
                    loading="lazy"
                    onError={() =>
                      cambiarFallidas((actuales) => [...actuales, foto])
                    }
                  />
                </button>
              ))}
          </div>
        )}
      </div>
      {disponibles.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => mover(-1)}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b9c4b9] text-xl hover:bg-[#e8eee6] focus-visible:outline-2"
          >
            ‹
          </button>
          <ul
            aria-label="Fotos del destino"
            className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto p-1"
          >
            {disponibles.map((foto, i) => (
              <li key={foto} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-label={`Mostrar foto ${i + 1}`}
                  aria-pressed={foto === principal}
                  onClick={() => cambiarSeleccion(foto)}
                  className="relative block h-14 w-20 overflow-hidden rounded-lg border-2 border-transparent bg-[#e8eee6] focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-[#174238]"
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized={!optimizarFoto(foto)}
                    loading="lazy"
                    className="object-cover"
                    onError={() =>
                      cambiarFallidas((actuales) => [...actuales, foto])
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => mover(1)}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b9c4b9] text-xl hover:bg-[#e8eee6] focus-visible:outline-2"
          >
            ›
          </button>
        </div>
      )}
      {credito}
      <dialog
        ref={dialogo}
        aria-label={`Galería de ${nombre}`}
        onCancel={(evento) => {
          evento.preventDefault();
          cambiarAbierta(false);
        }}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowRight") {
            evento.preventDefault();
            mover(1);
          }
          if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            mover(-1);
          }
        }}
        className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto overscroll-contain rounded-2xl bg-[#102e27] p-3 text-white backdrop:bg-black/80 sm:p-5"
      >
        {abierta && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p
                role="status"
                aria-live="polite"
                className="min-w-0 wrap-anywhere text-sm"
              >
                {disponibles.length
                  ? `Foto ${indice + 1} de ${disponibles.length} · ${nombre}`
                  : "Sin fotografías disponibles"}
              </p>
              <button
                type="button"
                onClick={() => cambiarAbierta(false)}
                className="min-h-11 rounded-xl border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2"
              >
                Cerrar
              </button>
            </div>
            <div
              className="relative h-[55dvh] min-h-48 sm:h-[65dvh]"
              onTouchStart={(evento) => {
                inicio.current = {
                  x: evento.touches[0].clientX,
                  y: evento.touches[0].clientY,
                };
              }}
              onTouchEnd={terminar}
            >
              {principal ? (
                <Image
                  src={principal}
                  alt={metadatos?.alt || nombre}
                  fill
                  sizes="(min-width: 1024px) 1100px, 100vw"
                  unoptimized={!optimizarFoto(principal)}
                  className="object-contain"
                  onLoad={() =>
                    cambiarCargadas((actuales) =>
                      actuales.includes(`${principal}#visor`)
                        ? actuales
                        : [...actuales, `${principal}#visor`],
                    )
                  }
                  onError={() =>
                    cambiarFallidas((actuales) => [...actuales, principal])
                  }
                />
              ) : (
                <p>No hay fotografías disponibles.</p>
              )}
              {principal && !cargadas.includes(`${principal}#visor`) && (
                <p
                  role="status"
                  className="pointer-events-none absolute inset-0 grid place-items-center bg-[#102e27] text-sm text-white/80"
                >
                  Cargando fotografía ampliada…
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={disponibles.length < 2}
                onClick={() => mover(-1)}
                className="min-h-11 rounded-xl border border-white/30 px-4 hover:bg-white/10 disabled:opacity-40"
              >
                Anterior
              </button>
              <div className="min-w-0 flex-1 wrap-anywhere text-center text-xs text-white/85">
                {metadatos?.descripcion}
                <p>
                  {[metadatos?.autor, metadatos?.licencia]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                disabled={disponibles.length < 2}
                onClick={() => mover(1)}
                className="min-h-11 rounded-xl border border-white/30 px-4 hover:bg-white/10 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </dialog>
    </figure>
  );
}
