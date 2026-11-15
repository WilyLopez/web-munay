"use server";

import { regresoQrVisita } from "@/features/visitas/enlace-qr";

import { destinoSesion } from "./destino-sesion";

import { redirect } from "next/navigation";
import { solicitarSesion } from "./sesion";
import {
  borrarCookiesSesion,
  crearSupabaseServidor,
} from "./supabase/servidor";
import {
  esCorreoValido,
  leerCampo,
  validarCredenciales,
  type EstadoFormulario,
} from "./validacion";

const ERROR_SERVICIO =
  "El servicio no está disponible en este momento. Intenta nuevamente.";
const REGISTRO_RECIBIDO = "/ingresar?aviso=registro";

export async function reenviarConfirmacion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const email = leerCampo(datos, "correoElectronico").trim();
  if (!esCorreoValido(email)) {
    return {
      errores: { correoElectronico: "Ingresa un correo electrónico válido." },
    };
  }

  try {
    const supabase = await crearSupabaseServidor();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error?.status === 429) {
      return { mensaje: "Espera un momento antes de solicitar otro correo." };
    }
    if (error && error.status && error.status >= 500) {
      return { mensaje: ERROR_SERVICIO };
    }
  } catch {
    return { mensaje: ERROR_SERVICIO };
  }

  redirect("/ingresar?aviso=confirmacion-solicitada");
}

export async function registrarCuenta(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const { correoElectronico, contrasena, nombreCompleto, errores } =
    validarCredenciales(datos, true);

  if (Object.keys(errores).length) {
    return { errores };
  }

  try {
    const supabase = await crearSupabaseServidor();
    const { data, error } = await supabase.auth.signUp({
      email: correoElectronico,
      password: contrasena,
      options: { data: { nombreCompleto } },
    });

    if (
      ["user_already_exists", "email_exists"].includes(error?.code ?? "") ||
      (!error && data.user?.identities?.length === 0)
    ) {
      return {
        errores: { correoElectronico: "Este correo ya está registrado." },
      };
    }

    if (error) {
      if (error.code === "weak_password") {
        return { errores: { contrasena: "Elige una contraseña más segura." } };
      }

      return { mensaje: ERROR_SERVICIO };
    }

    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      await borrarCookiesSesion();
      return {
        mensaje:
          "La confirmación de correo no está disponible. Contacta al equipo de Munay.",
      };
    }
  } catch {
    return { mensaje: ERROR_SERVICIO };
  }

  redirect(REGISTRO_RECIBIDO);
}

export async function ingresar(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const { correoElectronico, contrasena, errores } = validarCredenciales(
    datos,
    false,
  );

  if (Object.keys(errores).length) {
    return { errores };
  }

  let destino: string | null = null;
  try {
    const supabase = await crearSupabaseServidor();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correoElectronico,
      password: contrasena,
    });

    if (error?.code === "email_not_confirmed") {
      return { mensaje: "Confirma tu correo antes de iniciar sesión." };
    }

    if (
      error &&
      (!error.status || error.status >= 500 || error.status === 429)
    ) {
      return { mensaje: ERROR_SERVICIO };
    }

    if (error || !data.session) {
      return { mensaje: "El correo o la contraseña son incorrectos." };
    }

    try {
      const respuesta = await solicitarSesion(
        data.session.access_token,
        "POST",
      );

      if (!respuesta.ok) {
        await borrarCookiesSesion();
        return {
          mensaje:
            respuesta.status === 401
              ? "No se pudo iniciar sesión con esta cuenta."
              : ERROR_SERVICIO,
        };
      }
      const sesion = (await respuesta.json()) as { perfil?: { rol?: unknown } };
      destino = destinoSesion(sesion.perfil?.rol);
      if (!destino) {
        await borrarCookiesSesion();
        return { mensaje: ERROR_SERVICIO };
      }
    } catch {
      await borrarCookiesSesion();
      return { mensaje: ERROR_SERVICIO };
    }
  } catch {
    return { mensaje: ERROR_SERVICIO };
  }

  const volver = leerCampo(datos, "volver");
  const verificacion = destino === "/destinos" ? regresoQrVisita(volver) : null;
  if (verificacion) redirect(verificacion);
  redirect(
    destino !== "/superadmin" &&
      ["/solicitar-acceso", "/invitacion-encargado"].includes(volver)
      ? volver
      : destino,
  );
}

export async function confirmarCorreo(datos: FormData): Promise<void> {
  const tokenHash = leerCampo(datos, "tokenHash");
  let confirmado = false;

  if (tokenHash && tokenHash.length <= 256) {
    try {
      const supabase = await crearSupabaseServidor();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
      confirmado = !error;

      if (confirmado) {
        await supabase.auth.signOut({ scope: "local" });
        await borrarCookiesSesion();
      }
    } catch {
      confirmado = false;
    }
  }

  redirect(
    `/ingresar?aviso=${confirmado ? "confirmado" : "confirmacion-invalida"}`,
  );
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearSupabaseServidor();
  const { data } = await supabase.auth.getSession();
  let revocada = true;

  if (data.session) {
    try {
      const respuesta = await solicitarSesion(
        data.session.access_token,
        "DELETE",
      );
      revocada = respuesta.ok || respuesta.status === 401;
    } catch {
      revocada = false;
    }
  }

  const cierre = await supabase.auth
    .signOut({ scope: "local" })
    .catch(() => null);
  await borrarCookiesSesion();
  redirect(
    `/ingresar?aviso=${revocada && cierre && !cierre.error ? "salida" : "salida-incompleta"}`,
  );
}
