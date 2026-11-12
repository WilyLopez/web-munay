export type EstadoFormulario = {
  mensaje?: string;
  errores?: Partial<
    Record<
      | "nombreCompleto"
      | "correoElectronico"
      | "contrasena"
      | "confirmarContrasena"
      | "aceptaCondiciones",
      string
    >
  >;
};

export function leerCampo(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

export function validarCredenciales(datos: FormData, registro: boolean) {
  const correoElectronico = leerCampo(datos, "correoElectronico").trim();
  const contrasena = leerCampo(datos, "contrasena");
  const nombreCompleto = leerCampo(datos, "nombreCompleto").trim();
  const confirmarContrasena = leerCampo(datos, "confirmarContrasena");
  const errores: NonNullable<EstadoFormulario["errores"]> = {};

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoElectronico) ||
    correoElectronico.length > 254
  ) {
    errores.correoElectronico = "Ingresa un correo electrónico válido.";
  }

  if (!contrasena) {
    errores.contrasena = "Ingresa tu contraseña.";
  } else if (registro && contrasena.length < 8) {
    errores.contrasena = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (registro) {
    if (!nombreCompleto || nombreCompleto.length > 120) {
      errores.nombreCompleto =
        "Ingresa tu nombre completo, hasta 120 caracteres.";
    }

    if (!confirmarContrasena) {
      errores.confirmarContrasena = "Confirma tu contraseña.";
    } else if (contrasena !== confirmarContrasena) {
      errores.confirmarContrasena = "Las contraseñas no coinciden.";
    }

    if (datos.get("aceptaCondiciones") !== "on") {
      errores.aceptaCondiciones =
        "Debes aceptar las condiciones para continuar.";
    }
  }

  return { correoElectronico, contrasena, nombreCompleto, errores };
}
