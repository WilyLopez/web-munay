"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { generarEnlaceQr } from "./enlace-qr";

export function ModalAficheImprimible({
  nombreDestino,
  codigoValor,
}: {
  nombreDestino: string;
  codigoValor: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (abierto && lienzo.current && codigoValor) {
      void QRCode.toCanvas(
        lienzo.current,
        generarEnlaceQr(codigoValor, window.location.origin),
        {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#11342c",
            light: "#ffffff",
          },
        },
      );
    }
  }, [abierto, codigoValor]);

  const imprimir = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#ccd9cf] bg-white px-4 text-sm font-semibold text-[#173b32] hover:bg-[#edf3ec]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-4"
          aria-hidden="true"
        >
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
        Imprimir afiche QR
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:p-0 print:bg-white">
          <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl print:max-h-none print:w-full print:max-w-none print:shadow-none print:rounded-none">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 print:hidden">
              <h2 className="text-lg font-bold text-[#173b32]">
                Afiche oficial de visita (A4)
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={imprimir}
                  className="rounded-xl bg-[#174238] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23574a]"
                >
                  Imprimir ahora
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-12 print:p-8">
              <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border-2 border-[#11342c] bg-[#fbfcf8] p-8 text-center print:border-2 print:border-black">
                <div className="flex items-center gap-3">
                  <Image
                    src="/marca/logo-secundario.png"
                    alt="Munay"
                    width={48}
                    height={48}
                    className="rounded-xl bg-[#11342c] p-1.5 object-contain"
                  />
                  <div className="text-left">
                    <p className="font-serif text-2xl font-bold text-[#11342c]">
                      Munay
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4d665b]">
                      Turismo Inteligente
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#174238]">
                    Punto de Control Turístico
                  </p>
                  <h1 className="font-serif text-3xl font-bold tracking-tight text-[#11342c] sm:text-4xl">
                    {nombreDestino}
                  </h1>
                  <p className="text-sm text-[#4d665b]">
                    Registra tu visita oficial y valida tu experiencia en este
                    atractivo.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border-4 border-[#174238] bg-white p-3 shadow-md print:shadow-none">
                  <canvas
                    ref={lienzo}
                    role="img"
                    aria-label={`Código QR para registrar visita en ${nombreDestino}`}
                    className="block h-auto! max-w-full"
                  />
                </div>

                <div className="mt-8 w-full space-y-3 rounded-2xl bg-white p-4 text-left border border-[#dce3da]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#173b32]">
                    Instrucciones para el visitante:
                  </p>
                  <ol className="space-y-2 text-xs text-[#3a5247]">
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#174238] font-bold text-white text-[10px]">
                        1
                      </span>
                      <span>
                        Abre la cámara de tu celular o la app de Munay y escanea
                        el código.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#174238] font-bold text-white text-[10px]">
                        2
                      </span>
                      <span>
                        Confirma tu ubicación en este atractivo para verificar
                        tu presencia.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#174238] font-bold text-white text-[10px]">
                        3
                      </span>
                      <span>
                        Obtén tu sello digital de visita y accede a beneficios en
                        locales asociados.
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="mt-6 flex items-center justify-between w-full border-t border-[#dce3da] pt-4 text-[10px] text-[#4d665b]">
                  <span>Verificación garantizada</span>
                  <span>munay.pe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
