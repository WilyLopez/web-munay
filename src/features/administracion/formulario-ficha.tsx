"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
  useId,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  construirPrevia,
  erroresFicha,
  advertenciaUbicacion,
  resumirCambios,
} from "./datos-ficha";
import {
  limpiarFotosDestino,
  limpiarFotosAntiguasDestino,
} from "./ficha-operativa";
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
import { ResumenFicha } from "./resumen-ficha";
import { SubirFotoDestino } from "./subir-foto-destino";

export type FichaOperativa = Omit<
  FichaDestino["destino"],
  "totalResenas" | "tarifaGeneral" | "tarifaEstudiantes"
> & {
  tarifaGeneral: string | null;
  tarifaEstudiantes: string | null;
  estadoEditorial: EstadoFicha;
  actualizadoEn?: string;
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

const secciones = [
  ["identificacion", "Identificación"],
  ...gruposInformacion.map(([grupo]) => [grupo, grupo] as const),
] as const;
const ErroresFicha = createContext<Record<string, string>>({});

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
  const errores = useContext(ErroresFicha);
  const idCampo = useId();
  return (
    <div
      className={`grid content-start gap-1.5 text-sm font-semibold ${tipo === "area" ? "sm:col-span-2" : ""}`}
    >
      <label htmlFor={idCampo}>{etiqueta}</label>
      {errores[nombre] && (
        <span
          id={`${idCampo}-error`}
          className="text-sm font-normal text-rose-800"
        >
          {errores[nombre]}
        </span>
      )}
      {opciones ? (
        <select
          id={idCampo}
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          required={requerido}
          aria-invalid={!!errores[nombre]}
          aria-describedby={errores[nombre] ? `${idCampo}-error` : undefined}
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
          id={idCampo}
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          rows={4}
          maxLength={maximo}
          minLength={minimo}
          required={requerido}
          aria-invalid={!!errores[nombre]}
          aria-describedby={errores[nombre] ? `${idCampo}-error` : undefined}
        />
      ) : (
        <input
          id={idCampo}
          className={claseCampo}
          name={nombre}
          defaultValue={valor ?? ""}
          type={
            tipo === "whatsapp"
              ? "tel"
              : tipo === "latitud" || tipo === "longitud"
                ? "number"
                : tipo
          }
          inputMode={
            tipo === "whatsapp"
              ? "tel"
              : tipo === "number" || tipo === "latitud" || tipo === "longitud"
                ? "decimal"
                : undefined
          }
          autoComplete="off"
          maxLength={tipo === "number" ? undefined : maximo}
          minLength={tipo === "text" ? minimo : undefined}
          min={
            tipo === "latitud"
              ? -90
              : tipo === "longitud"
                ? -180
                : tipo === "number"
                  ? minimo
                  : undefined
          }
          max={
            tipo === "latitud"
              ? 90
              : tipo === "longitud"
                ? 180
                : tipo === "number"
                  ? maximo
                  : undefined
          }
          step={
            tipo === "latitud" || tipo === "longitud"
              ? "any"
              : tipo === "number"
                ? decimales
                  ? "0.01"
                  : 1
                : undefined
          }
          required={requerido}
          aria-invalid={!!errores[nombre]}
          aria-describedby={errores[nombre] ? `${idCampo}-error` : undefined}
        />
      )}
    </div>
  );
}

type PropiedadesEditor = {
  editorId?: string;
  ficha: FichaOperativa;
  slug: string;
  soloLectura?: boolean;
  porSecciones?: boolean;
  alCancelar?: () => void;
  alGuardar?: (mensaje: string) => void;
};

