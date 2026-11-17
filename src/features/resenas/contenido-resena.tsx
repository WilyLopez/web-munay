import Image from "next/image";
import Link from "next/link";
import { TextoResena } from "./texto-resena";
import { FotoAmpliadaResena } from "./foto-ampliada-resena";

const fechaPublicacion = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});
const mesVisita = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
  timeZone: "America/Lima",
});

export function AvatarResena({
  nombre,
  pequeno = false,
}: {
  nombre: string;
  pequeno?: boolean;
}) {
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toLocaleUpperCase("es-PE");
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[#e7eee5] font-semibold text-[#174238] ${pequeno ? "size-8 text-xs" : "size-10 text-sm"}`}
    >
      {iniciales || "M"}
    </span>
  );
}

export function ValoracionResena({ nota }: { nota: number }) {
  return (
    <span
      role="img"
      aria-label={`${nota} de 5 estrellas`}
      className="inline-flex shrink-0 items-center gap-1"
    >
      <span aria-hidden="true" className="inline-flex gap-0.5 text-base">
        {[1, 2, 3, 4, 5].map((valor) => (
          <span
            key={valor}
            className={valor <= nota ? "text-[#a7612e]" : "text-[#d5d9cf]"}
          >
            ★
          </span>
        ))}
      </span>
      <span
        aria-hidden="true"
        className="ml-1 text-xs font-semibold text-[#526a60]"
      >
        {nota}/5
      </span>
    </span>
  );
}

export function ContenidoResena({
  autor,
  creadaEn,
  fechaVisita,
  calificacion,
  verificada,
  comentario,
  fotoUrl,
  destino,
  compacto = false,
}: {
  autor?: string;
  creadaEn?: string;
  fechaVisita?: string | null;
  calificacion?: number;
  verificada?: boolean;
  comentario: string;
  fotoUrl?: string | null;
  destino?: { nombre: string; slug: string; imagenUrl?: string | null };
  compacto?: boolean;
}) {
  return (
    <div className={`min-w-0 ${compacto ? "space-y-3" : "space-y-4"}`}>
      {destino && (
        <Link
          href={`/destinos/${encodeURIComponent(destino.slug)}#opiniones`}
          className="flex w-fit min-w-0 items-center gap-3 rounded-lg text-sm font-semibold text-[#174238] hover:underline"
        >
          {destino.imagenUrl && (
            <Image
              src={destino.imagenUrl}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          )}
          <span className="wrap-anywhere">{destino.nombre}</span>
        </Link>
      )}
      {(autor || creadaEn || calificacion !== undefined) && (
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            {autor && <AvatarResena nombre={autor} pequeno={compacto} />}
            <div className="min-w-0">
              {autor && (
                <p className="wrap-anywhere text-sm font-semibold text-[#14382e]">
                  {autor}
                </p>
              )}
              {creadaEn && (
                <time dateTime={creadaEn} className="text-xs text-[#687568]">
                  {fechaPublicacion.format(new Date(creadaEn))}
                </time>
              )}
            </div>
          </div>
          {calificacion !== undefined && (
            <ValoracionResena nota={calificacion} />
          )}
        </div>
      )}
      {(verificada !== undefined || fechaVisita) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#687568]">
          {verificada !== undefined && (
            <span
              className={`rounded-full px-2.5 py-1 font-medium ${verificada ? "bg-[#edf4ed] text-[#315b43]" : "bg-stone-100 text-stone-600"}`}
            >
              {verificada ? "Visita verificada" : "Sin verificación de visita"}
            </span>
          )}
          {fechaVisita && (
            <span>
              Visitó en{" "}
              <time dateTime={fechaVisita}>
                {mesVisita.format(new Date(fechaVisita))}
              </time>
            </span>
          )}
        </div>
      )}
      <TextoResena texto={comentario} compacto={compacto} />
      {fotoUrl && (
        <FotoAmpliadaResena
          url={fotoUrl}
          descripcion={
            autor
              ? `Foto de visita compartida por ${autor}`
              : "Foto de tu visita"
          }
          compacta={compacto}
        />
      )}
    </div>
  );
}
