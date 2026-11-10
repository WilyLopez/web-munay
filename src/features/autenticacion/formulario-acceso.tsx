"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ingresar, registrarCuenta } from "./acciones";
import type { EstadoFormulario } from "./validacion";

const estiloCampo =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30 aria-invalid:border-red-600";
const estiloEnlace = "font-semibold text-teal-800 underline underline-offset-2";

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  return mensaje ? (
    <p id={id} className="text-sm text-red-800">
      {mensaje}
    </p>
  ) : null;
}

export function FormularioAcceso({
  registro,
  aviso,
}: {
  registro: boolean;
  aviso?: string;
}) {
  const accionServidor = registro ? registrarCuenta : ingresar;
  const [estado, accion, pendiente] = useActionState(
    async (anterior: EstadoFormulario, datos: FormData) => {
      try {
        return await accionServidor(anterior, datos);
      } catch (error) {
        if (error instanceof TypeError) {
          return {
            mensaje:
              "No se pudo conectar con Munay. Revisa tu conexión e intenta nuevamente.",
          };
        }

        throw error;
      }
    },
    {},
  );
  const [nombre, cambiarNombre] = useState("");
  const [correo, cambiarCorreo] = useState("");
  const [acepta, cambiarAcepta] = useState(false);
  const [visible, cambiarVisible] = useState(false);
  const errores = estado.errores ?? {};

  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <p className="text-sm font-bold tracking-wide text-teal-800">MUNAY</p>
      <h1 className="mb-5 mt-1 text-3xl font-bold">
        {registro ? "Crea tu cuenta" : "Inicia sesión"}
      </h1>
      {aviso && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900"
        >
          {aviso}
        </p>
      )}
      {estado.mensaje && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900"
        >
          {estado.mensaje}
        </p>
      )}

      <form action={accion} className="space-y-4">
        {registro && (
          <div className="space-y-1">
            <label htmlFor="nombreCompleto" className="text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              required
              maxLength={120}
              autoComplete="name"
              value={nombre}
              onChange={(evento) => cambiarNombre(evento.target.value)}
              aria-invalid={!!errores.nombreCompleto}
              aria-describedby={
                errores.nombreCompleto ? "error-nombre" : undefined
              }
              className={estiloCampo}
            />
            <ErrorCampo id="error-nombre" mensaje={errores.nombreCompleto} />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="correoElectronico" className="text-sm font-medium">
            Correo electrónico
          </label>
          <input
            id="correoElectronico"
            name="correoElectronico"
            required
            maxLength={254}
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(evento) => cambiarCorreo(evento.target.value)}
            aria-invalid={!!errores.correoElectronico}
            aria-describedby={
              errores.correoElectronico ? "error-correo" : undefined
            }
            className={estiloCampo}
          />
          <ErrorCampo id="error-correo" mensaje={errores.correoElectronico} />
        </div>

        <div className="space-y-1">
          <label htmlFor="contrasena" className="text-sm font-medium">
            Contraseña
          </label>
          <div className="flex items-center gap-2">
            <input
              id="contrasena"
              name="contrasena"
              required
              type={visible ? "text" : "password"}
              minLength={registro ? 8 : undefined}
              autoComplete={registro ? "new-password" : "current-password"}
              aria-invalid={!!errores.contrasena}
              aria-describedby={
                errores.contrasena
                  ? "error-contrasena"
                  : registro
                    ? "ayuda-contrasena"
                    : undefined
              }
              className={estiloCampo}
            />
            <button
              type="button"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-teal-800 focus-visible:outline-2"
              aria-controls="contrasena"
              aria-pressed={visible}
              onClick={() => cambiarVisible(!visible)}
            >
              {visible ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {registro && (
            <p id="ayuda-contrasena" className="text-sm text-slate-600">
              Al menos 8 caracteres.
            </p>
          )}
          <ErrorCampo id="error-contrasena" mensaje={errores.contrasena} />
        </div>

        {registro && (
          <div className="space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <input
                id="aceptaCondiciones"
                name="aceptaCondiciones"
                type="checkbox"
                required
                checked={acepta}
                onChange={(evento) => cambiarAcepta(evento.target.checked)}
                aria-invalid={!!errores.aceptaCondiciones}
                aria-describedby={
                  errores.aceptaCondiciones ? "error-condiciones" : undefined
                }
                className="mt-1 accent-teal-800"
              />
              <div>
                <label htmlFor="aceptaCondiciones">
                  Acepto los documentos de Munay.
                </label>{" "}
                <Link
                  className={estiloEnlace}
                  href="/terminos-de-uso"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Términos de uso
                </Link>{" "}
                y{" "}
                <Link
                  className={estiloEnlace}
                  href="/politica-de-privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
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
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-xl bg-teal-800 px-4 py-2.5 font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
        >
          {registro
            ? pendiente
              ? "Registrando…"
              : "Registrarse"
            : pendiente
              ? "Ingresando…"
              : "Ingresar"}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-700">
        {registro ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link
          className={estiloEnlace}
          href={registro ? "/ingresar" : "/registro"}
        >
          {registro ? "Inicia sesión" : "Regístrate gratis"}
        </Link>
      </p>
    </section>
  );
}
