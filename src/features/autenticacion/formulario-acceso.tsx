"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ingresar, registrarCuenta } from "./acciones";
import { AvisoAcceso, type DatosAviso } from "./aviso-acceso";
import {
  botonAcceso,
  campoAcceso,
  enlaceAcceso,
  tituloAcceso,
} from "./estilos-acceso";
import type { EstadoFormulario } from "./validacion";

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  return mensaje ? (
    <p id={id} className="text-sm text-rose-800">
      {mensaje}
    </p>
  ) : null;
}

function CampoContrasena({
  clave,
  etiqueta,
  error,
  registro,
}: {
  clave: "contrasena" | "confirmarContrasena";
  etiqueta: string;
  error?: string;
  registro: boolean;
}) {
  const [visible, cambiarVisibilidad] = useState(false);
  const [valor, cambiarValor] = useState("");
  const ayuda = registro && clave === "contrasena" && !error;
  const descripcion = error
    ? `${clave}-error`
    : ayuda
      ? "ayuda-contrasena"
      : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label className="text-sm font-semibold" htmlFor={clave}>
          {etiqueta}
        </label>
        {!registro && (
          <Link
            className={`${enlaceAcceso} text-sm`}
            href="/autenticacion/recuperar"
          >
            Olvidé mi contraseña
          </Link>
        )}
      </div>
      <div className="relative">
        <input
          id={clave}
          name={clave}
          type={visible ? "text" : "password"}
          className={`${campoAcceso} pe-24`}
          required
          minLength={registro ? 8 : undefined}
          autoComplete={registro ? "new-password" : "current-password"}
          value={valor}
          onChange={(evento) => cambiarValor(evento.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={descripcion}
        />
        <button
          type="button"
          onClick={() => cambiarVisibilidad(!visible)}
          className={`${enlaceAcceso} absolute inset-y-0 end-1 px-2 text-sm no-underline`}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${clave === "contrasena" ? "contraseña" : "confirmación de contraseña"}`}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {ayuda && (
        <p id="ayuda-contrasena" className="text-sm text-stone-600">
          Usa al menos 8 caracteres.
        </p>
      )}
      <ErrorCampo id={`${clave}-error`} mensaje={error} />
    </div>
  );
}

export function FormularioAcceso({
  registro,
  aviso,
  volver,
}: {
  registro: boolean;
  aviso?: DatosAviso;
  volver?: string;
}) {
  const [nombre, cambiarNombre] = useState("");
  const [correo, cambiarCorreo] = useState("");
  const [acepta, cambiarAcepta] = useState(false);
  const [estado, accion, pendiente] = useActionState(
    async (anterior: EstadoFormulario, datos: FormData) => {
      try {
        return await (registro ? registrarCuenta : ingresar)(anterior, datos);
      } catch (error) {
        if (error instanceof TypeError)
          return {
            mensaje:
              "No pudimos conectarnos con Munay. Revisa tu conexión e inténtalo de nuevo.",
          };
        throw error;
      }
    },
    {},
  );
  const { errores = {}, mensaje, requiereConfirmacion } = estado;
  const avisoActual = mensaje
    ? { mensaje, tipo: "error" as const, reenviar: requiereConfirmacion }
    : !Object.keys(errores).length && !pendiente
      ? aviso
      : undefined;
  const consulta = volver ? `?${new URLSearchParams({ volver })}` : "";

  return (
    <>
      <nav
        aria-label="Acceso a Munay"
        className="grid grid-cols-2 gap-1 rounded-xl bg-[#eeeee5] p-1 text-sm"
      >
        {(
          [
            ["/ingresar", "Iniciar sesión", !registro],
            ["/registro", "Crear cuenta", registro],
          ] as const
        ).map(([ruta, etiqueta, actual]) => (
          <Link
            key={ruta}
            href={`${ruta}${consulta}`}
            aria-current={actual ? "page" : undefined}
            className="flex min-h-11 items-center justify-center rounded-lg px-2 text-center font-semibold text-stone-700 motion-safe:transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-[#174238] aria-[current=page]:bg-white aria-[current=page]:text-[#174238] aria-[current=page]:shadow-xs"
          >
            {etiqueta}
          </Link>
        ))}
      </nav>
      <div className="entrada-acceso space-y-5">
        <header className="space-y-2">
          <h1 className={tituloAcceso}>
            {registro ? "Crea tu cuenta" : "Te damos la bienvenida"}
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            {registro
              ? "Guarda tus destinos favoritos y registra tus visitas."
              : "Ingresa a tu cuenta de Munay."}
          </p>
        </header>

        {avisoActual && <AvisoAcceso {...avisoActual} />}
        <form action={accion} className="space-y-4" aria-busy={pendiente}>
          {!registro && volver && (
            <input type="hidden" name="volver" value={volver} />
          )}
          {registro && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" htmlFor="nombreCompleto">
                Nombre completo
              </label>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                autoComplete="name"
                maxLength={120}
                required
                className={campoAcceso}
                value={nombre}
                onChange={(evento) => cambiarNombre(evento.target.value)}
                aria-invalid={Boolean(errores.nombreCompleto)}
                aria-describedby={
                  errores.nombreCompleto ? "error-nombre" : undefined
                }
              />
              <ErrorCampo id="error-nombre" mensaje={errores.nombreCompleto} />
            </div>
          )}
          <div className="space-y-1.5">
            <label
              className="text-sm font-semibold"
              htmlFor="correoElectronico"
            >
              Correo electrónico
            </label>
            <input
              id="correoElectronico"
              name="correoElectronico"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              className={campoAcceso}
              value={correo}
              onChange={(evento) => cambiarCorreo(evento.target.value)}
              aria-invalid={Boolean(errores.correoElectronico)}
              aria-describedby={
                errores.correoElectronico ? "error-correo" : undefined
              }
            />
            <ErrorCampo id="error-correo" mensaje={errores.correoElectronico} />
          </div>
          <CampoContrasena
            clave="contrasena"
            etiqueta="Contraseña"
            error={errores.contrasena}
            registro={registro}
          />
          {registro && (
            <>
              <CampoContrasena
                clave="confirmarContrasena"
                etiqueta="Confirma tu contraseña"
                error={errores.confirmarContrasena}
                registro
              />
              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <input
                    id="aceptaCondiciones"
                    name="aceptaCondiciones"
                    type="checkbox"
                    required
                    className="mt-1 size-4 shrink-0 accent-[#174238] focus-visible:outline-2 focus-visible:outline-offset-3"
                    checked={acepta}
                    onChange={(evento) => cambiarAcepta(evento.target.checked)}
                    aria-invalid={Boolean(errores.aceptaCondiciones)}
                    aria-describedby={
                      errores.aceptaCondiciones
                        ? "error-condiciones"
                        : undefined
                    }
                  />
                  <div>
                    <label htmlFor="aceptaCondiciones">Acepto los </label>
                    <Link
                      className={enlaceAcceso}
                      href="/terminos-de-uso"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Términos de uso
                    </Link>
                    {" y la "}
                    <Link
                      className={enlaceAcceso}
                      href="/politica-de-privacidad"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Política de privacidad
                    </Link>
                    .
                  </div>
                </div>
                <ErrorCampo
                  id="error-condiciones"
                  mensaje={errores.aceptaCondiciones}
                />
              </div>
            </>
          )}
          <button className={botonAcceso} disabled={pendiente}>
            {pendiente && (
              <span
                aria-hidden="true"
                className="size-4 rounded-full border-2 border-white/45 border-t-white motion-safe:animate-spin"
              />
            )}
            {registro
              ? pendiente
                ? "Creando cuenta…"
                : "Crear cuenta"
              : pendiente
                ? "Iniciando sesión…"
                : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </>
  );
}
