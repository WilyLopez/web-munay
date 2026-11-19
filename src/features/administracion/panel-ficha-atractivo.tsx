"use client";

import Link from "next/link";
import { useState } from "react";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { estadosFicha } from "@/features/destinos/informacion";
import { FormularioFicha, type FichaOperativa } from "./formulario-ficha";
import { VisibilidadAtractivo } from "./visibilidad-atractivo";
import { ResumenFicha } from "./resumen-ficha";

const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";
const secundario = `${boton} border border-[#ccd9cf] bg-white hover:bg-[#edf4ed]`;

export function PanelFichaAtractivo({
  ficha,
  slug,
  editorId,
}: {
  ficha: FichaOperativa;
  slug: string;
  editorId?: string;
}) {
  const [modo, cambiarModo] = useState<"lectura" | "edicion" | "previa">(
    "lectura",
  );
  const [mensaje, cambiarMensaje] = useState("");
  const puedeEditar =
    ficha.estadoEditorial === "borrador" ||
    ficha.estadoEditorial === "publicada";

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dce3da] pb-5">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-[#465a50]">
            Mi atractivo
          </p>
          <h1 className="wrap-anywhere text-balance font-serif text-3xl leading-tight sm:text-4xl">
            {ficha.nombre}
          </h1>
          <p className="mt-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold">
            {estadosFicha[ficha.estadoEditorial]}
          </p>
        </div>
        {modo !== "edicion" && (
          <div className="flex flex-wrap gap-2">
            {ficha.estadoEditorial === "publicada" && (
              <Link
                href={enlaceFicha(slug)}
                target="_blank"
                rel="noopener noreferrer"
                className={secundario}
              >
                Ver detalles públicos{" "}
                <span className="ms-1" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> (abre en otra pestaña)</span>
              </Link>
            )}
            <button
              type="button"
              className={secundario}
              onClick={() =>
                cambiarModo(modo === "previa" ? "lectura" : "previa")
              }
            >
              {modo === "previa" ? "Cerrar vista previa" : "Vista previa"}
            </button>
            {puedeEditar && (
              <button
                type="button"
                className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
                onClick={() => {
                  cambiarMensaje("");
                  cambiarModo("edicion");
                }}
              >
                Editar ficha
              </button>
            )}
          </div>
        )}
      </header>
      {modo === "lectura" && (
        <section
          aria-label="Estado de la ficha"
          className="grid gap-4 border-b border-[#dce3da] pb-5 sm:grid-cols-3"
        >
          <div>
            <p className="text-sm text-[#465a50]">En Munay</p>
            <p className="font-semibold">
              {ficha.estadoEditorial === "publicada"
                ? "Visible para visitantes"
                : "Fuera del sitio público"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#465a50]">Atención al público</p>
            <p className="font-semibold">
              {(
                {
                  abierto: "Abierto",
                  cerrado: "Cerrado temporalmente",
                  restringido: "Acceso restringido",
                } as Record<string, string>
              )[ficha.informacion?.condicion ?? ""] ?? "Por confirmar"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#465a50]">Verificación de Munay</p>
            <p className="font-semibold">
              {ficha.verificado
                ? "Verificado por Munay"
                : "Sin insignia de verificación"}
            </p>
          </div>
          <p className="text-sm text-[#465a50] sm:col-span-3">
            {ficha.actualizadoEn
              ? `Última actualización: ${new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(ficha.actualizadoEn))}. `
              : ""}
            Datos básicos pendientes para publicar:{" "}
            {["distrito", "condicion", "modalidadIngreso"].filter(
              (clave) =>
                !ficha.informacion?.[clave as keyof typeof ficha.informacion],
            ).length + (ficha.imagenUrl ? 0 : 1)}
            . Publicar la ficha no significa que el lugar esté abierto.
          </p>
        </section>
      )}
      {modo === "lectura" && (
        <VisibilidadAtractivo
          slug={slug}
          nombre={ficha.nombre}
          estado={ficha.estadoEditorial}
        />
      )}
      {mensaje && (
        <p
          role="status"
          className="rounded-xl bg-teal-50 p-3 text-sm font-semibold"
        >
          {mensaje}
        </p>
      )}
      {modo === "edicion" ? (
        <FormularioFicha
          ficha={ficha}
          slug={slug}
          porSecciones
          editorId={editorId}
          alCancelar={() => cambiarModo("lectura")}
          alGuardar={(texto) => {
            cambiarMensaje(texto);
            cambiarModo("lectura");
          }}
        />
      ) : (
        <>
          {modo === "previa" && (
            <p
              role="status"
              className="rounded-xl bg-teal-50 p-3 text-sm font-semibold"
            >
              Vista previa de la ficha guardada
            </p>
          )}
          <ResumenFicha ficha={ficha} previa={modo === "previa"} />
        </>
      )}
    </div>
  );
}
