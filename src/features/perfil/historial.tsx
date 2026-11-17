import { TextoResena } from "@/features/resenas/texto-resena";
import { FotoAmpliadaResena } from "@/features/resenas/foto-ampliada-resena";
import { enlaceEscribirResena } from "@/features/resenas/enlaces";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { solicitarVisitas } from "@/features/visitas/api";
import { BotonActualizarPanel } from "@/features/visitas/boton-actualizar-panel";
import {
  enlaceHistorial,
  seccionesPerfil,
  type DestinoHistorial,
  type HistorialPerfilDatos,
  type ResumenPerfil,
  type SeccionPerfil,
} from "./tipos";

const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeZone: "America/Lima",
});
const numero = new Intl.NumberFormat("es-PE");

type Actividad = {
  id: string;
  destino: DestinoHistorial;
  fecha: string;
  estado: string;
  comentario?: string;
  nota?: number;
  foto?: string | null;
  puntos?: number;
  detalle?: string;
  accion?: string;
  enlace?: string;
};

function actividades(historial: HistorialPerfilDatos): Actividad[] {
  if (historial.seccion === "visitas")
    return historial.filas.map((fila) => ({
      id: fila.id,
      destino: fila.destino,
      fecha: fila.verificadaEn,
      estado: "Visita verificada",
      accion: !fila.resena
        ? "Compartir mi experiencia"
        : fila.resena.retiradaEn
          ? undefined
          : "Ver mi reseña",
      enlace: !fila.resena
        ? enlaceEscribirResena(fila.destino.slug)
        : `${enlaceFicha(fila.destino.slug)}#resena-${fila.resena.id}`,
      detalle: !fila.resena
        ? "Todavía puedes escribir la reseña de esta visita."
        : fila.resena.retiradaEn
          ? "La reseña de esta visita fue retirada."
          : "Ya compartiste tu experiencia.",
    }));
  if (historial.seccion === "favoritos")
    return historial.filas.map((fila) => ({
      id: fila.id,
      destino: fila.destino,
      fecha: fila.creadoEn,
      estado: "Lugar guardado",
      accion: "Ver lugar",
      enlace: enlaceFicha(fila.destino.slug),
    }));
  if (historial.seccion === "respuestas")
    return historial.filas.map((fila) => ({
      id: fila.id,
      destino: fila.resena.destino,
      fecha: fila.creadaEn,
      estado: fila.resena.retiradaEn
        ? "Reseña retirada"
        : "Respuesta publicada",
      comentario: fila.comentario,
      accion: fila.resena.retiradaEn ? undefined : "Ver conversación",
      enlace: `${enlaceFicha(fila.resena.destino.slug)}#resena-${fila.resena.id}`,
    }));
  if (historial.seccion === "puntos")
    return historial.filas.map((fila) => ({
      id: fila.id,
      destino: fila.resena.destino,
      fecha: fila.creadoEn,
      estado:
        fila.tipo === "reversion"
          ? "Reversión de puntos"
          : "Puntos acreditados",
      puntos: fila.puntos,
      detalle:
        fila.tipo === "reversion"
          ? "Ajuste por retirada de la reseña."
          : fila.resena.selfieDeclarada && fila.puntos === 15
            ? "10 puntos por reseña y 5 por selfie."
            : "Recompensa por compartir tu visita.",
      accion: "Ver lugar",
      enlace: enlaceFicha(fila.resena.destino.slug),
    }));
  return historial.filas.map((fila) => {
    const puntos = fila.movimientosPuntos.reduce(
      (saldo, movimiento) => saldo + movimiento.puntos,
      0,
    );
    return {
      id: fila.id,
      destino: fila.destino,
      fecha: fila.creadaEn,
      estado: fila.retiradaEn ? "Retirada" : "Publicada",
      comentario: fila.comentario,
      nota: fila.calificacion,
      foto: fila.fotoUrl,
      detalle: fila.retiradaEn
        ? "Esta reseña dejó de mostrarse en el sitio público."
        : puntos > 0
          ? `${numero.format(puntos)} puntos acreditados · ${fila._count.respuestas} respuestas`
          : "La acreditación de puntos está pendiente de revisión.",
      accion: fila.retiradaEn ? undefined : "Ver mi reseña",
      enlace: `${enlaceFicha(fila.destino.slug)}#resena-${fila.id}`,
    };
  });
}

const mensajesVacios: Record<
  SeccionPerfil,
  { titulo: string; texto: string; accion: string; enlace: string }
