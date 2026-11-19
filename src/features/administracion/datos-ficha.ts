import {
  gruposInformacion,
  type InformacionDestino,
} from "@/features/destinos/informacion";
import type { FichaOperativa } from "./formulario-ficha";

export function construirPrevia(
  ficha: FichaOperativa,
  datos: FormData,
): FichaOperativa {
  const texto = (clave: string) =>
    String(datos.get(clave) ?? "")
      .replace(/\r\n/g, "\n")
      .trim();
  const numero = (clave: string) =>
    texto(clave) ? Number(texto(clave)) : null;
  const informacion: InformacionDestino = Object.fromEntries(
    gruposInformacion.flatMap(([, campos]) =>
      campos.map(([clave]) => [clave, texto(clave)]),
    ),
  );
  informacion.galeria = datos
    .getAll("foto-url")
    .map((url, indice) =>
      Object.fromEntries(
        ["url", "alt", "descripcion", "autor", "licencia"].map((clave) => [
          clave,
          String(
            clave === "url"
              ? url
              : (datos.getAll(`foto-${clave}`)[indice] ?? ""),
          ),
        ]),
      ),
    ) as InformacionDestino["galeria"];
  return {
    ...ficha,
    nombre: texto("nombre"),
    descripcion: texto("descripcion"),
    ubicacion: texto("ubicacion"),
    categoria: (texto("categoria") ||
      ficha.categoria) as FichaOperativa["categoria"],
    provincia: (texto("provincia") ||
      ficha.provincia) as FichaOperativa["provincia"],
    latitud: numero("latitud") ?? ficha.latitud,
    longitud: numero("longitud") ?? ficha.longitud,
    imagenUrl: texto("imagenUrl") || null,
    fotosAdicionales: informacion.galeria?.map((foto) => foto.url) ?? [],
    horario: texto("horario") || null,
    diasAtencion: datos.getAll("diasAtencion").map(Number),
    tarifaGeneral: texto("tarifaGeneral") || null,
    tarifaEstudiantes: texto("tarifaEstudiantes") || null,
    rutaDesdeChiclayo: texto("rutaDesdeChiclayo") || null,
    distanciaKm: numero("distanciaKm"),
    duracionMinutos: numero("duracionMinutos"),
    fuenteRutaUrl: texto("fuenteRutaUrl") || null,
    recomendacion: texto("recomendacion") || null,
    informacion,
  };
}

export function erroresFicha(datos: FormData, publicar = false) {
  const valor = (clave: string) => String(datos.get(clave) ?? "").trim();
  const errores: Record<string, string> = {};
  const hoy = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
  }).format(new Date());
  if (valor("reapertura") && valor("reapertura") < hoy)
    errores.reapertura = "Actualiza la reapertura: la fecha indicada ya pasó.";
  for (const [clave, limite] of [
    ["latitudIngreso", 90],
    ["longitudIngreso", 180],
  ] as const)
    if (
      valor(clave) &&
      (!Number.isFinite(Number(valor(clave))) ||
        Math.abs(Number(valor(clave))) > limite)
    )
      errores[clave] = "Introduce una coordenada válida.";
  if (valor("modalidadIngreso") === "libre")
    for (const clave of ["tarifaGeneral", "tarifaEstudiantes"]) {
      if (Number(valor(clave)) > 0)
        errores[clave] = "La entrada libre no admite una tarifa mayor a cero.";
    }
  if (
    publicar &&
    valor("modalidadIngreso") === "pago" &&
    !(Number(valor("tarifaGeneral")) > 0)
  )
    errores.tarifaGeneral = "Indica la tarifa general de ingreso.";
  if (
    valor("modalidadIngreso") === "reserva" &&
    !["reservaUrl", "telefono", "whatsapp", "correo"].some((clave) =>
      valor(clave),
    )
  )
    errores.reservaUrl =
      "Indica un enlace o un contacto oficial para reservar.";
  if (
    ["cerrado", "restringido"].includes(valor("condicion")) &&
    !valor("motivoCierre")
  )
    errores.motivoCierre = "Explica el motivo del cierre o restricción.";
  if (valor("reapertura") && valor("condicion") === "abierto")
    errores.reapertura = "Retira la reapertura si el atractivo está abierto.";
  if ((valor("avisoDesde") || valor("avisoHasta")) && !valor("aviso"))
    errores.aviso = "Escribe el mensaje de este aviso.";
  if (valor("aviso") && !valor("avisoDesde"))
    errores.avisoDesde = "Indica cuándo comienza el aviso.";
  if (valor("aviso") && !valor("avisoHasta"))
    errores.avisoHasta = "Indica cuándo termina el aviso.";
  if (
    valor("avisoDesde") &&
    valor("avisoHasta") &&
    valor("avisoHasta") < valor("avisoDesde")
  )
    errores.avisoHasta =
      "La fecha final debe ser igual o posterior a la inicial.";
  if (Boolean(valor("latitudIngreso")) !== Boolean(valor("longitudIngreso")))
    errores[valor("latitudIngreso") ? "longitudIngreso" : "latitudIngreso"] =
      "Completa ambas coordenadas de entrada.";
  if (publicar)
    for (const clave of [
      "distrito",
      "imagenUrl",
      "condicion",
      "modalidadIngreso",
    ])
      if (!valor(clave))
        errores[clave] = "Completa este dato antes de enviar a revisión.";
  for (const [clave, dominio] of Object.entries({
    facebook: "facebook.com",
    instagram: "instagram.com",
    tiktok: "tiktok.com",
    youtube: "youtube.com",
  })) {
    if (!valor(clave)) continue;
    try {
      const url = new URL(valor(clave));
      const dominios =
        clave === "youtube"
          ? [dominio, "youtu.be"]
          : clave === "facebook"
            ? [dominio, "fb.com"]
            : [dominio];
      if (
        url.protocol !== "https:" ||
        !dominios.some(
          (d) => url.hostname === d || url.hostname.endsWith(`.${d}`),
        )
      )
        errores[clave] = "Usa un enlace HTTPS de esta red social.";
    } catch {
      errores[clave] = "Introduce un enlace válido.";
    }
  }
  return errores;
}

