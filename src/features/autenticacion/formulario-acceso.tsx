"use client";

import Link from "next/link";
import { regresoEscribirResena, regresoDetalleResena } from "@/features/resenas/enlaces";
import { regresoQrVisita } from "@/features/visitas/enlace-qr";
import { BotonGoogle } from "./boton-google";
import { useActionState, useEffect, useRef, useState } from "react";
import { ingresar, registrarCuenta } from "./acciones";
import { AvisoAcceso, type DatosAviso } from "./aviso-acceso";
import { BotonEnvioAcceso } from "./boton-envio-acceso";
import { campoAcceso, enlaceAcceso, tituloAcceso } from "./estilos-acceso";
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
  const id = registro ? `registro-${clave}` : `ingreso-${clave}`;
  const ayuda = registro && clave === "contrasena" && !error;
  const descripcion = error
    ? `${id}-error`
    : ayuda
      ? "ayuda-contrasena"
      : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label className="text-sm font-semibold" htmlFor={id}>
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
          id={id}
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
      <ErrorCampo id={`${id}-error`} mensaje={error} />
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
  const [googleIniciado, cambiarGoogleIniciado] = useState(false);
  const contextoResena = Boolean(volver && regresoEscribirResena(volver));
  const contextoOpinion = Boolean(volver && regresoDetalleResena(volver));
  const contextoQr = Boolean(volver && regresoQrVisita(volver));
  const [nombre, cambiarNombre] = useState("");
  const [correo, cambiarCorreo] = useState("");
  const [acepta, cambiarAcepta] = useState(false);
  const [estado, accion, pendiente] = useActionState(
    async (anterior: EstadoFormulario, datos: FormData) => {
      try {
        cambiarGoogleIniciado(false);
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
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.errores) {
      formulario.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    }
  }, [estado]);

  const { errores = {}, mensaje, requiereConfirmacion } = estado;
  const avisoActual = mensaje
    ? { mensaje, tipo: "error" as const, reenviar: requiereConfirmacion }
    : !Object.keys(errores).length && !pendiente
      ? aviso
      : undefined;
  const idCorreo = registro ? "registro-correo" : "ingreso-correo";
  const consulta = volver ? `?${new URLSearchParams({ volver })}` : "";

  return (
    <>
      <div className="entrada-acceso space-y-5">
        <header className="space-y-2">
          <h1 className={tituloAcceso}>
            {contextoResena
              ? "Tu reseña está casi lista"
              : contextoOpinion ? "Continúa con esta reseña" : contextoQr
                ? "Continúa con tu visita"
                : registro
                  ? "Empieza a explorar Munay"
                  : "Qué bueno verte de nuevo"}
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            {contextoResena
              ? "Identifícate para volver a tu borrador y publicar tu experiencia."
              : contextoOpinion ? "Al terminar volverás a la opinión que estabas consultando para marcarla como útil." : contextoQr
                ? "Al terminar volverás al lugar para verificar tu visita y escribir."
                : registro
                  ? "Descubre lugares, guarda tus favoritos y comparte tus experiencias."
                  : "Tus destinos guardados y experiencias te esperan."}
          </p>
        </header>

        {!googleIniciado && avisoActual && <AvisoAcceso {...avisoActual} />}
        <BotonGoogle
          volver={volver}
          alIniciar={() => cambiarGoogleIniciado(true)}
        />
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="h-px flex-1 bg-[#dbe2d7]" />
          <span>O continúa con tu correo</span>
          <span className="h-px flex-1 bg-[#dbe2d7]" />
        </div>
        <form
          ref={formulario}
          action={accion}
          className="space-y-4"
          aria-busy={pendiente}
        >
          {volver && <input type="hidden" name="volver" value={volver} />}
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
            <label className="text-sm font-semibold" htmlFor={idCorreo}>
              Correo electrónico
            </label>
            <input
              id={idCorreo}
              name="correoElectronico"
              type="email"
              autoComplete={registro ? "email" : "username"}
              spellCheck={false}
              autoCapitalize="none"
              maxLength={254}
              required
              className={campoAcceso}
              value={correo}
              onChange={(evento) => cambiarCorreo(evento.target.value)}
              aria-invalid={Boolean(errores.correoElectronico)}
              aria-describedby={
                errores.correoElectronico ? `${idCorreo}-error` : undefined
              }
            />
            <ErrorCampo
              id={`${idCorreo}-error`}
              mensaje={errores.correoElectronico}
            />
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
              <div className="space-y-1.5 rounded-lg border border-[#dbe2d7] bg-white/60 p-3">
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
          <BotonEnvioAcceso
            etiqueta={registro ? "Crear cuenta" : "Iniciar sesión"}
            esperando={registro ? "Creando cuenta…" : "Iniciando sesión…"}
          />
        </form>
        <p className="border-t border-[#dbe2d7] pt-4 text-center text-sm text-stone-600">
          {registro ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <Link
            href={`${registro ? "/ingresar" : "/registro"}${consulta}`}
            className={`${enlaceAcceso} inline-flex min-h-11 items-center font-semibold`}
          >
            {registro ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
    </>
  );
}
