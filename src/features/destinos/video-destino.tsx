"use client";

import { useState } from "react";

function idYoutube(enlace: string) {
  if (!URL.canParse(enlace)) return null;
  const url = new URL(enlace);
  const segmento = url.pathname.split("/").filter(Boolean);
  const id =
    url.hostname === "youtu.be"
      ? segmento[0]
      : ["www.youtube.com", "youtube.com", "m.youtube.com"].includes(
            url.hostname,
          )
        ? segmento[0] === "shorts"
          ? segmento[1]
          : url.searchParams.get("v")
        : null;
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function VideoDestino({
  enlace,
  titulo,
}: {
  enlace: string;
  titulo: string;
}) {
  const [reproducir, cambiarReproduccion] = useState(false);
  const id = idYoutube(enlace);
  return (
    <div className="space-y-2">
      {id &&
        (reproducir ? (
          <iframe
            className="aspect-video w-full rounded-2xl bg-teal-950"
            title={titulo}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => cambiarReproduccion(true)}
            className="flex min-h-28 w-full items-center gap-4 rounded-2xl bg-teal-950 p-5 text-left text-white transition-colors hover:bg-teal-800"
          >
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-white/20"
            >
              ▶
            </span>
            <span>
              <strong className="block">{titulo}</strong>
              <span className="text-sm text-teal-100">
                Reproducir video de YouTube
              </span>
            </span>
          </button>
        ))}
      <a
        href={enlace}
        className="inline-flex py-1 text-sm font-semibold underline underline-offset-4"
      >
        Abrir en YouTube
      </a>
    </div>
  );
}
