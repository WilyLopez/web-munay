"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AvisoAcceso } from "./aviso-acceso";
import {
  botonAcceso as boton,
  campoAcceso as campo,
  enlaceAcceso,
  tituloAcceso,
} from "./estilos-acceso";
import { restablecerContrasena, solicitarRecuperacion } from "./recuperacion";

const enlace = `${enlaceAcceso} text-sm`;
const buzones: Readonly<Record<string, string>> = {
  "gmail.com": "https://mail.google.com/",
  "outlook.com": "https://outlook.live.com/mail/",
  "hotmail.com": "https://outlook.live.com/mail/",
  "live.com": "https://outlook.live.com/mail/",
  "yahoo.com": "https://mail.yahoo.com/",
};

function ocultarCorreo(correo: string) {
  const separador = correo.lastIndexOf("@");
  const [dominio, ...extension] = correo.slice(separador + 1).split(".");
  return `${correo.slice(0, 1)}•••@${dominio.slice(0, 1)}•••.${extension.join(".")}`;
}

export function SolicitudRecuperacion() {
  const [correo, cambiarCorreo] = useState("");
  const [enviado, cambiarEnviado] = useState(false);
  const [estado, enviar, pendiente] = useActionState(
    async (
      anterior: Parameters<typeof solicitarRecuperacion>[0],
      datos: FormData,
    ) => {
      const resultado = await solicitarRecuperacion(anterior, datos);
      if (resultado.enviado) cambiarEnviado(true);
      return resultado;
    },
    {},
  );
  const dominio = correo.trim().split("@").at(-1)?.toLowerCase() ?? "";
  const buzon = Object.hasOwn(buzones, dominio) ? buzones[dominio] : undefined;

  return (
    <>
      <h1 className={tituloAcceso}>
        {enviado ? "Revisa tu correo" : "¿Olvidaste tu contraseña?"}
      </h1>
      {enviado && !estado.mensaje ? (
        <p role="status" className="text-sm leading-relaxed text-stone-700">
          Si hay una cuenta asociada a{" "}
          <strong>{ocultarCorreo(correo.trim())}</strong>, recibirás un enlace
          temporal de Munay. Revisa también la carpeta de spam.
          {estado.enviado &&
            " Si acabas de pedir otro enlace, usa el más reciente."}
        </p>
      ) : !enviado ? (
        <p className="text-sm text-stone-700">
          Ingresa el correo de tu cuenta para recibir un enlace de recuperación.
        </p>
      ) : null}
      <form action={enviar} className="space-y-4">
        {enviado ? (
          <input type="hidden" name="correoElectronico" value={correo} />
        ) : (
          <label className="grid gap-2 text-sm font-semibold text-stone-900">
            Correo electrónico
            <input
              type="email"
              name="correoElectronico"
              autoComplete="email"
              className={campo}
              value={correo}
              onChange={(evento) => cambiarCorreo(evento.target.value)}
              readOnly={pendiente}
              maxLength={254}
              required
            />
          </label>
        )}
        {estado.mensaje && (
          <AvisoAcceso tipo="error" mensaje={estado.mensaje} />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button className={boton} disabled={pendiente}>
            {pendiente
              ? "Enviando…"
              : enviado
                ? "Reenviar enlace"
                : "Enviar enlace"}
          </button>
          {enviado && buzon && (
            <a href={buzon} target="_blank" rel="noreferrer" className={enlace}>
              Abrir mi correo
            </a>
          )}
        </div>
      </form>
      <Link className={enlace} href="/ingresar">
        Volver a iniciar sesión
      </Link>
    </>
  );
}

export function FormularioRestablecer({ token }: { token?: string }) {
  const [contrasena, cambiarContrasena] = useState("");
  const [confirmacion, cambiarConfirmacion] = useState("");
  const [visible, cambiarVisibilidad] = useState(false);
  const [estado, actualizar, pendiente] = useActionState(
    restablecerContrasena.bind(null, token ?? ""),
    {},
  );
  const minimo = contrasena.length >= 8;
  const coinciden = Boolean(confirmacion) && contrasena === confirmacion;

  if (estado.actualizado)
    return (
      <div className="space-y-4" role="status">
        <h1 className={tituloAcceso}>¡Contraseña actualizada!</h1>
        <p className="text-sm text-stone-700">
          Ya puedes volver a ingresar con tu nueva contraseña.
        </p>
        <Link className={boton} href="/ingresar">
          Iniciar sesión
        </Link>
      </div>
    );

  if (!token || estado.nuevoEnlace)
    return (
      <>
        <h1 className={tituloAcceso}>Solicita otro enlace</h1>
        <AvisoAcceso
          tipo="error"
          mensaje={
            estado.mensaje ?? "Este enlace ya no es válido. Solicita uno nuevo."
          }
        />
        <Link className={boton} href="/autenticacion/recuperar">
          Solicitar nuevo enlace
        </Link>
      </>
    );

  return (
    <>
      <h1 className={tituloAcceso}>Crea una nueva contraseña</h1>
      <form action={actualizar} className="space-y-4">
        <label className="grid gap-2 text-sm font-semibold text-stone-900">
          Nueva contraseña
          <input
            type={visible ? "text" : "password"}
            name="contrasena"
            autoComplete="new-password"
            value={contrasena}
            onChange={(evento) => cambiarContrasena(evento.target.value)}
            required
            minLength={8}
            aria-describedby="reglas-contrasena"
            className={campo}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-900">
          Confirmar contraseña
          <input
            type={visible ? "text" : "password"}
            name="confirmarContrasena"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(evento) => cambiarConfirmacion(evento.target.value)}
            required
            minLength={8}
            aria-describedby="reglas-contrasena"
            className={campo}
          />
        </label>
        <button
          type="button"
          className={enlace}
          onClick={() => cambiarVisibilidad(!visible)}
        >
          {visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
        </button>
        <ul
          id="reglas-contrasena"
          aria-live="polite"
          className="space-y-1 text-sm text-stone-700"
        >
          <li>
            {minimo
              ? "✓ Cumple el mínimo de 8 caracteres."
              : "Usa al menos 8 caracteres."}
          </li>
          <li>
            {coinciden
              ? "✓ Las contraseñas coinciden."
              : "Ambas contraseñas deben coincidir."}
          </li>
        </ul>
        {(estado.mensaje || estado.errores) && (
          <AvisoAcceso
            tipo="error"
            mensaje={
              estado.mensaje ?? Object.values(estado.errores ?? {}).join(" ")
            }
          />
        )}
        <button className={boton} disabled={pendiente || !minimo || !coinciden}>
          {pendiente ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
      <Link className={enlace} href="/autenticacion/recuperar">
        Solicitar nuevo enlace
      </Link>
    </>
  );
}
