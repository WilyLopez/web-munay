import Image from "next/image";
import { categorias, provincias } from "@/features/destinos/catalogo";
import {
  gruposInformacion,
  opcionesInformacion,
} from "@/features/destinos/informacion";
import type { FichaOperativa } from "./formulario-ficha";

const tarjeta =
  "min-w-0 rounded-2xl border border-[#dce3da] bg-white p-4 sm:p-6";

export function ResumenFicha({
  ficha,
  previa = false,
}: {
  ficha: FichaOperativa;
  previa?: boolean;
}) {
  const informacion = ficha.informacion ?? {};
  const foto =
    ficha.imagenUrl &&
    (/^\/(?!\/)/.test(ficha.imagenUrl) || /^https?:\/\//.test(ficha.imagenUrl))
      ? ficha.imagenUrl
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-[#dce3da] bg-white">
        {foto && (
          <div className="relative aspect-[16/8] bg-[#e0e9e0]">
            <Image
              src={foto}
              alt={informacion.portadaAlt ?? ""}
              fill
              unoptimized
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-2 p-4 sm:p-6">
          <p className="text-sm font-semibold text-[#8d402d]">
            {categorias[ficha.categoria]} · {provincias[ficha.provincia]}
          </p>
          <h2 className="wrap-anywhere font-serif text-2xl sm:text-3xl">
            {previa ? ficha.nombre : "Información del atractivo"}
          </h2>
          <p className="wrap-anywhere text-sm font-medium text-[#465a50]">
            {ficha.ubicacion}
          </p>
          <p className="wrap-anywhere whitespace-pre-line text-sm leading-relaxed text-[#465a50]">
            {ficha.descripcion}
          </p>
        </div>
      </section>
      <div className="grid content-start gap-4">
        <section className={tarjeta}>
          <h2 className="font-serif text-2xl">Planea la visita</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="font-semibold">Horario</dt>
              <dd className="wrap-anywhere whitespace-pre-line">
                {ficha.horario || "Por confirmar"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Tarifa general</dt>
              <dd>
                {ficha.tarifaGeneral
                  ? `S/ ${ficha.tarifaGeneral}`
                  : "Por confirmar"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Estudiantes</dt>
              <dd>
                {ficha.tarifaEstudiantes
                  ? `S/ ${ficha.tarifaEstudiantes}`
                  : "Por confirmar"}
              </dd>
            </div>
          </dl>
        </section>
        <section className={tarjeta}>
          <h2 className="font-serif text-2xl">Cómo llegar</h2>
          <p className="mt-2 wrap-anywhere whitespace-pre-line text-sm text-[#465a50]">
            {ficha.rutaDesdeChiclayo || ficha.ubicacion}
          </p>
        </section>
        {previa && informacion.historia && (
          <section className={tarjeta}>
            <h2 className="font-serif text-2xl">Historia</h2>
            <p className="mt-2 wrap-anywhere whitespace-pre-line text-sm text-[#465a50]">
              {informacion.historia}
            </p>
          </section>
        )}
        {!previa &&
          gruposInformacion.map(([grupo, campos]) => {
            const datos = campos.flatMap(([clave, etiqueta, , tipo]) => {
              const valor = informacion[clave];
              if (!valor) return [];
              const opciones =
                opcionesInformacion[tipo as keyof typeof opcionesInformacion];
              return [
                {
                  clave,
                  etiqueta: etiqueta.replace(/ \([^)]*por línea\)/, ""),
                  valor: opciones?.find(([id]) => id === valor)?.[1] ?? valor,
                },
              ];
            });
            if (!datos.length) return null;
            return (
              <details
                key={grupo}
                className="min-w-0 rounded-xl border border-[#dce3da] bg-white px-4"
              >
                <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">
                  {grupo}
                </summary>
                <dl className="grid gap-3 border-t border-[#dce3da] py-3 text-sm sm:grid-cols-2">
                  {datos.map(({ clave, etiqueta, valor }) => (
                    <div key={clave} className="min-w-0">
                      <dt className="font-semibold">{etiqueta}</dt>
                      <dd className="wrap-anywhere whitespace-pre-line text-[#465a50]">
                        {valor}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            );
          })}
      </div>
    </div>
  );
}
