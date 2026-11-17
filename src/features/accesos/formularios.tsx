"use client";

import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { SelectorUbicacion } from "@/features/destinos/selector-ubicacion";
import { categorias, provincias } from "@/features/destinos/catalogo";
import {
  aceptarInvitacion,
  activarCuentaInvitada,
  consultarDetalleInvitacion,
  enviarInvitacion,
  enviarSolicitud,
  resolverAcceso,
} from "./acciones";
import {
  campo,
  mensajeInvitacionNoDisponible,
  principal,
  secundario,
  type AccesoEncargado,
  type DetalleInvitacion,
  type OpcionDestino,
} from "./tipos";

const inicial = { mensaje: "", ok: false };
const claveInvitacion = "munay-invitacion-encargado";

function leerInvitacion() {
  if (typeof window === "undefined") return "";
  const fragmento = window.location.hash.slice(1);
  try {
    if (fragmento) {
      sessionStorage.setItem(claveInvitacion, fragmento);
    }
    return fragmento || sessionStorage.getItem(claveInvitacion) || "";
  } catch {
    return fragmento;
  }
}

function observarInvitacion(actualizar: () => void) {
  window.addEventListener("hashchange", actualizar);
  return () => window.removeEventListener("hashchange", actualizar);
}

function enviarFormulario(
  evento: FormEvent<HTMLFormElement>,
  accion: (datos: FormData) => void,
) {
  evento.preventDefault();
  const datos = new FormData(evento.currentTarget);
  startTransition(() => accion(datos));
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-[#173b32]">
      {etiqueta}
      {children}
    </label>
  );
}

