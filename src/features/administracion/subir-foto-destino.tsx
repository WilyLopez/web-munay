"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useState } from "react";
import { obtenerConfiguracionSupabase } from "@/features/autenticacion/supabase/configuracion";
import { prepararSubidaDestino } from "./ficha-operativa";

export function SubirFotoDestino({
  destinoId,
  nombre,
  valor,
  etiqueta,
  requerido,
  cambiarOcupacion,
  alSubir,
}: {
  destinoId: string;
  nombre: string;
  valor?: string | null;
  etiqueta: string;
  requerido?: boolean;
  cambiarOcupacion: (variacion: number) => void;
  alSubir?: (url: string) => void;
}) {
  const [enlace, cambiarEnlace] = useState(valor ?? "");
  const [modo, cambiarModo] = useState<"subir" | "enlace">("subir");
  const [inputEnlace, cambiarInputEnlace] = useState(valor ?? "");
  const [prevValor, cambiarPrevValor] = useState(valor);
  const [subiendo, cambiarSubiendo] = useState(false);
  const [mensaje, cambiarMensaje] = useState("");

  if (valor !== prevValor) {
    cambiarPrevValor(valor);
    cambiarEnlace(valor ?? "");
    cambiarInputEnlace(valor ?? "");
  }

  async function subir(foto: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(foto.type) ||
      !foto.size ||
      foto.size > 5 * 1024 * 1024
    ) {
      cambiarMensaje("Elige una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    cambiarMensaje("");
    cambiarSubiendo(true);
    cambiarOcupacion(1);
    try {
      const imagen = await createImageBitmap(foto);
      if (
        !imagen.width ||
        !imagen.height ||
        imagen.width * imagen.height > 40000000
      ) {
        imagen.close();
        throw new Error("Elige una foto de hasta 40 megapíxeles.");
      }
      const escala = Math.min(1, 2000 / Math.max(imagen.width, imagen.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      const contexto = lienzo.getContext("2d");
      if (!contexto) {
        imagen.close();
        throw new Error("No pudimos preparar la imagen. Prueba con otra foto.");
      }
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      imagen.close();
      const optimizada = await new Promise<Blob | null>((resolver) =>
        lienzo.toBlob(resolver, "image/webp", 0.85),
      );
      if (!optimizada)
        throw new Error("No pudimos preparar la imagen. Prueba con otra foto.");
      const subida = await prepararSubidaDestino(destinoId, optimizada.type);
      if (!subida.token) throw new Error(subida.error);
      const { url, clave } = obtenerConfiguracionSupabase();
      const supabase = createClient(url, clave, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      const { error } = await supabase.storage
        .from("destinos")
        .uploadToSignedUrl(subida.archivo, subida.token, optimizada, {
          contentType: optimizada.type,
          cacheControl: "86400",
        });
      if (error) throw new Error("No pudimos subir la imagen.");
      cambiarEnlace(subida.url);
      cambiarInputEnlace(subida.url);
      alSubir?.(subida.url);
    } catch (error) {
      cambiarMensaje(
        error instanceof Error ? error.message : "No pudimos subir la imagen.",
      );
    } finally {
      cambiarSubiendo(false);
      cambiarOcupacion(-1);
    }
  }

  function aplicarEnlaceManual() {
    const limpio = inputEnlace.trim();
    if (!limpio) {
      cambiarMensaje("Ingresa un enlace para la foto.");
      return;
    }
    const esHttps = URL.canParse(limpio) && new URL(limpio).protocol === "https:";
    const esLocal = /^\/(?!\/)[\w./%-]+$/.test(limpio);
    if (!esHttps && !esLocal) {
      cambiarMensaje("Ingresa un enlace HTTPS válido o una ruta local iniciada con «/».");
      return;
    }
    cambiarMensaje("");
    cambiarEnlace(limpio);
    alSubir?.(limpio);
  }

  return (
    <div className="space-y-3 rounded-xl border border-teal-900/15 bg-stone-50 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-teal-950">{etiqueta}</span>
        <div className="flex rounded-lg border border-teal-900/20 bg-white p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => cambiarModo("subir")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              modo === "subir"
                ? "bg-teal-900 text-white font-semibold"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => cambiarModo("enlace")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              modo === "enlace"
                ? "bg-teal-900 text-white font-semibold"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            Enlace / URL
          </button>
        </div>
      </div>

      {modo === "subir" ? (
        <label className="grid gap-1.5 text-xs">
          <span className="text-stone-600">Selecciona una imagen desde tu dispositivo:</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={subiendo}
            className="min-w-0 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:font-semibold file:text-teal-950 hover:file:bg-teal-200 cursor-pointer"
            onChange={(evento) => {
              const foto = evento.target.files?.[0];
              if (foto) void subir(foto);
              evento.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="grid gap-1.5 text-xs">
          <span className="text-stone-600">Ingresa la URL pública de la imagen (HTTPS o ruta local):</span>
          <div className="flex gap-2">
            <input
              type="url"
              value={inputEnlace}
              placeholder="https://ejemplo.com/foto.webp"
              onChange={(e) => cambiarInputEnlace(e.target.value)}
              className="flex-1 rounded-lg border border-teal-900/20 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-2 focus:outline-teal-800"
            />
            <button
              type="button"
              onClick={aplicarEnlaceManual}
              className="rounded-lg bg-teal-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Input oculto que envía el valor final en el formulario */}
      <input type="hidden" name={nombre} value={enlace} />

      {subiendo && (
        <p role="status" className="text-xs text-teal-800 font-medium animate-pulse">
          Subiendo foto a Supabase…
        </p>
      )}

      {mensaje && (
        <p role="alert" className="text-xs text-rose-800 font-medium">
          {mensaje}
        </p>
      )}

      {enlace ? (
        <div className="space-y-2 pt-1">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-stone-200">
            <Image
              src={enlace}
              alt="Vista previa de la imagen seleccionada"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <a
              href={enlace}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-teal-900 underline underline-offset-2"
            >
              Ver imagen original ↗
            </a>
            {!requerido && (
              <button
                type="button"
                disabled={subiendo}
                className="font-semibold text-rose-800 underline underline-offset-2 hover:text-rose-950"
                onClick={() => {
                  cambiarEnlace("");
                  cambiarInputEnlace("");
                  cambiarOcupacion(0);
                }}
              >
                Quitar imagen
              </button>
            )}
          </div>
        </div>
      ) : (
        !subiendo && (
          <p className="text-[11px] text-stone-500">
            JPG, PNG o WebP · tamaño recomendado hasta 2000px · máx. 5 MB
          </p>
        )
      )}
    </div>
  );
}
