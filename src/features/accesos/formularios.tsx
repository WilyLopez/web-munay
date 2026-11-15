"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { categorias, provincias } from "@/features/destinos/catalogo";
import {
  aceptarInvitacion,
  enviarInvitacion,
  enviarSolicitud,
  resolverAcceso,
} from "./acciones";
import {
  campo,
  principal,
  secundario,
  type AccesoEncargado,
  type OpcionDestino,
} from "./tipos";

const inicial = { mensaje: "", ok: false };
const loginInvitacion = "/ingresar?volver=/invitacion-encargado";
const claveInvitacion = "munay-invitacion-encargado";

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
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
      {etiqueta}
      {children}
    </label>
  );
}

function Mensaje({ estado }: { estado: typeof inicial }) {
  return estado.mensaje ? (
    <p
      role={estado.ok ? "status" : "alert"}
      className={`rounded-xl p-3 text-sm ${estado.ok ? "bg-green-50 text-green-900" : "bg-rose-50 text-rose-900"}`}
    >
      {estado.mensaje}
    </p>
  ) : null;
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
        <legend className="font-semibold">¿Qué quieres gestionar?</legend>
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
      {nuevo ? (
        <div className="grid gap-3 rounded-xl bg-[#f4f5ef] p-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre del atractivo">
            <input
              name="nombre"
              className={campo}
              minLength={3}
              maxLength={120}
              required
            />
          </Campo>
          <Campo etiqueta="Ubicación o dirección">
            <input
              name="ubicacion"
              className={campo}
              minLength={4}
              maxLength={180}
              required
            />
          </Campo>
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
          <Campo etiqueta="Latitud">
            <input
              name="latitud"
              type="number"
              inputMode="decimal"
              step="any"
              min={-90}
              max={90}
              placeholder="-6.77"
              className={campo}
              required
            />
          </Campo>
          <Campo etiqueta="Longitud">
            <input
              name="longitud"
              type="number"
              inputMode="decimal"
              step="any"
              min={-180}
              max={180}
              placeholder="-79.84"
              className={campo}
              required
            />
          </Campo>
          <p className="text-xs text-[#4d665b] sm:col-span-2">
            Usa las coordenadas del punto donde se recibirá a los visitantes.
            Munay las utilizará en el mapa y en la verificación de visitas.
          </p>
          <div className="sm:col-span-2">
            <Campo etiqueta="Descripción pública">
              <textarea
                name="descripcion"
                rows={3}
                minLength={20}
                maxLength={1000}
                className={campo}
                required
              />
            </Campo>
          </div>
        </div>
      ) : (
        <SelectorDestino destinos={destinos} />
      )}
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
      <SelectorDestino destinos={destinos} />
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
              {fila.propuesta ? "Aprobar y publicar" : "Aprobar acceso"}
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
              ? "Se publicará el nuevo atractivo y la cuenta recibirá acceso como Admin."
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

export function AceptarInvitacion({ autenticado }: { autenticado: boolean }) {
  const [estado, accion, pendiente] = useActionState(
    aceptarInvitacion,
    inicial,
  );
  const token = () => {
    const fragmento = window.location.hash.slice(1);
    try {
      if (fragmento) sessionStorage.setItem(claveInvitacion, fragmento);
      return fragmento || sessionStorage.getItem(claveInvitacion) || "";
    } catch {
      return fragmento;
    }
  };
  if (!autenticado)
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href={loginInvitacion}
          className={principal}
          onClick={() => token()}
        >
          Iniciar sesión
        </Link>
        <Link href="/registro" className={secundario}>
          Crear cuenta
        </Link>
      </div>
    );
  return (
    <form
      action={(datos) => {
        datos.set("token", token());
        accion(datos);
      }}
      className="space-y-4"
    >
      <button className={principal} disabled={pendiente}>
        {pendiente ? "Activando acceso…" : "Aceptar invitación"}
      </button>
      <Mensaje estado={estado} />
    </form>
  );
}