export function FormularioFicha(props: PropiedadesEditor) {
  const [borrador, cambiarBorrador] = useState<FichaOperativa>();
  const [recuperada, cambiarRecuperada] = useState<FichaOperativa>();
  const clave = `munay-ficha:${props.editorId ?? "sesion"}:${props.ficha.id}`;
  useEffect(() => {
    const tarea = setTimeout(() => {
      try {
        const guardado = sessionStorage.getItem(clave);
        if (guardado && !props.soloLectura) {
          const datos = JSON.parse(guardado);
          if (
            datos?.id === props.ficha.id &&
            typeof datos.nombre === "string" &&
            Array.isArray(datos.fotosAdicionales) &&
            Array.isArray(datos.diasAtencion) &&
            (!datos.informacion?.galeria ||
              Array.isArray(datos.informacion.galeria))
          )
            cambiarBorrador(datos);
        }
      } catch {
        cambiarBorrador(undefined);
      }
    }, 0);
    return () => clearTimeout(tarea);
  }, [clave, props.ficha.id, props.soloLectura]);
  return (
    <>
      {borrador && (
        <section
          className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"
          role="status"
        >
          <p>
            Hay un borrador de esta pestaña sin guardar.{" "}
            {borrador.actualizadoEn !== props.ficha.actualizadoEn
              ? "La ficha fue actualizada después: revisa los datos actuales antes de recuperar tus cambios."
              : "Puedes recuperarlo y revisar los cambios antes de guardar."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={boton}
              onClick={() => {
                cambiarRecuperada({
                  ...borrador,
                  actualizadoEn: props.ficha.actualizadoEn,
                });
                cambiarBorrador(undefined);
              }}
            >
              Recuperar borrador
            </button>
            <button
              type="button"
              className={boton}
              onClick={async () => {
                try {
                  const fotos = JSON.parse(
                    sessionStorage.getItem(`${clave}:fotos`) || "[]",
                  );
                  sessionStorage.removeItem(clave);
                  const resultado = await limpiarFotosDestino(
                    props.slug,
                    fotos,
                  ).catch(() => ({ error: true }));
                  if (!resultado.error)
                    sessionStorage.removeItem(`${clave}:fotos`);
                } catch {
                } finally {
                  cambiarBorrador(undefined);
                }
              }}
            >
              Descartar borrador
            </button>
          </div>
        </section>
      )}
      <EditorFicha
        key={recuperada ? "recuperada" : props.ficha.actualizadoEn}
        {...props}
        ficha={recuperada ?? props.ficha}
        fichaGuardada={props.ficha}
        claveBorrador={clave}
      />
    </>
  );
}

function EditorFicha({
  ficha,
  slug,
  soloLectura = false,
  porSecciones = false,
  alCancelar,
  alGuardar,
  fichaGuardada,
  claveBorrador,
}: {
  ficha: FichaOperativa;
  slug: string;
  soloLectura?: boolean;
  porSecciones?: boolean;
  alCancelar?: () => void;
  alGuardar?: (mensaje: string) => void;
  fichaGuardada: FichaOperativa;
  claveBorrador: string;
}) {
  const parametros = useSearchParams();
  const inicial = parametros.get("seccion");
  const [seccion, cambiarSeccion] = useState<string>(
    secciones.some(([id]) => id === inicial) ? inicial! : "identificacion",
  );
  const formularioRef = useRef<HTMLFormElement>(null);
  const [errores, cambiarErrores] = useState<Record<string, string>>({});
  function enfocarCampo(nombre: string) {
    let campo =
      formularioRef.current?.querySelector<HTMLElement>(
        `[name="${CSS.escape(nombre)}"]`,
      ) ?? null;
    const grupo =
      campo?.closest<HTMLElement>("[data-seccion]")?.dataset.seccion;
    if (grupo) seleccionarSeccion(grupo);
    if (campo instanceof HTMLInputElement && campo.type === "hidden")
      campo =
        campo.parentElement?.querySelector<HTMLElement>('input[type="file"]') ??
        campo;
    requestAnimationFrame(() => {
      campo?.focus();
      campo?.scrollIntoView({ block: "center" });
    });
  }
  const [modificada, cambiarModificada] = useState(false);
  const modificadaRef = useRef(false);
  const [avisoBorrador, cambiarAvisoBorrador] = useState("");
  const [instantanea, cambiarInstantanea] = useState(ficha);
  const [destinoSalida, cambiarDestinoSalida] = useState<string>();
  const salida = useRef<HTMLDialogElement>(null);
  const fotosNuevas = useRef<string[]>([]);
  const [quitada, cambiarQuitada] = useState<{
    id: number;
    foto: Partial<FotoDestino>;
    indice: number;
  }>();
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const conservarBorrador = useCallback(() => {
    if (
      !formularioRef.current ||
      formularioRef.current.querySelector("fieldset:disabled")
    )
      return;
    const actual = construirPrevia(ficha, new FormData(formularioRef.current));
    const tieneCambios = resumirCambios(fichaGuardada, actual).length > 0;
    modificadaRef.current = tieneCambios;
    cambiarModificada(tieneCambios);
    cambiarInstantanea(actual);
    try {
      if (!tieneCambios) {
        sessionStorage.removeItem(claveBorrador);
        cambiarAvisoBorrador("");
        return;
      }
      sessionStorage.setItem(claveBorrador, JSON.stringify(actual));
      cambiarAvisoBorrador(
        "Borrador conservado en esta pestaña. Aún no está publicado.",
      );
    } catch {
      cambiarAvisoBorrador(
        "No se pudo conservar el borrador. Guarda tus cambios antes de salir.",
      );
    }
  }, [
    ficha,
    fichaGuardada,
    claveBorrador,
    cambiarModificada,
    cambiarInstantanea,
    cambiarAvisoBorrador,
  ]);
  function registrarFoto(url: string) {
    fotosNuevas.current.push(url);
    try {
      sessionStorage.setItem(
        `${claveBorrador}:fotos`,
        JSON.stringify(fotosNuevas.current),
      );
    } catch {}
    registrarCambio();
  }
  const limpiarSubidas = useCallback(async () => {
    const resultado = await limpiarFotosDestino(
      slug,
      [
        ...fotosNuevas.current,
        fichaGuardada.imagenUrl,
        ...fichaGuardada.fotosAdicionales,
      ].filter((url): url is string => !!url),
    ).catch(() => ({ error: true }));
    if (!resultado.error)
      try {
        sessionStorage.removeItem(`${claveBorrador}:fotos`);
      } catch {}
    return resultado;
  }, [slug, fichaGuardada, claveBorrador]);
  function seleccionarSeccion(id: string) {
    cambiarSeccion(id);
    const url = new URL(location.href);
    url.searchParams.set("seccion", id);
    history.replaceState(history.state, "", url);
  }
  const registrarCambio = useCallback(() => {
    modificadaRef.current = true;
    cambiarModificada(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(conservarBorrador, 400);
  }, [conservarBorrador, cambiarModificada]);
  useEffect(() => {
    function antesSalir(evento: BeforeUnloadEvent) {
      if (modificadaRef.current) {
        conservarBorrador();
        if (!modificadaRef.current) return;
        evento.preventDefault();
        evento.returnValue = "";
      }
    }
    function seguirEnlace(evento: MouseEvent) {
      const enlace = (evento.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !modificadaRef.current ||
        !enlace ||
        enlace.target === "_blank" ||
        enlace.hasAttribute("download") ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey ||
        evento.button !== 0 ||
        enlace.href === location.href
      )
        return;
      conservarBorrador();
      if (!modificadaRef.current) return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
      cambiarDestinoSalida(enlace.href);
      salida.current?.showModal();
    }
    function navegar(evento: Event) {
      const transicion = evento as Event & {
        canIntercept?: boolean;
        hashChange?: boolean;
        destination?: { url: string };
        navigationType?: string;
      };
      if (
        !modificadaRef.current ||
        !transicion.canIntercept ||
        transicion.hashChange ||
        transicion.navigationType !== "traverse"
      )
        return;
      conservarBorrador();
      evento.preventDefault();
      cambiarDestinoSalida(transicion.destination?.url);
      salida.current?.showModal();
    }
    const navegacion = (window as unknown as { navigation?: EventTarget })
      .navigation;
    window.addEventListener("beforeunload", antesSalir);
    document.addEventListener("click", seguirEnlace, true);
    navegacion?.addEventListener("navigate", navegar);
    return () => {
      window.removeEventListener("beforeunload", antesSalir);
      document.removeEventListener("click", seguirEnlace, true);
      navegacion?.removeEventListener("navigate", navegar);
      clearTimeout(temporizador.current);
    };
  }, [conservarBorrador]);
  useEffect(() => {
    const tarea = setTimeout(() => {
      if (soloLectura) return;
      try {
        const guardadas = JSON.parse(
          sessionStorage.getItem(`${claveBorrador}:fotos`) || "[]",
        );
        fotosNuevas.current = Array.isArray(guardadas)
          ? guardadas
              .filter((url): url is string => typeof url === "string")
              .slice(-50)
          : [];
      } catch {
        fotosNuevas.current = [];
      }
      void limpiarFotosAntiguasDestino(slug, fotosNuevas.current).catch(() => ({
        error: true,
      }));
      if (ficha !== fichaGuardada) registrarCambio();
      else
        try {
          if (
            fotosNuevas.current.length &&
            !sessionStorage.getItem(claveBorrador)
          )
            void limpiarSubidas();
        } catch {}
    }, 0);
    return () => clearTimeout(tarea);
  }, [
    claveBorrador,
    ficha,
    fichaGuardada,
    registrarCambio,
    limpiarSubidas,
    slug,
    soloLectura,
  ]);
  const [previa, cambiarPrevia] = useState<FichaOperativa>();
  const [descartar, cambiarDescartar] = useState(false);
  const siguienteFoto = useRef(12);
  const [fotos, cambiarFotos] = useState(() =>
    (
      ficha.informacion?.galeria ??
      ficha.fotosAdicionales?.map((url) => ({ url })) ??
      []
    ).map((foto, id) => ({ id, foto: foto as Partial<FotoDestino> })),
  );
  const [confirmacion, cambiarConfirmacion] = useState<FormData>();
  const aviso = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirmacion || descartar) aviso.current?.focus();
  }, [confirmacion, descartar]);
  const [subidas, cambiarSubidas] = useState(0);
  const cambiarOcupacion = (variacion: number) => {
    cambiarSubidas((actual) => actual + variacion);
    if (variacion <= 0) registrarCambio();
  };
  const [estado, guardar, pendiente] = useActionState(
    async (anterior: { mensaje: string; error: boolean }, datos: FormData) => {
      const resultado = await guardarFichaOperativa(slug, anterior, datos);
      if (resultado.error && resultado.campos) {
        cambiarErrores(resultado.campos);
        const nombre = Object.keys(resultado.campos)[0];
        enfocarCampo(nombre);
      }
      if (!resultado.error) {
        modificadaRef.current = false;
        cambiarModificada(false);
        clearTimeout(temporizador.current);
        try {
          sessionStorage.removeItem(claveBorrador);
        } catch {}
        await limpiarSubidas();
        alGuardar?.(resultado.mensaje);
      }
      return resultado;
    },
    { mensaje: "", error: false },
  );
  const bloqueada =
    soloLectura ||
    ficha.estadoEditorial === "en_revision" ||
    ficha.estadoEditorial === "archivada";
  const informacion = ficha.informacion ?? {};
  const Grupo = porSecciones ? "section" : "details";

  function verPrevia(formulario: HTMLFormElement) {
    cambiarPrevia(construirPrevia(ficha, new FormData(formulario)));
  }
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
    registrarCambio();
  };

  return (
    <ErroresFicha.Provider value={errores}>
      <form
        ref={formularioRef}
        onChange={registrarCambio}
        className="min-w-0 space-y-5"
        noValidate={porSecciones}
        onSubmit={(evento) => {
          evento.preventDefault();
          if (
            subidas ||
            pendiente ||
            bloqueada ||
            previa ||
            confirmacion ||
            descartar
          )
            return;
          const invalido = evento.currentTarget.querySelector<HTMLInputElement>(
            "input:invalid, select:invalid, textarea:invalid",
          );
          if (invalido) {
            const grupo =
              invalido.closest<HTMLElement>("[data-seccion]")?.dataset.seccion;
            if (grupo) cambiarSeccion(grupo);
            requestAnimationFrame(() => invalido.reportValidity());
            return;
          }
          const datos = new FormData(
            evento.currentTarget,
            (evento.nativeEvent as SubmitEvent).submitter,
          );
          const encontrados = erroresFicha(
            datos,
            datos.get("decision") === "revision" ||
              ficha.estadoEditorial === "publicada",
          );
          if (datos.getAll("foto-url").some((url) => !String(url).trim()))
            encontrados["foto-url"] =
              "Sube una imagen para cada foto de la galería o retira las filas vacías.";
          cambiarErrores(encontrados);
          if (Object.keys(encontrados).length) {
            const nombre = Object.keys(encontrados)[0];
            enfocarCampo(nombre);
            return;
          }
          conservarBorrador();
          cambiarConfirmacion(
            new FormData(
              evento.currentTarget,
              (evento.nativeEvent as SubmitEvent).submitter,
            ),
          );
        }}
      >
        <input
          type="hidden"
          name="version"
          value={fichaGuardada.actualizadoEn ?? ""}
        />
        <p role="status" className="text-sm text-[#465a50]">
          {modificada
            ? avisoBorrador || "Hay cambios sin guardar."
            : "Estás editando la ficha guardada."}
        </p>
        {advertenciaUbicacion(instantanea) && (
          <p
            role="status"
            className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
          >
            {advertenciaUbicacion(instantanea)}
          </p>
        )}
        {!!Object.keys(errores).length && (
          <div role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-900">
            Revisa los campos señalados antes de continuar.{" "}
            {errores["foto-url"]}
          </div>
        )}
        <dialog
          ref={salida}
          aria-labelledby="titulo-salida"
          className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg space-y-4 rounded-2xl p-6 text-[#173b32] backdrop:bg-black/45"
        >
          <h2 id="titulo-salida" className="font-serif text-2xl">
            Tienes cambios sin guardar
          </h2>
          <p>
            El borrador queda en esta pestaña para que puedas recuperarlo al
            volver. Los visitantes seguirán viendo la ficha guardada.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={boton}
              onClick={() => salida.current?.close()}
            >
              Seguir editando
            </button>
            <button
              type="button"
              className={boton}
              onClick={() => {
                modificadaRef.current = false;
                salida.current?.close();
                if (destinoSalida) location.assign(destinoSalida);
              }}
            >
              Salir y conservar borrador
            </button>
          </div>
        </dialog>
        {!porSecciones && (
          <p className="w-fit rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold">
            {estadosFicha[ficha.estadoEditorial] ?? estadosFicha.publicada}
          </p>
        )}
        {bloqueada && !soloLectura && (
          <p className="text-sm">
            El equipo de Munay debe devolver la ficha a borrador para continuar
            editándola.
          </p>
        )}
        {previa && (
          <section
            className="space-y-4"
            aria-label="Vista previa de los cambios"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-50 p-3">
              <p role="status" className="text-sm font-semibold">
                Vista previa de los cambios sin guardar
              </p>
              <button
                type="button"
                className={boton}
                onClick={() => cambiarPrevia(undefined)}
              >
                Volver a editar
              </button>
            </div>
            <ResumenFicha ficha={previa} previa />
          </section>
        )}
        {descartar && (
          <div
            role="group"
            aria-label="Descartar edición"
            ref={aviso}
            tabIndex={-1}
            className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <p>Si sales de la edición, se perderán los cambios sin guardar.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={boton}
                onClick={() => cambiarDescartar(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className={boton}
                onClick={async () => {
                  modificadaRef.current = false;
                  clearTimeout(temporizador.current);
                  try {
                    sessionStorage.removeItem(claveBorrador);
                  } catch {}
                  await limpiarSubidas();
                  alCancelar?.();
                }}
              >
                Descartar cambios
              </button>
            </div>
          </div>
        )}
        {confirmacion && (
          <div
            role="group"
            aria-label="Confirmar cambios"
            ref={aviso}
            tabIndex={-1}
            className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <p>
              {confirmacion.get("decision") === "revision"
                ? "¿Quieres enviar el destino a revisión?"
                : "¿Quieres guardar los cambios del destino?"}
            </p>
            <p className="text-sm">
              Se guardarán los datos de las secciones editadas.{" "}
              {ficha.estadoEditorial === "publicada"
                ? "Los cambios serán visibles para los visitantes."
                : ""}
            </p>
            <ul className="max-h-44 list-inside list-disc overflow-auto text-sm">
              {resumirCambios(
                fichaGuardada,
                construirPrevia(ficha, confirmacion),
              ).map((etiqueta) => (
                <li key={etiqueta}>{etiqueta}</li>
              ))}
            </ul>
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
        <fieldset
          hidden={!!previa}
          disabled={pendiente || bloqueada || !!confirmacion || descartar}
          className={
            porSecciones
              ? "min-w-0 gap-4 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)]"
              : "space-y-4"
          }
        >
          {!bloqueada && (
            <div
              className={
                porSecciones
                  ? "sticky top-2 z-10 mb-4 flex flex-wrap gap-2 rounded-xl border border-[#dce3da] bg-white p-3 lg:col-span-2 lg:mb-0"
                  : "flex flex-wrap gap-3"
              }
            >
              <button
                name="decision"
                value="guardar"
                className={
                  porSecciones
                    ? "min-h-11 rounded-xl bg-[#174238] px-4 text-sm font-semibold text-white hover:bg-[#23574a]"
                    : boton
                }
                disabled={subidas > 0}
              >
                Guardar cambios
              </button>
              {porSecciones && (
                <>
                  <button
                    type="button"
                    className={boton}
                    disabled={subidas > 0}
                    onClick={(evento) => {
                      if (evento.currentTarget.form)
                        verPrevia(evento.currentTarget.form);
                    }}
                  >
                    Vista previa
                  </button>
                  <button
                    type="button"
                    className={boton}
                    disabled={subidas > 0}
                    onClick={() => cambiarDescartar(true)}
                  >
                    Cancelar edición
                  </button>
                </>
              )}
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
          {porSecciones && (
            <nav
              aria-label="Secciones de edición"
              className="mb-4 flex flex-wrap gap-2 self-start lg:mb-0 lg:grid"
            >
              {secciones.map(([id, etiqueta]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={seccion === id}
                  className="min-h-11 rounded-lg border border-teal-900/15 px-3 text-left text-sm font-semibold hover:bg-teal-50 aria-pressed:bg-[#174238] aria-pressed:text-white"
                  onClick={() => seleccionarSeccion(id)}
                >
                  {etiqueta}
                  <span className="mt-1 block text-xs font-normal">
                    {id === "identificacion"
                      ? [
                          instantanea.nombre,
                          instantanea.descripcion,
                          instantanea.ubicacion,
                        ].every(Boolean)
                        ? "Completa"
                        : "Necesita atención"
                      : gruposInformacion
                            .find(([grupo]) => grupo === id)?.[1]
                            .some(([clave]) => errores[clave])
                        ? "Necesita atención"
                        : gruposInformacion
                              .find(([grupo]) => grupo === id)?.[1]
                              .some(
                                ([clave]) => instantanea.informacion?.[clave],
                              )
                          ? "Con información"
                          : "Opcional"}
                  </span>
                </button>
              ))}
            </nav>
          )}
          <div className="min-w-0 space-y-4">
            <section
              data-seccion="identificacion"
              hidden={porSecciones && seccion !== "identificacion"}
              className="space-y-4 rounded-2xl border border-teal-900/15 bg-white p-4 sm:p-6"
            >
              <h2 className="font-serif text-2xl">
                Identificación y ubicación
              </h2>
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
                  mapaActivo={
                    !previa && (!porSecciones || seccion === "identificacion")
                  }
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
              <Grupo
                key={grupo}
                data-seccion={grupo}
                hidden={porSecciones && seccion !== grupo}
                className="rounded-2xl border border-teal-900/15 bg-white p-5 open:space-y-4"
                open={porSecciones ? undefined : true}
              >
                {porSecciones ? (
                  <h2 className="mb-4 font-serif text-2xl">{grupo}</h2>
                ) : (
                  <summary className="cursor-pointer font-serif text-2xl">
                    {grupo}
                  </summary>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {grupo === "Fotos y video" && (
                    <SubirFotoDestino
                      destinoId={ficha.id}
                      nombre="imagenUrl"
                      etiqueta="Foto de portada"
                      valor={ficha.imagenUrl}
                      cambiarOcupacion={cambiarOcupacion}
                      alSubir={registrarFoto}
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
                              defaultChecked={ficha.diasAtencion?.includes(
                                indice,
                              )}
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
                      tipo={
                        tipo === "lista" || tipo === "enlaces" ? "area" : tipo
                      }
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
                          alSubir={registrarFoto}
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
                            disabled={
                              subidas > 0 || indice === fotos.length - 1
                            }
                            onClick={() => ordenarFoto(indice, 1)}
                          >
                            Mover abajo
                          </button>
                          <button
                            className={boton}
                            type="button"
                            disabled={subidas > 0}
                            onClick={(evento) => {
                              const fila =
                                evento.currentTarget.closest("fieldset");
                              const captura = Object.fromEntries(
                                [
                                  "url",
                                  "alt",
                                  "descripcion",
                                  "autor",
                                  "licencia",
                                ].map((clave) => [
                                  clave,
                                  fila?.querySelector<HTMLInputElement>(
                                    `[name="foto-${clave}"]`,
                                  )?.value ?? "",
                                ]),
                              );
                              cambiarQuitada({ id, foto: captura, indice });
                              cambiarFotos((actuales) =>
                                actuales.filter((item) => item.id !== id),
                              );
                              registrarCambio();
                            }}
                          >
                            Quitar foto
                          </button>
                        </div>
                      </fieldset>
                    ))}
                    {quitada && (
                      <p role="status" className="text-sm">
                        Foto retirada de la ficha.{" "}
                        <button
                          type="button"
                          className="font-semibold underline"
                          onClick={() => {
                            cambiarFotos((actuales) => {
                              const copia = [...actuales];
                              copia.splice(quitada.indice, 0, {
                                id: quitada.id,
                                foto: quitada.foto,
                              });
                              return copia;
                            });
                            cambiarQuitada(undefined);
                            registrarCambio();
                          }}
                        >
                          Deshacer
                        </button>
                      </p>
                    )}
                    <button
                      type="button"
                      className={boton}
                      disabled={fotos.length >= 12}
                      onClick={() => {
                        const id = siguienteFoto.current++;
                        cambiarFotos((actuales) => [
                          ...actuales,
                          { id, foto: {} },
                        ]);
                        registrarCambio();
                      }}
                    >
                      Agregar foto
                    </button>
                  </div>
                )}
              </Grupo>
            ))}
          </div>
        </fieldset>
        {pendiente && <p role="status">Guardando…</p>}
        {estado.mensaje && (
          <p
            role={estado.error ? "alert" : "status"}
            className={estado.error ? "text-rose-900" : "text-green-900"}
          >
            {estado.mensaje}
          </p>
        )}
        {"conflicto" in estado && estado.conflicto && (
          <button
            type="button"
            className={boton}
            onClick={() => {
              conservarBorrador();
              modificadaRef.current = false;
              location.reload();
            }}
          >
            Conservar borrador y recargar
          </button>
        )}
      </form>
    </ErroresFicha.Provider>
  );
}
