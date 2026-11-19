import type { ReactNode } from "react";
import {
  gruposInformacion,
  opcionesInformacion,
  type InformacionDestino,
} from "./informacion";
import { VideoDestino } from "./video-destino";

const claseEnlace =
  "inline-flex min-h-12 items-center rounded-full border border-[#b9c4b9] px-4 py-2 text-sm font-semibold text-teal-950 transition-transform hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95";
const sociales = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
] as const;

export function SeccionDestino({
  id,
  titulo,
  children,
}: {
  id?: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-4 rounded-2xl border border-[#dedacf] bg-[#fffdf6] p-4 sm:p-6"
    >
      <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-teal-950">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function AvisoDestino({
  informacion,
}: {
  informacion: InformacionDestino;
}) {
  const { aviso, avisoDesde, avisoHasta, condicion, motivoCierre, reapertura } =
    informacion;
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const vigente =
    aviso &&
    (!avisoDesde || hoy >= avisoDesde) &&
    (!avisoHasta || hoy <= avisoHasta);
  const condicionEspecial =
    condicion === "cerrado" || condicion === "restringido";
  if (!vigente && !condicionEspecial) return null;
  return (
    <aside
      className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
      aria-label="Avisos para la visita"
    >
      {condicionEspecial && (
        <div>
          <p className="font-semibold">
            {
              opcionesInformacion.condicion.find(
                ([id]) => id === condicion,
              )?.[1]
            }
          </p>
          {motivoCierre && <p>{motivoCierre}</p>}
          {reapertura && (
            <p>
              Reapertura estimada el{" "}
              <time dateTime={reapertura}>{reapertura}</time>
            </p>
          )}
        </div>
      )}
      {vigente && <p className="whitespace-pre-line">{aviso}</p>}
    </aside>
  );
}

export function HistoriaDestino({
  informacion,
}: {
  informacion: InformacionDestino;
}) {
  const {
    historia,
    detalles,
    fuentesHistoria,
    videoYoutube,
    videoTitulo,
    etiquetas,
  } = informacion;
  if (!historia && !detalles && !fuentesHistoria && !videoYoutube && !etiquetas)
    return null;
  return (
    <SeccionDestino id="historia" titulo="Descubre este destino">
      {etiquetas && (
        <ul className="flex flex-wrap gap-2">
          {[
            ...new Set(
              etiquetas
                .split(/\r?\n/)
                .map((dato) => dato.trim())
                .filter(Boolean),
            ),
          ].map((etiqueta) => (
            <li
              key={etiqueta}
              className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-900"
            >
              {etiqueta}
            </li>
          ))}
        </ul>
      )}
      {detalles && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Qué encontrarás</h3>
          <p className="whitespace-pre-line leading-relaxed text-stone-700">
            {detalles}
          </p>
        </div>
      )}
      {historia && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Historia y patrimonio</h3>
          <p className="whitespace-pre-line leading-relaxed text-stone-700">
            {historia}
          </p>
        </div>
      )}
      {fuentesHistoria && (
        <div className="space-y-2">
          <h3 className="font-semibold">Fuentes consultadas</h3>
          <ul className="flex flex-wrap gap-2">
            {[
              ...new Set(
                fuentesHistoria
                  .split(/\r?\n/)
                  .map((dato) => dato.trim())
                  .filter(Boolean),
              ),
            ].map((url, indice) => (
              <li key={url}>
                <a className={claseEnlace} href={url}>
                  Fuente {indice + 1}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {videoYoutube && (
        <VideoDestino
          enlace={videoYoutube}
          titulo={videoTitulo || "Mira la historia del destino"}
        />
      )}
    </SeccionDestino>
  );
}

export function DatosVisitaDestino({
  informacion,
}: {
  informacion: InformacionDestino;
}) {
  const campos =
    gruposInformacion.find(
      ([grupo]) => grupo === "Información para la visita",
    )?.[1] ?? [];
  const omitidos = new Set(["motivoCierre", "reapertura", "reservaUrl"]);
  const esenciales = new Set([
    "condicion",
    "modalidadIngreso",
    "duracionVisita",
    "accesoSilla",
  ]);
  const detalles = campos.flatMap(([clave, etiqueta, , tipo]) => {
    const valor = informacion[clave];
    if (!valor || omitidos.has(clave) || !esenciales.has(clave)) return [];
    const opciones =
      tipo && tipo in opcionesInformacion
        ? opcionesInformacion[tipo as keyof typeof opcionesInformacion]
        : [];
    return [
      {
        clave,
        etiqueta: etiqueta.replace(/ \(un[ao] por línea\)/, ""),
        valor: opciones.find(([id]) => id === valor)?.[1] ?? valor,
      },
    ];
  });
  return (
    <>
      {detalles.map(({ clave, etiqueta, valor }) => (
        <div key={clave}>
          <dt className="font-semibold">{etiqueta}</dt>
          <dd className="whitespace-pre-line text-stone-700">{valor}</dd>
        </div>
      ))}
    </>
  );
}

export function DetalleVisitaDestino({
  informacion,
}: {
  informacion: InformacionDestino;
}) {
  const grupos = [
    [
      "Servicios y accesibilidad",
      [
        "servicios",
        "idiomas",
        "accesoSilla",
        "rampas",
        "banosAdaptados",
        "terreno",
      ],
    ],
    [
      "Actividades y recomendaciones",
      ["actividades", "duracionVisita", "dificultad", "temporada"],
    ],
    [
      "Reglas, horarios y pagos",
      [
        "reglas",
        "ultimoIngreso",
        "excepcionesHorario",
        "tarifasAdicionales",
        "metodosPago",
      ],
    ],
  ] as const;
  const campos = gruposInformacion.flatMap(([, campos]) => [...campos]);
  const presentes = grupos.filter(([, claves]) =>
    claves.some((clave) => informacion[clave]),
  );
  if (!presentes.length) return null;
  return (
    <SeccionDestino id="informacion-visita" titulo="Información para tu visita">
      <div className="divide-y divide-[#dedacf]">
        {presentes.map(([titulo, claves]) => (
          <details key={titulo} className="group py-2" open={undefined}>
            <summary className="cursor-pointer py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
              {titulo}
            </summary>
            <dl className="grid gap-4 pb-4 text-sm sm:grid-cols-2">
              {claves.map((clave) => {
                const valor = informacion[clave];
                if (!valor) return null;
                const campo = campos.find(([id]) => id === clave);
                const tipo = campo?.[3];
                const opciones =
                  tipo && tipo in opcionesInformacion
                    ? opcionesInformacion[
                        tipo as keyof typeof opcionesInformacion
                      ]
                    : [];
                return (
                  <div key={clave} className="min-w-0">
                    <dt className="font-semibold">
                      {campo?.[1].replace(/ \(un[ao] por línea\)/, "") ?? clave}
                    </dt>
                    <dd className="mt-1 wrap-anywhere whitespace-pre-line leading-relaxed text-[#465a50]">
                      {opciones.find(([id]) => id === valor)?.[1] ?? valor}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </details>
        ))}
      </div>
    </SeccionDestino>
  );
}

export function ContactoDestino({
  informacion,
}: {
  informacion: InformacionDestino;
}) {
  const { telefono, whatsapp, correo, sitioWeb, reservaUrl } = informacion;
  const enlaces = [
    [telefono && `tel:${telefono.replace(/[^+\d]/g, "")}`, "Llamar"],
    [whatsapp && `https://wa.me/${whatsapp.replace(/^\+/, "")}`, "WhatsApp"],
    [correo && `mailto:${correo}`, "Correo"],
    [sitioWeb, "Sitio oficial"],
    [reservaUrl, "Reservar"],
    ...sociales.map(([clave, etiqueta]) => [informacion[clave], etiqueta]),
  ].filter(([href]) => href);
  if (!enlaces.length) return null;
  return (
    <SeccionDestino titulo="Contacto y redes">
      <ul className="flex flex-wrap gap-2 text-sm">
        {enlaces.map(([href, etiqueta]) => (
          <li key={etiqueta}>
            <a
              className={claseEnlace}
              href={href}
              target={href?.startsWith("https://") ? "_blank" : undefined}
              rel={
                href?.startsWith("https://") ? "noopener noreferrer" : undefined
              }
            >
              {etiqueta}
              {href?.startsWith("https://") && (
                <span className="sr-only"> (abre en otra pestaña)</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </SeccionDestino>
  );
}