> = {
  visitas: {
    titulo: "Tu próxima visita empieza aquí",
    texto:
      "Explora un lugar y verifica tu visita escaneando el QR que muestra su encargado.",
    accion: "Explorar lugares",
    enlace: "/destinos",
  },
  resenas: {
    titulo: "Tu experiencia puede ayudar a otros viajeros",
    texto:
      "Después de verificar una visita, podrás compartir una reseña y sumar puntos.",
    accion: "Ver mis visitas",
    enlace: enlaceHistorial("visitas"),
  },
  fotos: {
    titulo: "Guarda un recuerdo de tus visitas",
    texto: "Las fotos que adjuntes a tus reseñas aparecerán aquí.",
    accion: "Ver mis visitas",
    enlace: enlaceHistorial("visitas"),
  },
  respuestas: {
    titulo: "Forma parte de la conversación",
    texto:
      "Puedes responder a las reseñas de otros visitantes con preguntas o recomendaciones.",
    accion: "Explorar reseñas",
    enlace: "/resenas",
  },
  favoritos: {
    titulo: "Planea tu próxima salida",
    texto:
      "Guarda los lugares que quieras conocer para encontrarlos fácilmente en tu perfil.",
    accion: "Descubrir lugares",
    enlace: "/destinos",
  },
  puntos: {
    titulo: "Tu primera contribución cuenta",
    texto:
      "Una reseña verificada otorga 10 puntos. Una selfie declarada puede sumar 5 adicionales.",
    accion: "Ver mis visitas",
    enlace: enlaceHistorial("visitas"),
  },
};

