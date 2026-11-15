"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import {
  categorias,
  provincias,
  type FichaDestino,
} from "@/features/destinos/catalogo";
import { SelectorUbicacion } from "@/features/destinos/selector-ubicacion";
import {
  estadosFicha,
  gruposInformacion,
  opcionesInformacion,
  type EstadoFicha,
  type FotoDestino,
} from "@/features/destinos/informacion";
import { guardarFichaOperativa } from "./ficha-operativa";
import { SubirFotoDestino } from "./subir-foto-destino";

export type FichaOperativa = Omit<
  FichaDestino["destino"],
  "totalResenas" | "tarifaGeneral" | "tarifaEstudiantes"
> & {
  tarifaGeneral: string | null;
  tarifaEstudiantes: string | null;
  estadoEditorial: EstadoFicha;
};

const claseCampo =
  "min-w-0 rounded-xl border border-teal-900/20 bg-white px-3 py-2 font-normal focus:outline-2 focus:outline-teal-800";
const boton =
  "rounded-xl border border-teal-900/20 px-4 py-2.5 text-sm font-semibold hover:bg-teal-50 disabled:opacity-60";
const dias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const propiedadesFoto = [
  ["alt", "Texto alternativo", 180],
  ["descripcion", "Descripción", 240],
  ["autor", "Autor", 120],
  ["licencia", "Licencia", 120],
] as const;

function Campo({
  nombre,
  etiqueta,
  valor,
  tipo = "text",
  maximo,
  minimo,
  requerido = false,
  opciones,
  decimales = false,
}: {
  nombre: string;
  etiqueta: string;
  valor?: string | number | null;
  tipo?: string;
  maximo?: number;
  minimo?: number;
  requerido?: boolean;
  opciones?: ReadonlyArray<readonly [string, string]>;
  decimales?: boolean;
}) {
  return (
    <label
      className={`grid content-start gap-1.5 text-sm font-semibold ${tipo === "area" ? "sm:col-span-2" : ""}`}
    >
      {etiqueta}
      {opciones ? (
        <select
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          required={requerido}
        >
          <option value="">
            {requerido ? "Selecciona una opción" : "Sin confirmar"}
          </option>
          {opciones.map(([id, texto]) => (
            <option key={id} value={id}>
              {texto}
            </option>
          ))}
        </select>
      ) : tipo === "area" ? (
        <textarea
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          rows={4}
          maxLength={maximo}
          minLength={minimo}
          required={requerido}
        />
      ) : (
        <input
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          type={tipo}
          maxLength={tipo === "number" ? undefined : maximo}
          minLength={tipo === "text" ? minimo : undefined}
          min={tipo === "number" ? minimo : undefined}
          max={tipo === "number" ? maximo : undefined}
          step={tipo === "number" ? (decimales ? "any" : 1) : undefined}
          required={requerido}
        />
      )}
    </label>
  );
}

