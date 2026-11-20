"use client";
import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
export function LectorComprobante({
  onLeer,
}: {
  onLeer: (codigo: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const controles = useRef<IScannerControls>(null);
  const stream = useRef<MediaStream>(null);
  const generacion = useRef(0);
  const [activo, cambiarActivo] = useState(false);
  const [error, cambiarError] = useState("");
  function detener() {
    generacion.current++;
    controles.current?.stop();
    controles.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    cambiarActivo(false);
  }
  useEffect(
    () => () => {
      generacion.current++;
      controles.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  async function iniciar() {
    const intento = ++generacion.current;
    cambiarError("");
    cambiarActivo(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("camara");
      const camara = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (intento !== generacion.current) {
        camara.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = camara;
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (intento !== generacion.current || !video.current) return;
      const control = await new BrowserQRCodeReader().decodeFromStream(
        camara,
        video.current,
        (resultado) => {
          if (!resultado || intento !== generacion.current) return;
          const texto = resultado
            .getText()
            .trim()
            .replace(/^munay:canje:/i, "")
            .toUpperCase();
          if (!/^[A-F0-9]{32}$/.test(texto)) {
            cambiarError(
              "Este QR no corresponde a un comprobante de beneficio. Prueba otro código.",
            );
            return;
          }
          detener();
          onLeer(texto);
        },
      );
      if (intento !== generacion.current) control.stop();
      else controles.current = control;
    } catch {
      if (intento === generacion.current) {
        detener();
        cambiarError(
          "No pudimos abrir la cámara. Revisa el permiso del navegador o introduce el código manualmente.",
        );
      }
    }
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => (activo ? detener() : void iniciar())}
        className="min-h-11 rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed]"
      >
        {activo ? "Cerrar cámara" : "Escanear comprobante QR"}
      </button>
      <video
        ref={video}
        muted
        playsInline
        aria-label="Cámara para escanear comprobantes"
        className={
          activo
            ? "aspect-video w-full max-w-lg rounded-xl bg-[#14382e] object-cover"
            : "hidden"
        }
      />
      {error && (
        <p role="alert" className="text-sm text-rose-900">
          {error}
        </p>
      )}
    </div>
  );
}