async function FilasHistorial({
  seccion,
  pagina,
}: {
  seccion: SeccionPerfil;
  pagina: number;
}) {
  const resultado = await solicitarVisitas<HistorialPerfilDatos>(
    `/puntos/mi-historial?seccion=${seccion}&pagina=${pagina}`,
  );
  if (!resultado.ok)
    return (
      <div className="space-y-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-950">
        <p role="alert">
          No pudimos cargar esta sección. Puedes intentarlo nuevamente.
        </p>
        <BotonActualizarPanel reintentar />
      </div>
    );

  const filas = actividades(resultado.datos);
  const vacio = mensajesVacios[seccion];

  return (
    <>
      {filas.length > 0 ? (
        <ul
          className={
            seccion === "fotos"
              ? "grid gap-4 sm:grid-cols-2"
              : "divide-y divide-[#dce3da]"
          }
        >
          {filas.map((fila) => {
            const publico = fila.destino.estadoEditorial === "publicada";
            return (
              <li
                key={fila.id}
                className={
                  seccion === "fotos"
                    ? "overflow-hidden rounded-2xl border border-[#dce3da]"
                    : "py-5 first:pt-1 last:pb-1"
                }
              >
                {seccion === "fotos" && fila.foto && (
                  <a
                    href={fila.foto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Image
                      src={fila.foto}
                      alt={`Tu foto de visita a ${fila.destino.nombre}`}
                      width={640}
                      height={480}
                      unoptimized
                      className="aspect-[4/3] w-full bg-stone-100 object-contain"
                    />
                    <span className="sr-only">Abrir foto en otra pestaña</span>
                  </a>
                )}
                <div
                  className={
                    seccion === "fotos"
                      ? "space-y-3 p-4"
                      : "flex gap-3 sm:gap-4"
                  }
                >
                  {seccion !== "fotos" &&
                    seccion !== "puntos" &&
                    fila.destino.imagenUrl && (
                      <Image
                        src={fila.destino.imagenUrl}
                        alt=""
                        width={112}
                        height={112}
                        unoptimized
                        className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
                      />
                    )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="wrap-anywhere font-semibold text-[#14382e]">
                        {fila.destino.nombre}
                      </h3>
                      {fila.puntos !== undefined && (
                        <p
                          className={`shrink-0 font-semibold tabular-nums ${fila.puntos < 0 ? "text-amber-900" : "text-[#174238]"}`}
                        >
                          {fila.puntos > 0 ? "+" : ""}
                          {numero.format(fila.puntos)} pts
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#526a60]">
                      <time dateTime={fila.fecha}>
                        {fecha.format(new Date(fila.fecha))}
                      </time>
                      <span className="rounded-full bg-[#edf4ed] px-2.5 py-1 font-medium text-[#174238]">
                        {fila.estado}
                      </span>
                      {fila.nota !== undefined && (
                        <span className="font-semibold text-amber-950">
                          <span aria-hidden="true">★ </span>
                          {fila.nota} de 5
                        </span>
                      )}
                    </div>
                    {fila.comentario && (
                      <TextoResena texto={fila.comentario} compacto />
                    )}
                    {fila.detalle && (
                      <p className="text-xs leading-relaxed text-[#526a60]">
                        {fila.detalle}
                      </p>
                    )}
                    {!publico && (
                      <p className="text-xs text-stone-600">
                        Este lugar no está disponible en el catálogo en este
                        momento.
                      </p>
                    )}
                    {publico && fila.accion && fila.enlace && (
                      <Link
                        href={fila.enlace}
                        className="inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4 hover:text-[#0b6b52]"
                      >
                        {fila.accion}
                      </Link>
                    )}
                    {seccion === "resenas" && fila.foto && (
                      <FotoAmpliadaResena
                        url={fila.foto}
                        descripcion={`Tu foto compartida en ${fila.destino.nombre}`}
                        compacta
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl bg-[#f2f5ef] p-5 sm:p-7">
          <h3 className="font-serif text-xl text-[#14382e]">
            {pagina > 1 ? "Llegaste al final de esta sección" : vacio.titulo}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#526a60]">
            {pagina > 1
              ? "Vuelve a la primera página para consultar tu actividad."
              : vacio.texto}
          </p>
          <Link
            href={pagina > 1 ? enlaceHistorial(seccion) : vacio.enlace}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#174238] underline underline-offset-4"
          >
            {pagina > 1 ? "Volver a la primera página" : vacio.accion}
          </Link>
        </div>
      )}
      {(pagina > 1 || resultado.datos.hayMas) && (
        <nav
          aria-label="Páginas de mi actividad"
          className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#dce3da] pt-4 text-sm"
        >
          {pagina > 1 && (
            <Link
              href={enlaceHistorial(seccion, pagina - 1)}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#bdcfc2] px-3 font-semibold hover:bg-[#edf4ed]"
            >
              Anterior
            </Link>
          )}
          <span aria-current="page" className="px-1 text-[#526a60]">
            Página {pagina}
          </span>
          {resultado.datos.hayMas && (
            <Link
              href={enlaceHistorial(seccion, pagina + 1)}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#bdcfc2] px-3 font-semibold hover:bg-[#edf4ed]"
            >
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

export function EsqueletoActividad() {
  return (
    <div role="status" className="space-y-4 motion-safe:animate-pulse">
      <span className="sr-only">Cargando tu actividad</span>
      {[1, 2, 3].map((fila) => (
        <div key={fila} aria-hidden="true" className="flex gap-3">
          <div className="size-16 rounded-xl bg-[#e0e9e0]" />
          <div className="flex-1 space-y-3 py-2">
            <div className="h-4 w-2/3 rounded bg-[#e0e9e0]" />
            <div className="h-3 w-1/2 rounded bg-[#e0e9e0]" />
            <div className="h-3 w-3/4 rounded bg-[#e0e9e0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HistorialPerfil({
  consulta,
  resumen,
}: {
  consulta: Record<string, string | string[] | undefined>;
  resumen: ResumenPerfil;
}) {
  const seccion =
    seccionesPerfil.find(([valor]) => valor === consulta.seccion)?.[0] ??
    "visitas";
  const pagina =
    typeof consulta.pagina === "string" &&
    /^[1-9]\d{0,3}$/.test(consulta.pagina)
      ? Number(consulta.pagina)
      : 1;
  const conteos = {
    visitas: resumen.visitas,
    resenas: resumen.resenas,
    fotos: resumen.fotos,
    respuestas: resumen.respuestas,
    favoritos: resumen.favoritos,
  };

  return (
    <section
      id="historial"
      className="min-w-0 scroll-mt-28 rounded-3xl border border-[#d5e0d6] bg-white p-4 sm:p-6"
    >
      <h2 className="font-serif text-2xl text-[#14382e]">Mi actividad</h2>
      <nav
        aria-label="Secciones de mi actividad"
        className="my-5 flex gap-1 overflow-x-auto border-b border-[#dce3da] pb-2"
      >
        {seccionesPerfil.map(([valor, etiqueta]) => (
          <Link
            key={valor}
            aria-current={valor === seccion ? "page" : undefined}
            href={enlaceHistorial(valor)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#526a60] hover:bg-[#f2f5ef] aria-[current=page]:bg-[#174238] aria-[current=page]:text-white"
          >
            {etiqueta}
            {valor !== "puntos" && (
              <span className="text-xs tabular-nums opacity-80">
                {numero.format(conteos[valor] ?? 0)}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <Suspense key={`${seccion}-${pagina}`} fallback={<EsqueletoActividad />}>
        <FilasHistorial seccion={seccion} pagina={pagina} />
      </Suspense>
    </section>
  );
}