export function FormularioFicha({
  ficha,
  slug,
  soloLectura = false,
}: {
  ficha: FichaOperativa;
  slug: string;
  soloLectura?: boolean;
}) {
  const siguienteFoto = useRef(12);
  const [fotos, cambiarFotos] = useState(() =>
    (
      ficha.informacion?.galeria ??
      ficha.fotosAdicionales?.map((url) => ({ url })) ??
      []
    ).map((foto, id) => ({ id, foto: foto as Partial<FotoDestino> })),
  );
  const [confirmacion, cambiarConfirmacion] = useState<FormData>();
  const [subidas, cambiarSubidas] = useState(0);
  const cambiarOcupacion = (variacion: number) =>
    cambiarSubidas((actual) => actual + variacion);
  const [estado, guardar, pendiente] = useActionState(
    guardarFichaOperativa.bind(null, slug),
    { mensaje: "", error: false },
  );
  const bloqueada =
    soloLectura ||
    ficha.estadoEditorial === "en_revision" ||
    ficha.estadoEditorial === "archivada";
  const informacion = ficha.informacion ?? {};
  const ordenarFoto = (indice: number, desplazamiento: number) => {
    cambiarFotos((actuales) => {
      const proximo = indice + desplazamiento;
      const ordenadas = [...actuales];
      [ordenadas[indice], ordenadas[proximo]] = [
        ordenadas[proximo],
        ordenadas[indice],
      ];
      return ordenadas;
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (subidas || pendiente || bloqueada) return;
        cambiarConfirmacion(
          new FormData(
            evento.currentTarget,
            (evento.nativeEvent as SubmitEvent).submitter,
          ),
        );
      }}
    >
      <p className="w-fit rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold">
        {estadosFicha[ficha.estadoEditorial] ?? estadosFicha.publicada}
      </p>
      {bloqueada && !soloLectura && (
        <p className="text-sm">
          El equipo de Munay debe devolver la ficha a borrador para continuar
          editándola.
        </p>
      )}
      <fieldset
        disabled={pendiente || bloqueada || !!confirmacion}
        className="space-y-4"
      >
        <section className="space-y-4 rounded-2xl border border-teal-900/15 bg-white p-5">
          <h2 className="font-serif text-2xl">Identificación y ubicación</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              nombre="nombre"
              etiqueta="Nombre oficial"
              valor={ficha.nombre}
              minimo={3}
              maximo={120}
              requerido
            />
            <Campo
              nombre="ubicacion"
              etiqueta="Dirección o referencia"
              valor={ficha.ubicacion}
              minimo={4}
              maximo={180}
              requerido
            />
            <Campo
              nombre="categoria"
              etiqueta="Categoría"
              valor={ficha.categoria}
              opciones={Object.entries(categorias)}
              requerido
            />
            <Campo
              nombre="provincia"
              etiqueta="Provincia"
              valor={ficha.provincia}
              opciones={Object.entries(provincias)}
              requerido
            />
            <SelectorUbicacion
              coordenadas={ficha}
              soloLectura={bloqueada || pendiente || !!confirmacion}
            />
            <Campo
              nombre="descripcion"
              etiqueta="Descripción breve para el catálogo"
              valor={ficha.descripcion}
              tipo="area"
              minimo={20}
              maximo={1000}
              requerido
            />
          </div>
        </section>
        {gruposInformacion.map(([grupo, campos]) => (
          <details
            key={grupo}
            className="rounded-2xl border border-teal-900/15 bg-white p-5 open:space-y-4"
            open
          >
            <summary className="cursor-pointer font-serif text-2xl">
              {grupo}
            </summary>
            <div className="grid gap-4 sm:grid-cols-2">
              {grupo === "Fotos y video" && (
                <SubirFotoDestino
                  destinoId={ficha.id}
                  nombre="imagenUrl"
                  etiqueta="Foto de portada"
                  valor={ficha.imagenUrl}
                  cambiarOcupacion={cambiarOcupacion}
                />
              )}
              {grupo === "Información para la visita" && (
                <>
                  <Campo
                    nombre="horario"
                    etiqueta="Horario habitual"
                    valor={ficha.horario}
                    tipo="area"
                    maximo={240}
                  />
                  <div
                    className="flex flex-wrap gap-3 sm:col-span-2"
                    role="group"
                    aria-label="Días de atención"
                  >
                    {dias.map((dia, indice) => (
                      <label
                        key={dia}
                        className="rounded-lg border border-teal-900/15 px-3 py-2 text-sm"
                      >
                        <input
                          className="mr-2 accent-teal-900"
                          type="checkbox"
                          name="diasAtencion"
                          value={indice}
                          defaultChecked={ficha.diasAtencion?.includes(indice)}
                        />
                        {dia}
                      </label>
                    ))}
                  </div>
                  <Campo
                    nombre="tarifaGeneral"
                    etiqueta="Tarifa general (S/)"
                    valor={ficha.tarifaGeneral}
                    tipo="number"
                    minimo={0}
                    decimales
                  />
                  <Campo
                    nombre="tarifaEstudiantes"
                    etiqueta="Tarifa para estudiantes (S/)"
                    valor={ficha.tarifaEstudiantes}
                    tipo="number"
                    minimo={0}
                    decimales
                  />
                </>
              )}
              {grupo === "Cómo llegar" && (
                <>
                  <Campo
                    nombre="rutaDesdeChiclayo"
                    etiqueta="Ruta desde Chiclayo"
                    valor={ficha.rutaDesdeChiclayo}
                    tipo="area"
                    maximo={2000}
                  />
                  <Campo
                    nombre="distanciaKm"
                    etiqueta="Distancia (km)"
                    valor={ficha.distanciaKm}
                    tipo="number"
                    minimo={0}
                  />
                  <Campo
                    nombre="duracionMinutos"
                    etiqueta="Duración del trayecto (min)"
                    valor={ficha.duracionMinutos}
                    tipo="number"
                    minimo={0}
                  />
                  <Campo
                    nombre="fuenteRutaUrl"
                    etiqueta="Fuente del trayecto"
                    valor={ficha.fuenteRutaUrl}
                    tipo="url"
                    maximo={500}
                  />
                  <Campo
                    nombre="recomendacion"
                    etiqueta="Recomendaciones"
                    valor={ficha.recomendacion}
                    tipo="area"
                    maximo={1500}
                  />
                </>
              )}
              {campos.map(([clave, etiqueta, maximo, tipo]) => (
                <Campo
                  key={clave}
                  nombre={clave}
                  etiqueta={etiqueta}
                  valor={informacion[clave]}
                  maximo={maximo}
                  tipo={tipo === "lista" || tipo === "enlaces" ? "area" : tipo}
                  opciones={
                    tipo && tipo in opcionesInformacion
                      ? opcionesInformacion[
                          tipo as keyof typeof opcionesInformacion
                        ]
                      : undefined
                  }
                />
              ))}
            </div>
            {grupo === "Fotos y video" && (
              <div className="space-y-3">
                <h3 className="font-semibold">Galería</h3>
                <p className="text-sm text-stone-600">
                  Las fotos aparecen en el orden de esta lista.
                </p>
                {fotos.map(({ id, foto }, indice) => (
                  <fieldset
                    key={id}
                    className="grid gap-3 rounded-xl border border-teal-900/15 p-3 sm:grid-cols-2"
                  >
                    <legend className="px-2 text-sm font-semibold">
                      Foto {indice + 1}
                    </legend>
                    <SubirFotoDestino
                      destinoId={ficha.id}
                      nombre="foto-url"
                      etiqueta="Imagen de galería"
                      valor={foto.url}
                      cambiarOcupacion={cambiarOcupacion}
                      requerido
                    />
                    {propiedadesFoto.map(([clave, etiqueta, maximo]) => (
                      <Campo
                        key={clave}
                        nombre={`foto-${clave}`}
                        etiqueta={etiqueta}
                        valor={foto[clave]}
                        maximo={maximo}
                      />
                    ))}
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        className={boton}
                        type="button"
                        disabled={subidas > 0 || indice === 0}
                        onClick={() => ordenarFoto(indice, -1)}
                      >
                        Mover arriba
                      </button>
                      <button
                        className={boton}
                        type="button"
                        disabled={subidas > 0 || indice === fotos.length - 1}
                        onClick={() => ordenarFoto(indice, 1)}
                      >
                        Mover abajo
                      </button>
                      <button
                        className={boton}
                        type="button"
                        disabled={subidas > 0}
                        onClick={() =>
                          cambiarFotos((actuales) =>
                            actuales.filter((item) => item.id !== id),
                          )
                        }
                      >
                        Quitar foto
                      </button>
                    </div>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className={boton}
                  disabled={fotos.length >= 12}
                  onClick={() => {
                    const id = siguienteFoto.current++;
                    cambiarFotos((actuales) => [...actuales, { id, foto: {} }]);
                  }}
                >
                  Agregar foto
                </button>
              </div>
            )}
          </details>
        ))}
        {!bloqueada && (
          <div className="flex flex-wrap gap-3">
            <button
              name="decision"
              value="guardar"
              className={boton}
              disabled={subidas > 0}
            >
              Guardar cambios
            </button>
            {ficha.estadoEditorial === "borrador" && (
              <button
                name="decision"
                value="revision"
                disabled={subidas > 0}
                className="rounded-xl bg-teal-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Enviar a revisión
              </button>
            )}
          </div>
        )}
      </fieldset>
      {confirmacion && (
        <div
          role="group"
          aria-label="Confirmar cambios"
          className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <p>
            {confirmacion.get("decision") === "revision"
              ? "¿Quieres enviar el destino a revisión?"
              : "¿Quieres guardar los cambios del destino?"}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className={boton}
              onClick={() => cambiarConfirmacion(undefined)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={boton}
              onClick={() => {
                cambiarConfirmacion(undefined);
                startTransition(() => guardar(confirmacion));
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
      {pendiente && <p role="status">Guardando…</p>}
      {estado.mensaje && (
        <p
          role={estado.error ? "alert" : "status"}
          className={estado.error ? "text-rose-900" : "text-green-900"}
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
