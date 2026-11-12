"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { verificarVisita } from "./acciones";
import { fechaVisita, type Verificacion } from "./tipos";

export function EscanerVisita({ destino }: { destino?: string }) {
  const visor = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const controles = useRef<IScannerControls | null>(null);
  const generacion = useRef(0);
  const [estado, cambiarEstado] = useState<
    "listo" | "iniciando" | "activo" | "validando"
  >("listo");
  const [mensaje, cambiarMensaje] = useState("");
  const [codigoPendiente, cambiarCodigoPendiente] = useState("");
  const [resultado, cambiarResultado] = useState<Verificacion>();
  const [requiereSesion, cambiarRequiereSesion] = useState(false);

  useEffect(() => {
    if (estado !== "activo") return;
    const espera = window.setTimeout(
      () =>
        cambiarMensaje(
          "Aún no se detecta un QR legible. Acerca el código y céntralo en el visor.",
        ),
      12000,
    );
    return () => window.clearTimeout(espera);
  }, [estado]);

  useEffect(
    () => () => {
      generacion.current++;
      controles.current?.stop();
      flujo.current?.getTracks().forEach((pista) => pista.stop());
    },
    [],
  );

  function detener() {
    generacion.current++;
    controles.current?.stop();
    controles.current = null;
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
    if (visor.current) visor.current.srcObject = null;
  }

  async function validar(codigo: string) {
    cambiarEstado("validando");
    cambiarMensaje("");
    cambiarCodigoPendiente("");
    try {
      const respuesta = await verificarVisita(codigo, destino);
      if (respuesta.ok) {
        cambiarResultado(respuesta.datos);
      } else {
        cambiarMensaje(respuesta.mensaje);
        cambiarRequiereSesion(respuesta.estado === 401);
        if (respuesta.estado === 0 || respuesta.estado >= 500)
          cambiarCodigoPendiente(codigo);
      }
    } catch {
      cambiarMensaje("Se perdió la conexión. Intenta validar el QR otra vez.");
      cambiarCodigoPendiente(codigo);
    } finally {
      cambiarEstado("listo");
    }
  }

  async function activar() {
    const intento = ++generacion.current;
    cambiarEstado("iniciando");
    cambiarMensaje("");
    cambiarCodigoPendiente("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !visor.current) {
        throw new Error(
          "La cámara requiere un navegador compatible y una conexión HTTPS o localhost.",
        );
      }
      const camara = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      if (intento !== generacion.current) {
        camara.getTracks().forEach((pista) => pista.stop());
        return;
      }
      flujo.current = camara;
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (intento !== generacion.current || !visor.current) return;
      const lector = new BrowserQRCodeReader();
      const control = await lector.decodeFromStream(
        camara,
        visor.current,
        (lectura) => {
          if (!lectura || intento !== generacion.current) return;
          detener();
          void validar(lectura.getText());
        },
      );
      if (intento !== generacion.current) {
        control.stop();
        return;
      }
      controles.current = control;
      cambiarEstado("activo");
    } catch (error) {
      if (intento !== generacion.current) return;
      detener();
      cambiarEstado("listo");
      cambiarMensaje(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Permite el acceso a la cámara en los permisos del sitio y vuelve a intentarlo."
          : error instanceof Error && !navigator.mediaDevices?.getUserMedia
            ? error.message
            : "No pudimos abrir la cámara. Comprueba que esté disponible y vuelve a intentarlo.",
      );
    }
  }

  if (resultado) {
    return (
      <section
        className="space-y-3 rounded-3xl bg-teal-50 p-6"
        aria-live="polite"
      >
        <h2 className="text-2xl font-bold text-teal-950">
          {resultado.yaVerificada
            ? "Tu visita ya estaba verificada"
            : "Visita verificada"}
        </h2>
        <p>
          {resultado.destino.nombre} ·{" "}
          {fechaVisita.format(new Date(resultado.visita.verificadaEn))}
        </p>
        <p className="text-sm">
          Identificador de visita: {resultado.visita.id}
        </p>
        <Link
          href={enlaceFicha(resultado.destino.slug)}
          className="font-semibold text-teal-900 underline"
        >
          Volver a la ficha del destino
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-teal-950">
        <video
          ref={visor}
          muted
          playsInline
          aria-label="Visor de cámara"
          className="h-full w-full object-contain"
        />
        {(estado === "listo" || estado === "validando") && (
          <p className="absolute inset-0 grid place-items-center text-white">
            {estado === "validando"
              ? "Verificando visita…"
              : "Cámara desactivada"}
          </p>
        )}
      </div>
      {estado === "activo" || estado === "iniciando" ? (
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => {
            detener();
            cambiarEstado("listo");
          }}
        >
          Desactivar cámara
        </button>
      ) : (
        <button
          type="button"
          disabled={estado === "validando" || requiereSesion}
          onClick={() => void activar()}
          className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Activar cámara
        </button>
      )}
      {mensaje && (
        <p role="alert" className="text-red-800">
          {mensaje}
        </p>
      )}
      {requiereSesion && (
        <Link href="/ingresar?aviso=sesion" className="font-semibold underline">
          Iniciar sesión
        </Link>
      )}
      {codigoPendiente && (
        <button
          type="button"
          className="block font-semibold underline"
          onClick={() => void validar(codigoPendiente)}
        >
          Reintentar validación
        </button>
      )}
    </section>
  );
}