function Mensaje({ estado }: { estado: typeof inicial }) {
  return estado.mensaje ? (
    <p
      role={estado.ok ? "status" : "alert"}
      className={`rounded-xl border p-3 text-sm ${estado.ok ? "border-green-200 bg-green-50 text-green-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}
    >
      {estado.mensaje}
    </p>
  ) : null;
}

function IconoOjo({ tachado }: { tachado?: boolean }) {
  return tachado ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SelectorDestino({ destinos }: { destinos: OpcionDestino[] }) {
  return (
    <Campo etiqueta="Atractivo">
      <select name="destinoId" required defaultValue="" className={campo}>
        <option value="" disabled>
          Selecciona un atractivo
        </option>
        {destinos.map(({ id, nombre }) => (
          <option key={id} value={id}>
            {nombre}
          </option>
        ))}
      </select>
    </Campo>
  );
}

function DatosBasicosDestino({
  incluirDistrito = false,
}: {
  incluirDistrito?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <Campo etiqueta="Nombre del atractivo">
        <input
          name="nombre"
          className={campo}
          minLength={3}
          maxLength={120}
          placeholder="Ej. Huaca Ventarrón"
          required
        />
      </Campo>
      <Campo etiqueta="Ubicación o dirección">
        <input
          name="ubicacion"
          className={campo}
          minLength={4}
          maxLength={180}
          placeholder="Ej. A 4 km al sureste de Pomalca"
          required
        />
      </Campo>
      {incluirDistrito && (
        <Campo etiqueta="Distrito">
          <input
            name="distrito"
            className={campo}
            minLength={2}
            maxLength={100}
            placeholder="Ej. Pomalca"
            required
          />
        </Campo>
      )}
      <Campo etiqueta="Provincia">
        <select name="provincia" className={campo} required defaultValue="">
          <option value="" disabled>
            Selecciona una provincia
          </option>
          {Object.entries(provincias).map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Tipo de experiencia">
        <select name="categoria" className={campo} required defaultValue="">
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {Object.entries(categorias).map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
    </div>
  );
}

function DescripcionDestino() {
  return (
    <Campo etiqueta="Descripción pública inicial">
      <textarea
        name="descripcion"
        rows={4}
        minLength={20}
        maxLength={1000}
        placeholder="Cuenta qué puede descubrir el visitante…"
        className={campo}
        required
      />
    </Campo>
  );
}

function DatosNuevoDestino() {
  return (
    <div className="space-y-4 rounded-2xl border border-[#dce3da] bg-[#fbfcfb] p-4">
      <DatosBasicosDestino />
      <SelectorUbicacion />
      <DescripcionDestino />
    </div>
  );
}

function FormularioPorPasos({
  nuevo,
  cuenta,
  pendiente,
  etiqueta,
  enviar,
  children,
}: {
  nuevo: boolean;
  cuenta?: ReactNode;
  pendiente: boolean;
  etiqueta: string;
  enviar: (evento: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
}) {
  const [paso, cambiarPaso] = useState(0);
  const formulario = useRef<HTMLFormElement>(null);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const nombres = [
    ...(cuenta ? ["Cuenta"] : []),
    ...(nuevo ? ["Datos del atractivo", "Ubicación", "Descripción"] : []),
  ];
  const ultimo = paso >= nombres.length - 1;

  function irA(indice: number) {
    cambiarPaso(indice);
    requestAnimationFrame(() => encabezado.current?.focus());
  }

  function continuar(evento: FormEvent<HTMLFormElement>) {
    const actual = formulario.current?.querySelector<HTMLFieldSetElement>(
      `fieldset[data-paso="${paso}"]`,
    );
    const campos = actual?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    const clave = actual?.querySelector<HTMLInputElement>('[name="contrasena"]');
    const confirmacion = actual?.querySelector<HTMLInputElement>(
      '[name="confirmarContrasena"]',
    );
    if (confirmacion) {
      confirmacion.setCustomValidity(
        confirmacion.value && confirmacion.value !== clave?.value
          ? "Las contraseñas no coinciden."
          : "",
      );
    }
    for (const control of campos ?? []) {
      if (!control.reportValidity()) {
        evento.preventDefault();
        return;
      }
    }
    if (ultimo) {
      enviar(evento);
    } else {
      evento.preventDefault();
      irA(paso + 1);
    }
  }

  const inicioDestino = cuenta ? 1 : 0;

  return (
    <form
      ref={formulario}
      noValidate
      onSubmit={continuar}
      className="min-w-0 space-y-4"
      aria-busy={pendiente}
    >
      {nombres.length > 1 && (
        <div className="space-y-3 border-b border-[#dce3da] pb-4">
          <ol aria-label="Progreso de la invitación" className="flex gap-1.5">
            {nombres.map((nombre, indice) => (
              <li
                key={nombre}
                aria-current={paso === indice ? "step" : undefined}
                className={`h-1.5 flex-1 rounded-full ${indice <= paso ? "bg-[#174238]" : "bg-[#dce3da]"}`}
              >
                <span className="sr-only">{nombre}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs font-semibold text-[#465a50]">
            Paso {paso + 1} de {nombres.length}
          </p>
          <h3
            ref={encabezado}
            tabIndex={-1}
            className="scroll-mt-4 font-serif text-xl font-semibold text-[#173b32] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {nombres[paso]}
          </h3>
        </div>
      )}
      {cuenta && (
        <fieldset data-paso={0} hidden={paso !== 0}>
          <div className="space-y-4">{cuenta}</div>
        </fieldset>
      )}
      {nuevo && (
        <>
          <fieldset data-paso={inicioDestino} hidden={paso !== inicioDestino}>
            <DatosBasicosDestino incluirDistrito />
          </fieldset>
          <fieldset
            data-paso={inicioDestino + 1}
            hidden={paso !== inicioDestino + 1}
          >
            <SelectorUbicacion mapaActivo={paso === inicioDestino + 1} />
          </fieldset>
          <fieldset
            data-paso={inicioDestino + 2}
            hidden={paso !== inicioDestino + 2}
          >
            <DescripcionDestino />
          </fieldset>
        </>
      )}
      {children}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
        {paso > 0 && (
          <button
            type="button"
            disabled={pendiente}
            className={secundario}
            onClick={() => irA(paso - 1)}
          >
            Atrás
          </button>
        )}
        <button type="submit" disabled={pendiente} className={principal}>
          {ultimo ? etiqueta : "Continuar"}
        </button>
      </div>
    </form>
  );
}

export function FormularioSolicitud({
  destinos,
}: {
  destinos: OpcionDestino[];
}) {
  const [nuevo, cambiarTipo] = useState(false);
  const [estado, accion, pendiente] = useActionState(enviarSolicitud, inicial);
  return (
    <form
      action={accion}
      onSubmit={(evento) => enviarFormulario(evento, accion)}
      className="space-y-5"
    >
      <fieldset className="space-y-2">
        <legend className="font-semibold text-[#173b32]">
          ¿Qué quieres gestionar?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["existente", "Un atractivo del catálogo"],
            ["nuevo", "Un atractivo nuevo"],
          ].map(([valor, etiqueta]) => (
            <label
              key={valor}
              className="flex items-center gap-2 rounded-xl border border-[#dce3da] p-3 text-sm font-semibold has-checked:border-[#174238] has-checked:bg-[#edf3ec]"
            >
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={nuevo === (valor === "nuevo")}
                onChange={() => cambiarTipo(valor === "nuevo")}
                className="accent-[#174238]"
              />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>
      {nuevo ? <DatosNuevoDestino /> : <SelectorDestino destinos={destinos} />}
      <Campo etiqueta="¿Cuál es tu vínculo con el atractivo?">
        <textarea
          name="motivo"
          rows={3}
          minLength={15}
          maxLength={500}
          className={campo}
          required
        />
      </Campo>
      <Campo etiqueta="Canal de contacto oficial del atractivo">
        <input
          name="contacto"
          placeholder="Sitio web, teléfono o correo institucional"
          minLength={5}
          maxLength={180}
          className={campo}
          required
        />
      </Campo>
      <p className="text-sm text-[#4d665b]">
        El equipo de Munay usará el motivo y el contacto para revisar tu
        solicitud.
      </p>
      <Mensaje estado={estado} />
      <button className={principal} disabled={pendiente}>
        {pendiente ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}

export function FormularioInvitacion({
  destinos,
}: {
  destinos: OpcionDestino[];
}) {
  const [estado, accion, pendiente] = useActionState<
    Awaited<ReturnType<typeof enviarInvitacion>>,
    FormData
  >(enviarInvitacion, inicial);
  const [copiado, cambiarCopia] = useState(false);
  const [nuevo, cambiarNuevo] = useState(destinos.length === 0);
  return (
    <form
      action={accion}
      onSubmit={(evento) => {
        cambiarCopia(false);
        enviarFormulario(evento, accion);
      }}
      className="space-y-4"
    >
      <Campo etiqueta="Correo del encargado">
        <input
          name="correo"
          type="email"
          required
          maxLength={254}
          className={campo}
        />
      </Campo>
      <Campo etiqueta="Tipo de invitación">
        <select
          className={campo}
          name="tipo"
          value={nuevo ? "nuevo" : "existente"}
          onChange={(evento) => cambiarNuevo(evento.target.value === "nuevo")}
        >
          <option value="existente" disabled={!destinos.length}>
            Gestionar un destino existente
          </option>
          <option value="nuevo">Registrar un destino nuevo</option>
        </select>
      </Campo>
      {nuevo ? (
        <p className="text-sm text-[#465a50]">
          El encargado completará los datos iniciales y recibirá el destino como
          borrador.
        </p>
      ) : (
        <SelectorDestino destinos={destinos} />
      )}
      <button className={principal} disabled={pendiente}>
        {pendiente ? "Creando invitación…" : "Invitar encargado"}
      </button>
      <Mensaje estado={estado} />
      {estado.enlace && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 grow">
            <Campo etiqueta="Enlace privado de invitación">
              <input
                className={campo}
                readOnly
                value={estado.enlace}
                onFocus={(evento) => evento.currentTarget.select()}
              />
            </Campo>
          </div>
          <button
            type="button"
            className={secundario}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(estado.enlace!);
                cambiarCopia(true);
              } catch {
                cambiarCopia(false);
              }
            }}
          >
            {copiado ? "Copiado" : "Copiar enlace"}
          </button>
        </div>
      )}
    </form>
  );
}

export function DecisionAcceso({ fila }: { fila: AccesoEncargado }) {
  const [decision, elegir] = useState<"aprobar" | "rechazar" | "revocar">();
  const [estado, accion, pendiente] = useActionState(
    resolverAcceso.bind(null, fila.id),
    inicial,
  );
  if (!decision)
    return (
      <div className="flex flex-wrap gap-2">
        {fila.tipo === "invitacion" ? (
          <button
            type="button"
            className={secundario}
            onClick={() => elegir("revocar")}
          >
            Revocar enlace
          </button>
        ) : (
          <>
            <button
              type="button"
              className={principal}
              onClick={() => elegir("aprobar")}
            >
              {fila.propuesta ? "Aprobar y crear borrador" : "Aprobar acceso"}
            </button>
            <button
              type="button"
              className={secundario}
              onClick={() => elegir("rechazar")}
            >
              Rechazar
            </button>
          </>
        )}
      </div>
    );
  return (
    <form
      action={accion}
      onSubmit={(evento) => enviarFormulario(evento, accion)}
      className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <input type="hidden" name="decision" value={decision} />
      <p className="text-sm font-semibold">
        {decision === "revocar"
          ? "El enlace dejará de funcionar inmediatamente."
          : decision === "aprobar"
            ? fila.propuesta
              ? "Se creará un borrador y la cuenta recibirá acceso como Admin."
              : "La cuenta recibirá acceso como Admin al atractivo seleccionado."
            : "La persona podrá leer tu observación en su solicitud."}
      </p>
      {decision === "rechazar" && (
        <Campo etiqueta="Motivo del rechazo">
          <textarea
            name="observacion"
            className={campo}
            minLength={5}
            maxLength={500}
            required
          />
        </Campo>
      )}
      <p className="break-all text-sm">Cuenta: {fila.correo}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={secundario}
          disabled={pendiente}
          onClick={() => elegir(undefined)}
        >
          Cancelar
        </button>
        <button className={principal} disabled={pendiente}>
          {pendiente ? "Guardando…" : "Confirmar decisión"}
        </button>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

export function AceptarInvitacion({
  autenticado,
  tokenInicial,
  detalleInicial,
  correoSesion,
}: {
  autenticado: boolean;
  tokenInicial?: string;
  detalleInicial?: DetalleInvitacion | null;
  correoSesion?: string | null;
}) {
  const tokenDelHash = useSyncExternalStore(
    observarInvitacion,
    leerInvitacion,
    () => tokenInicial ?? "",
  );
  const tokenEfectivo = tokenInicial || tokenDelHash;
  const tokenLimpio = tokenEfectivo.split(".")[0];
  const [consulta, cambiarConsulta] = useState<{
    token: string;
    detalle?: DetalleInvitacion;
    mensaje?: string;
  }>();
  const consultaActual = consulta?.token === tokenLimpio ? consulta : undefined;
  const detalle = detalleInicial ?? consultaActual?.detalle;
  const cargando = Boolean(tokenLimpio && !detalle && !consultaActual);
  const [modo, cambiarModo] = useState<"registro" | "ingreso">("registro");
  const [mostrarClave, cambiarMostrarClave] = useState(false);
  const [mostrarConfirmacion, cambiarMostrarConfirmacion] = useState(false);
  const [errorLocal, cambiarErrorLocal] = useState("");

  const [estadoAceptar, accionAceptar, pendienteAceptar] = useActionState(
    aceptarInvitacion,
    inicial,
  );
  const [estadoActivar, accionActivar, pendienteActivar] = useActionState(
    activarCuentaInvitada,
    inicial,
  );

  useEffect(() => {
    if (!tokenLimpio || detalleInicial) return;
    let vigente = true;
    void consultarDetalleInvitacion(tokenLimpio)
      .then((resultado) => {
        if (vigente) cambiarConsulta({ token: tokenLimpio, ...resultado });
      })
      .catch(() => {
        if (vigente) cambiarConsulta({
          token: tokenLimpio,
          mensaje: "No pudimos verificar la invitación. Recarga la página e inténtalo de nuevo.",
        });
      });
    return () => { vigente = false; };
  }, [tokenLimpio, detalleInicial]);

  const esNuevo = Boolean(detalle?.nuevo || tokenEfectivo.endsWith(".nuevo"));
  const correoInvitado = detalle?.correo ?? "";
  const coincideCorreo =
    !correoSesion ||
    !correoInvitado ||
    correoSesion.trim().toLowerCase() === correoInvitado.trim().toLowerCase();

  const manejarEnvioAceptar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    datos.set("token", tokenLimpio);
    startTransition(() => accionAceptar(datos));
  };

  const manejarEnvioActivar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    cambiarErrorLocal("");
    const datos = new FormData(evento.currentTarget);
    if (modo === "registro") {
      const p1 = String(datos.get("contrasena") ?? "");
      const p2 = String(datos.get("confirmarContrasena") ?? "");
      if (p1.length < 8) {
        cambiarErrorLocal("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (p1 !== p2) {
        cambiarErrorLocal("Las contraseñas no coinciden.");
        return;
      }
    }
    datos.set("token", tokenLimpio);
    datos.set("modo", modo);
    if (correoInvitado) {
      datos.set("correo", correoInvitado);
    }
    startTransition(() => accionActivar(datos));
  };

  return (
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-12 lg:gap-8">
      <section className="space-y-6 lg:col-span-5">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-block font-serif text-2xl font-bold tracking-tight text-[#174238]"
          >
            munay<span className="text-[#c86a52]">.</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#174238] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Invitación de gestión
            </span>
            <span className="rounded-full border border-[#dce3da] bg-white px-3 py-1 text-xs font-medium text-[#465a50]">
              Lambayeque
            </span>
          </div>
        </div>

        {detalle?.destino ? (
          <div className="overflow-hidden rounded-3xl border border-[#dce3da] bg-white shadow-sm">
            {detalle.destino.imagenUrl && (
              <Image
                src={detalle.destino.imagenUrl}
                alt={detalle.destino.nombre}
                width={800}
                height={208}
                unoptimized
                className="h-52 w-full object-cover"
              />
            )}
            <div className="space-y-3 p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#e8efe9] px-2.5 py-0.5 text-xs font-semibold text-[#174238]">
                  {detalle.destino.provincia}
                </span>
                <span className="rounded-full bg-[#f4f5ef] px-2.5 py-0.5 text-xs font-medium text-[#465a50]">
                  {detalle.destino.categoria}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#173b32]">
                {detalle.destino.nombre}
              </h1>
              <p className="text-xs text-[#526a60]">
                {detalle.destino.ubicacion}
              </p>
              {detalle.destino.descripcion && (
                <p className="text-sm leading-relaxed text-[#465a50] line-clamp-3">
                  {detalle.destino.descripcion}
                </p>
              )}
            </div>
          </div>
        ) : esNuevo ? (
          <div className="space-y-3 rounded-3xl border border-[#dce3da] bg-white p-6 shadow-sm">
            <span className="rounded-full bg-[#e8efe9] px-3 py-1 text-xs font-semibold text-[#174238]">
              Nuevo atractivo
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#173b32]">
              Registro y administración de atractivo
            </h1>
            <p className="text-sm leading-relaxed text-[#465a50]">
              Has sido invitado por el equipo de Munay para incorporar un nuevo
              atractivo turístico o cultural al catálogo oficial de la región.
            </p>
          </div>
        ) : (
          <div className="space-y-3 rounded-3xl border border-[#dce3da] bg-white p-6 shadow-sm">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#173b32]">
              Gestión institucional de atractivo
            </h1>
            <p className="text-sm leading-relaxed text-[#465a50]">
              Acceso autorizado para coordinar y administrar la presencia
              oficial de un atractivo en la plataforma turística de Lambayeque.
            </p>
          </div>
        )}

        <div className="space-y-4 rounded-3xl border border-[#dce3da] bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#174238]">
            Facultades oficiales de gestión
          </h2>
          <ul className="space-y-3 text-xs sm:text-sm text-[#465a50]">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#174238]" />
              <span>
                Generación y validación de visitas mediante códigos QR
                verificados con geolocalización.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#174238]" />
              <span>
                Administración directa de información: horarios de atención,
                rutas, accesibilidad y tarifas.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#174238]" />
              <span>
                Acceso a analíticas de visitantes, afluencia mensual y atención
                a reseñas de la comunidad.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#174238]" />
              <span>
                Canal directo con el equipo de turismo y patrimonio regional de
                Lambayeque.
              </span>
            </li>
          </ul>
        </div>

        {correoInvitado && (
          <p className="text-xs text-[#768a80]">
            Invitación reservada para{" "}
            <strong className="text-[#173b32]">{correoInvitado}</strong>. Válida
            por 72 horas desde su emisión.
          </p>
        )}
      </section>

      <section className="min-w-0 lg:col-span-7">
        <div className="space-y-6 rounded-3xl border border-[#dce3da] bg-white p-4 shadow-sm sm:p-7">
          {cargando ? (
            <div className="py-12 text-center text-sm text-[#465a50]">
              Verificando datos de la invitación…
            </div>
          ) : !tokenLimpio ? (
            <div className="space-y-4 text-center">
              <h2 className="font-serif text-2xl font-semibold text-[#173b32]">
                Enlace de invitación no encontrado
              </h2>
              <p className="text-sm text-[#465a50]">
                No encontramos el código de invitación en este enlace. Revisa el
                correo electrónico oficial que recibiste y haz clic en el botón
                para ingresar.
              </p>
              <div className="pt-2">
                <Link href="/" className={secundario}>
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : !detalle?.valida || detalle.vencida ? (
            <div role="alert" className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <h2 className="font-serif text-2xl font-semibold">
                {detalle ? mensajeInvitacionNoDisponible(detalle) : "No pudimos abrir la invitación"}
              </h2>
              <p className="text-sm">
                {detalle?.estado === "aprobada"
                  ? "Puedes iniciar sesión con la cuenta que activaste para acceder a tu panel."
                  : detalle
                    ? "Si necesitas acceso, solicita un nuevo enlace al equipo de Munay."
                    : consultaActual?.mensaje}
              </p>
              <Link href={detalle?.estado === "aprobada" && autenticado && coincideCorreo ? "/administracion" : "/ingresar"} className={secundario}>
                {detalle?.estado === "aprobada" && autenticado && coincideCorreo ? "Ir a mi panel" : "Iniciar sesión"}
              </Link>
            </div>
          ) : estadoActivar.ok ? (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-serif text-2xl font-semibold text-[#173b32]">Confirma tu correo</h2>
              <p role="status" className="text-sm text-emerald-950">{estadoActivar.mensaje}</p>
            </div>
          ) : autenticado ? (
            !coincideCorreo ? (
              <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-[#432c0d]">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Conflicto de cuenta
                </span>
                <h2 className="font-serif text-xl font-semibold">
                  Cuenta diferente a la invitación
                </h2>
                <p className="text-sm leading-relaxed">
                  Has iniciado sesión como <strong>{correoSesion}</strong>, pero
                  esta invitación está asignada a{" "}
                  <strong>{correoInvitado}</strong>.
                </p>
                <p className="text-xs text-amber-900">
                  Para vincular la titularidad del atractivo correctamente,
                  debes cambiar a la cuenta correspondiente.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/salir?volver=${encodeURIComponent(`/invitacion-encargado?token=${tokenLimpio}`)}`}
                    className="inline-block rounded-xl bg-[#174238] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#23574a]"
                  >
                    Cerrar sesión actual y cambiar de cuenta
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="rounded-full bg-[#e8efe9] px-3 py-1 text-xs font-semibold text-[#174238]">
                    Cuenta verificada
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-[#173b32] pt-2">
                    Confirmar asignación de gestión
                  </h2>
                  <p className="text-sm text-[#465a50]">
                    Sesión iniciada con <strong>{correoSesion}</strong>. Al
                    aceptar recibirás el rol de Administrador.
                  </p>
                </div>
                <FormularioPorPasos
                  nuevo={esNuevo}
                  pendiente={pendienteAceptar}
                  enviar={manejarEnvioAceptar}
                  etiqueta={
                    pendienteAceptar
                      ? "Activando acceso…"
                      : esNuevo
                        ? "Aceptar y crear borrador"
                        : "Aceptar invitación y entrar al panel"
                  }
                >
                  <Mensaje estado={estadoAceptar} />
                </FormularioPorPasos>
              </div>
            )
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-semibold text-[#173b32]">
                  Activa tu cuenta de Administrador
                </h2>
                <p className="text-sm text-[#465a50]">
                  Tu correo ya fue autorizado institucionalmente. Configura tu
                  clave de acceso para ingresar.
                </p>
              </div>

              <FormularioPorPasos
                nuevo={esNuevo}
                pendiente={pendienteActivar}
                enviar={manejarEnvioActivar}
                etiqueta={
                  pendienteActivar
                    ? "Activando acceso…"
                    : modo === "registro"
                      ? "Crear cuenta y activar gestión"
                      : "Iniciar sesión y activar gestión"
                }
                cuenta={
                  <>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f4f5ef] p-1.5 text-xs font-semibold text-[#173b32]">
                      <button
                        type="button"
                        onClick={() => {
                          cambiarModo("registro");
                          cambiarErrorLocal("");
                        }}
                        className={`rounded-xl py-2 transition-colors ${modo === "registro" ? "bg-white text-[#174238] shadow-sm font-bold" : "text-[#526a60] hover:text-[#174238]"}`}
                      >
                        Crear contraseña
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          cambiarModo("ingreso");
                          cambiarErrorLocal("");
                        }}
                        className={`rounded-xl py-2 transition-colors ${modo === "ingreso" ? "bg-white text-[#174238] shadow-sm font-bold" : "text-[#526a60] hover:text-[#174238]"}`}
                      >
                        Ya tengo cuenta
                      </button>
                    </div>
                    <Campo etiqueta="Correo autorizado">
                      <input
                        name="correo"
                        type="email"
                        value={correoInvitado}
                        readOnly
                        className={`${campo} cursor-not-allowed bg-[#f4f5ef] text-[#526a60]`}
                      />
                    </Campo>

                    {modo === "registro" && (
                      <Campo etiqueta="Nombre y apellidos del responsable">
                        <input
                          name="nombreCompleto"
                          type="text"
                          required
                          minLength={3}
                          maxLength={100}
                          placeholder="Ej. Ana Lucía Delgado"
                          className={campo}
                        />
                      </Campo>
                    )}

                    <Campo
                      etiqueta={
                        modo === "registro"
                          ? "Crear contraseña"
                          : "Contraseña actual"
                      }
                    >
                      <div className="relative">
                        <input
                          name="contrasena"
                          type={mostrarClave ? "text" : "password"}
                          required
                          minLength={8}
                          placeholder={
                            modo === "registro"
                              ? "Mínimo 8 caracteres"
                              : "Tu contraseña de Munay"
                          }
                          className={campo}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            cambiarMostrarClave((previo) => !previo)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#768a80] hover:text-[#174238]"
                          aria-label="Alternar visibilidad de contraseña"
                        >
                          <IconoOjo tachado={mostrarClave} />
                        </button>
                      </div>
                    </Campo>

                    {modo === "registro" && (
                      <Campo etiqueta="Confirmar contraseña">
                        <div className="relative">
                          <input
                            name="confirmarContrasena"
                            type={mostrarConfirmacion ? "text" : "password"}
                            required
                            minLength={8}
                            placeholder="Repite la contraseña"
                            className={campo}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              cambiarMostrarConfirmacion((previo) => !previo)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#768a80] hover:text-[#174238]"
                            aria-label="Alternar visibilidad de confirmación de contraseña"
                          >
                            <IconoOjo tachado={mostrarConfirmacion} />
                          </button>
                        </div>
                      </Campo>
                    )}

                    {modo === "ingreso" && (
                      <div className="text-right">
                        <Link
                          href="/recuperar"
                          className="text-xs font-semibold text-[#174238] underline hover:text-[#23574a]"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                    )}
                  </>
                }
              >
                {errorLocal && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900"
                  >
                    {errorLocal}
                  </p>
                )}

                <Mensaje estado={estadoActivar} />
              </FormularioPorPasos>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