export function advertenciaUbicacion(ficha: FichaOperativa) {
  const lat = ficha.informacion?.latitudIngreso,
    lng = ficha.informacion?.longitudIngreso;
  if (!lat || !lng) return null;
  const rad = Math.PI / 180;
  const a =
    Math.sin(((Number(lat) - ficha.latitud) * rad) / 2) ** 2 +
    Math.cos(ficha.latitud * rad) *
      Math.cos(Number(lat) * rad) *
      Math.sin(((Number(lng) - ficha.longitud) * rad) / 2) ** 2;
  const metros = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return metros > 1000
    ? "La entrada está a más de 1 km del punto del atractivo. Comprueba ambos puntos para evitar problemas con la verificación de visitas."
    : null;
}

export function resumirCambios(
  anterior: FichaOperativa,
  siguiente: FichaOperativa,
) {
  const normalizar = (valor: unknown) =>
    String(valor ?? "")
      .replace(/\r\n/g, "\n")
      .trim();
  const etiquetas = {
    nombre: "Nombre",
    descripcion: "Descripción",
    ubicacion: "Ubicación",
    categoria: "Categoría",
    provincia: "Provincia",
    latitud: "Latitud",
    longitud: "Longitud",
    imagenUrl: "Portada",
    horario: "Horario",
    tarifaGeneral: "Tarifa general",
    tarifaEstudiantes: "Tarifa para estudiantes",
    rutaDesdeChiclayo: "Ruta desde Chiclayo",
    distanciaKm: "Distancia",
    duracionMinutos: "Duración del trayecto",
    fuenteRutaUrl: "Fuente del trayecto",
    recomendacion: "Recomendaciones",
  } as const;
  const cambios: string[] = Object.entries(etiquetas)
    .filter(
      ([clave]) =>
        normalizar(anterior[clave as keyof typeof etiquetas]) !==
        normalizar(siguiente[clave as keyof typeof etiquetas]),
    )
    .map(([, etiqueta]) => etiqueta);
  for (const [, campos] of gruposInformacion)
    for (const [clave, etiqueta] of campos)
      if (
        normalizar(anterior.informacion?.[clave]) !==
        normalizar(siguiente.informacion?.[clave])
      )
        cambios.push(etiqueta);
  if (
    JSON.stringify(anterior.diasAtencion) !==
    JSON.stringify(siguiente.diasAtencion)
  )
    cambios.push("Días de atención");
  if (
    JSON.stringify(anterior.informacion?.galeria ?? []) !==
    JSON.stringify(siguiente.informacion?.galeria ?? [])
  )
    cambios.push("Galería y orden de fotos");
  return cambios;
}
