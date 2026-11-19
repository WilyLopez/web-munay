"use server";

import { revalidatePath, updateTag } from "next/cache";
import { gruposInformacion } from "@/features/destinos/informacion";
import { crearSupabaseServidor } from "@/features/autenticacion/supabase/servidor";
import { solicitarVisitas } from "@/features/visitas/api";

export async function prepararSubidaDestino(id: string, tipo: string) {
  const extensiones: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensiones[tipo];
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id) || !extension)
    return { error: "Selecciona una imagen JPG, PNG o WebP." };
  const supabase = await crearSupabaseServidor();
  const archivo = `${id}/${crypto.randomUUID()}.${extension}`;
  const almacen = supabase.storage.from("destinos");
  const respuesta = await almacen.createSignedUploadUrl(archivo);
  if (respuesta.error)
    return {
      error:
        "No pudimos preparar la subida. Comprueba tu sesión e inténtalo de nuevo.",
    };
  return {
    archivo,
    token: respuesta.data.token,
    url: almacen.getPublicUrl(archivo).data.publicUrl,
  };
}

export async function limpiarFotosDestino(slug: string, urls: string[]) {
  if (!Array.isArray(urls) || urls.length > 100) return { error: true };
  const ficha = await solicitarVisitas<{
    id: string;
    imagenUrl: string | null;
    fotosAdicionales: string[];
    informacion?: { galeria?: { url: string }[] };
  }>(`/destinos/administracion/${encodeURIComponent(slug)}/ficha`);
  if (!ficha.ok) return { error: true };
  const supabase = await crearSupabaseServidor();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const prefijo = `${base}/storage/v1/object/public/destinos/`;
  const usados = new Set([
    ficha.datos.imagenUrl,
    ...ficha.datos.fotosAdicionales,
    ...(ficha.datos.informacion?.galeria?.map((foto) => foto.url) ?? []),
  ]);
  const archivos = [...new Set(urls)]
    .filter(
      (url) =>
        typeof url === "string" &&
        !usados.has(url) &&
        url.startsWith(`${prefijo}${ficha.datos.id}/`) &&
        /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
          url.slice(`${prefijo}${ficha.datos.id}/`.length),
        ),
    )
    .map((url) => url.slice(prefijo.length));
  if (!archivos.length) return { error: false };
  const { error } = await supabase.storage.from("destinos").remove(archivos);
  return { error: !!error };
}

export async function limpiarFotosAntiguasDestino(
  slug: string,
  protegidas: string[] = [],
) {
  const ficha = await solicitarVisitas<{ id: string }>(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
  );
  if (!ficha.ok || !Array.isArray(protegidas) || protegidas.length > 100)
    return { error: true };
  const supabase = await crearSupabaseServidor();
  const { data, error } = await supabase.storage
    .from("destinos")
    .list(ficha.datos.id, {
      limit: 50,
      sortBy: { column: "created_at", order: "asc" },
    });
  if (error) return { error: true };
  const limite = Date.now() - 7 * 86400000;
  const candidatas = (data ?? [])
    .filter(
      (foto) =>
        /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(foto.name) &&
        typeof foto.created_at === "string" &&
        new Date(foto.created_at).getTime() < limite,
    )
    .map(
      (foto) =>
        supabase.storage
          .from("destinos")
          .getPublicUrl(`${ficha.datos.id}/${foto.name}`).data.publicUrl,
    )
    .filter((url) => !protegidas.includes(url));
  if (!candidatas.length) return { error: false };
  return limpiarFotosDestino(slug, candidatas);
}

export async function guardarFichaOperativa(
  slug: string,
  _estado: { mensaje: string; error: boolean },
  formulario: FormData,
) {
  const leer = (campo: string) => {
    const valor = formulario.get(campo);
    return typeof valor === "string"
      ? valor.replace(/\r\n/g, "\n").trim() || null
      : null;
  };
  const numero = (campo: string) => {
    const valor = leer(campo);
    return valor === null ? null : Number(valor);
  };
  const fotos = ["url", "alt", "descripcion", "autor", "licencia"];
  const galeria = formulario
    .getAll("foto-url")
    .flatMap((url, indice) =>
      typeof url === "string" && url.trim()
        ? [
            Object.fromEntries(
              fotos.map((campo) => [
                campo,
                String(formulario.getAll(`foto-${campo}`)[indice] ?? "").trim(),
              ]),
            ),
          ]
        : [],
    );
  const informacion = Object.fromEntries(
    gruposInformacion.flatMap(([, campos]) =>
      campos.map(([clave]) => [clave, leer(clave)]),
    ),
  );
  const enviarRevision = formulario.get("decision") === "revision";
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/ficha`,
    {
      horario: leer("horario"),
      diasAtencion: formulario.getAll("diasAtencion").map(Number),
      tarifaGeneral: leer("tarifaGeneral")?.replace(",", ".") ?? null,
      tarifaEstudiantes: leer("tarifaEstudiantes")?.replace(",", ".") ?? null,
      enviarRevision,
      version: leer("version"),
      datos: {
        ...Object.fromEntries(
          [
            "nombre",
            "descripcion",
            "ubicacion",
            "categoria",
            "provincia",
            "imagenUrl",
            "rutaDesdeChiclayo",
            "fuenteRutaUrl",
            "recomendacion",
          ].map((campo) => [campo, leer(campo)]),
        ),
        latitud: numero("latitud"),
        longitud: numero("longitud"),
        distanciaKm: numero("distanciaKm"),
        duracionMinutos: numero("duracionMinutos"),
      },
      informacion: { ...informacion, galeria },
    },
    { metodo: "PUT" },
  );
  if (!resultado.ok)
    return {
      mensaje: resultado.mensaje,
      error: true,
      campos: resultado.campos,
      conflicto: resultado.estado === 409,
    };
  updateTag("destinos");
  revalidatePath(`/administracion/atractivos/${encodeURIComponent(slug)}`);
  revalidatePath("/destinos");
  revalidatePath(`/destinos/${encodeURIComponent(slug)}`);
  return {
    mensaje: enviarRevision
      ? "Destino enviado a revisión."
      : "Cambios guardados.",
    error: false,
  };
}

export async function resolverFichaDestino(
  slug: string,
  _estado: { mensaje: string; error: boolean },
  datos: FormData,
) {
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/estado`,
    { estado: datos.get("estado") },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { mensaje: resultado.mensaje, error: true };
  updateTag("destinos");
  revalidatePath("/superadmin/destinos");
  revalidatePath(`/superadmin/destinos/${encodeURIComponent(slug)}`);
  return { mensaje: "Estado actualizado.", error: false };
}

export async function cambiarVisibilidadAtractivo(
  slug: string,
  habilitar: boolean,
) {
  const resultado = await solicitarVisitas(
    `/destinos/administracion/${encodeURIComponent(slug)}/visibilidad`,
    { habilitar },
    { metodo: "PUT" },
  );
  if (!resultado.ok) return { error: true, mensaje: resultado.mensaje };
  updateTag("destinos");
  revalidatePath("/administracion", "layout");
  revalidatePath("/superadmin", "layout");
  revalidatePath("/");
  revalidatePath("/destinos", "layout");
  revalidatePath("/mapas");
  revalidatePath("/resenas");
  revalidatePath("/pantalla-qr");
  return {
    error: false,
    mensaje: habilitar
      ? "Tu atractivo ya está habilitado en el sitio público."
      : "Tu atractivo está deshabilitado. Puedes habilitarlo de nuevo desde aquí.",
  };
}
