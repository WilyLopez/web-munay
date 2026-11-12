"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ingresar, registrarCuenta } from "./acciones";
import { PanelMunay } from "./panel-munay";
import type { EstadoFormulario } from "./validacion";

const estiloCampo =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 transition-colors focus:border-[#174238] focus:outline-none focus:ring-2 focus:ring-[#174238]/20 aria-invalid:border-red-600";
const estiloEnlace = "font-semibold text-[#174238] underline underline-offset-2 hover:text-[#23574a]";

function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  return mensaje ? (
    <p id={id} className="text-xs font-medium text-red-700">
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
  const [modoAlternado, cambiarModoAlternado] = useState<boolean | null>(null);
  const modoRegistro = modoAlternado ?? registro;

  const [nombre, cambiarNombre] = useState("");
  const [correo, cambiarCorreo] = useState("");
  const [contrasena, cambiarContrasena] = useState("");
  const [confirmarContrasena, cambiarConfirmarContrasena] = useState("");
  const [acepta, cambiarAcepta] = useState(false);
  const [visible, cambiarVisible] = useState(false);
  const [visibleConfirmar, cambiarVisibleConfirmar] = useState(false);

  useEffect(() => {
    const sincronizarRuta = () => {
      cambiarModoAlternado(window.location.pathname.includes("/registro"));
    };
    window.addEventListener("popstate", sincronizarRuta);
    return () => window.removeEventListener("popstate", sincronizarRuta);
  }, []);

  const alternarModo = (nuevoModo: boolean) => {
    cambiarModoAlternado(nuevoModo);
    window.history.replaceState(null, "", nuevoModo ? "/registro" : "/ingresar");
  };

  const [estado, accion, pendiente] = useActionState(
    async (anterior: EstadoFormulario, datos: FormData) => {
      try {
        const accionServidor = modoRegistro ? registrarCuenta : ingresar;
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

  const errores = estado.errores ?? {};

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-12">
      <section className="flex min-h-screen flex-col justify-between bg-white px-6 py-10 sm:px-12 lg:col-span-7 lg:px-16 xl:col-span-6 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Munay, inicio"
              className="text-2xl font-black tracking-tight text-[#174238]"
            >
              munay
              <span aria-hidden="true" className="text-[#a54b36]">
                .
              </span>
            </Link>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-[#174238]">
              Lambayeque
            </span>
          </div>

          <div className="mt-8 flex rounded-xl bg-stone-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => alternarModo(false)}
              className={`flex-1 rounded-lg py-2 text-center transition-all ${
                !modoRegistro
                  ? "bg-white font-semibold text-[#174238] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => alternarModo(true)}
              className={`flex-1 rounded-lg py-2 text-center transition-all ${
                modoRegistro
                  ? "bg-white font-semibold text-[#174238] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <div className="mt-8">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {modoRegistro ? "Crea tu cuenta en Munay" : "Te damos la bienvenida"}
            </h1>
            <p className="mt-1.5 text-sm text-stone-600">
              {modoRegistro
                ? "Regístrate para guardar destinos y registrar tus visitas."
                : "Ingresa tus credenciales para continuar tu recorrido."}
            </p>
          </div>

          {aviso && (
            <div
              role="status"
              className="mt-5 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-3.5 text-sm text-teal-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{aviso}</span>
            </div>
          )}

          {estado.mensaje && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-sm text-red-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-red-700"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{estado.mensaje}</span>
            </div>
          )}

          <form action={accion} className="mt-6 space-y-4">
            {modoRegistro && (
              <div className="space-y-1.5">
                <label
                  htmlFor="nombreCompleto"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Nombre completo
                </label>
                <input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  required
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                  value={nombre}
                  onChange={(evento) => cambiarNombre(evento.target.value)}
                  aria-invalid={!!errores.nombreCompleto}
                  aria-describedby={
                    errores.nombreCompleto ? "error-nombre" : undefined
                  }
                  className={estiloCampo}
                />
                <ErrorCampo
                  id="error-nombre"
                  mensaje={errores.nombreCompleto}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="correoElectronico"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Correo electrónico
              </label>
              <input
                id="correoElectronico"
                name="correoElectronico"
                required
                maxLength={254}
                type="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={(evento) => cambiarCorreo(evento.target.value)}
                aria-invalid={!!errores.correoElectronico}
                aria-describedby={
                  errores.correoElectronico ? "error-correo" : undefined
                }
                className={estiloCampo}
              />
              <ErrorCampo
                id="error-correo"
                mensaje={errores.correoElectronico}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="contrasena"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  id="contrasena"
                  name="contrasena"
                  required
                  type={visible ? "text" : "password"}
                  minLength={modoRegistro ? 8 : undefined}
                  autoComplete={modoRegistro ? "new-password" : "current-password"}
                  placeholder={modoRegistro ? "Mínimo 8 caracteres" : "Tu contraseña"}
                  value={contrasena}
                  onChange={(evento) => cambiarContrasena(evento.target.value)}
                  aria-invalid={!!errores.contrasena}
                  aria-describedby={
                    errores.contrasena ? "error-contrasena" : undefined
                  }
                  className={`${estiloCampo} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => cambiarVisible(!visible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700 focus:outline-none"
                  aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {visible ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {modoRegistro && (
                <div className="flex items-center gap-1.5 pt-0.5 text-xs">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      contrasena.length >= 8 ? "bg-emerald-600" : "bg-stone-300"
                    }`}
                  />
                  <span
                    className={
                      contrasena.length >= 8
                        ? "font-medium text-emerald-700"
                        : "text-stone-500"
                    }
                  >
                    Al menos 8 caracteres
                  </span>
                </div>
              )}
              <ErrorCampo id="error-contrasena" mensaje={errores.contrasena} />
            </div>

            {modoRegistro && (
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmarContrasena"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    required
                    type={visibleConfirmar ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={confirmarContrasena}
                    onChange={(evento) =>
                      cambiarConfirmarContrasena(evento.target.value)
                    }
                    aria-invalid={
                      !!errores.confirmarContrasena ||
                      (confirmarContrasena.length > 0 &&
                        contrasena !== confirmarContrasena)
                    }
                    aria-describedby={
                      errores.confirmarContrasena
                        ? "error-confirmar"
                        : undefined
                    }
                    className={`${estiloCampo} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      cambiarVisibleConfirmar(!visibleConfirmar)
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700 focus:outline-none"
                    aria-label={
                      visibleConfirmar
                        ? "Ocultar confirmación de contraseña"
                        : "Mostrar confirmación de contraseña"
                    }
                  >
                    {visibleConfirmar ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {confirmarContrasena.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-0.5 text-xs">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        contrasena === confirmarContrasena
                          ? "bg-emerald-600"
                          : "bg-red-600"
                      }`}
                    />
                    <span
                      className={
                        contrasena === confirmarContrasena
                          ? "font-medium text-emerald-700"
                          : "text-red-700"
                      }
                    >
                      {contrasena === confirmarContrasena
                        ? "Las contraseñas coinciden"
                        : "Las contraseñas no coinciden"}
                    </span>
                  </div>
                )}
                <ErrorCampo
                  id="error-confirmar"
                  mensaje={errores.confirmarContrasena}
                />
              </div>
            )}

            {modoRegistro && (
              <div className="space-y-1 pt-1">
                <div className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-600">
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
                    className="mt-0.5 h-4 w-4 rounded accent-[#174238]"
                  />
                  <div>
                    <label htmlFor="aceptaCondiciones">
                      Acepto los documentos legales de Munay:{" "}
                    </label>
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174238] px-4 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#23574a] focus:outline-none focus:ring-4 focus:ring-[#174238]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendiente ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    {modoRegistro ? "Registrando cuenta…" : "Iniciando sesión…"}
                  </span>
                </>
              ) : (
                <span>{modoRegistro ? "Crear cuenta" : "Iniciar sesión"}</span>
              )}
            </button>
          </form>
        </div>

        <div className="mx-auto mt-10 w-full max-w-md border-t border-stone-200 pt-5 text-center text-xs text-stone-600 sm:text-left">
          <p>
            {modoRegistro
              ? "¿Ya tienes una cuenta registrada? "
              : "¿Aún no tienes una cuenta en Munay? "}
            <button
              type="button"
              onClick={() => alternarModo(!modoRegistro)}
              className={estiloEnlace}
            >
              {modoRegistro ? "Inicia sesión" : "Regístrate gratis"}
            </button>
          </p>
          <div className="mt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-stone-500 transition-colors hover:text-stone-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Volver a la portada de Munay
            </Link>
          </div>
        </div>
      </section>

      <aside className="relative hidden bg-[#174238] lg:col-span-5 lg:block xl:col-span-6">
        <PanelMunay />
      </aside>
    </div>
  );
}
