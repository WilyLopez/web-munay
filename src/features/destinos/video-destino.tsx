"use client";

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

function esVideoDirecto(enlace: string) {
  if (!URL.canParse(enlace)) return false;
  const ruta = new URL(enlace).pathname.toLowerCase();
  return /\.(mp4|webm|ogg|mov)$/.test(ruta);
}

export function VideoDestino({
  enlace,
  titulo,
}: {
  enlace: string;
  titulo: string;
}) {
  const id = idYoutube(enlace);
  const directo = esVideoDirecto(enlace);

  if (!id && !directo) {
    return null;
  }

  return (
    <div className="space-y-2">
      {id ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-teal-950 shadow-md">
          <iframe
            className="h-full w-full border-0"
            title={titulo}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-teal-950 shadow-md">
          <video
            className="h-full w-full object-cover"
            src={enlace}
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-stone-600 font-medium">
          Reproducción automática sin sonido (puedes activar el audio en los controles)
        </span>
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-4 hover:text-teal-900"
        >
          {id ? "Ver en YouTube ↗" : "Abrir video original ↗"}
        </a>
      </div>
    </div>
  );
}
