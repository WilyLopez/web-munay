"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { enlaceFicha } from "@/features/destinos/catalogo";
import { prepararVisita, verificarVisita } from "./acciones";
import { mensajeErrorCamara, solicitarCamaraVisita } from "./camara-visita";
import {
  ingresoParaVisita,
  leerCodigoQr,
  rutaEscanerVisita,
} from "./enlace-qr";
import {
  fechaVisita,
  type PreparacionVisita,
  type Verificacion,
} from "./tipos";
import { obtenerUbicacion } from "./ubicacion-visita";

type ResultadoEscaneo =
  | { modo: "real"; datos: Verificacion }
  | { modo: "demo"; fecha: string };

export function EscanerVisita({
  destino,
  codigoInicial,
  avisoInicial,
  demoHabilitada = false,
}: {
  destino?: string;
  codigoInicial?: string;
  avisoInicial?: string;
  demoHabilitada?: boolean;
}) {
  const visor = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const controles = useRef<IScannerControls | null>(null);
  const generacion = useRef(0);
  const [estado, cambiarEstado] = useState<
    | "listo"
    | "solicitando-camara"
    | "iniciando"
    | "activo"
    | "comprobando"
    | "ubicando"
    | "registrando"
  >(codigoInicial ? "comprobando" : "listo");
  const [mensaje, cambiarMensaje] = useState(avisoInicial ?? "");
  const [requiereNuevoQr, cambiarRequiereNuevoQr] = useState(false);
  const [codigoPendiente, cambiarCodigoPendiente] = useState("");
  const [resultado, cambiarResultado] = useState<ResultadoEscaneo>();
  const [enlaceIngreso, cambiarEnlaceIngreso] = useState<string>();
  const [preparacion, cambiarPreparacion] =
    useState<Extract<PreparacionVisita, { estado: "ubicacion" }>>();

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

  const comprobarQr = useCallback(async (valor: string) => {
    cambiarRequiereNuevoQr(false);
    const codigo = leerCodigoQr(valor, window.location.origin);
    if (!codigo) {
      cambiarEstado("listo");
      cambiarMensaje(
        "Este código no es un QR de visita de Munay. Escanea el que muestra el encargado.",
      );
      return;
    }
    const intento = ++generacion.current;
    cambiarEstado("comprobando");
    cambiarMensaje("");
    cambiarCodigoPendiente("");
    try {
      const respuesta = await prepararVisita(codigo, destino);
      if (intento !== generacion.current) return;
      if (respuesta.ok) {
        if (respuesta.datos.estado === "verificada") {
          cambiarResultado({ modo: "real", datos: respuesta.datos.datos });
        } else {
          cambiarCodigoPendiente(codigo);
          cambiarPreparacion(respuesta.datos);
        }
      } else {
        cambiarMensaje(respuesta.mensaje);
        cambiarRequiereNuevoQr([409, 410].includes(respuesta.estado));
        if (respuesta.estado === 401)
          cambiarEnlaceIngreso(ingresoParaVisita(destino, codigo));
        if (respuesta.estado === 0 || respuesta.estado >= 500)
          cambiarCodigoPendiente(codigo);
      }
    } catch {
      if (intento !== generacion.current) return;
      cambiarMensaje("Se perdió la conexión. Intenta validar el QR otra vez.");
      cambiarCodigoPendiente(codigo);
    } finally {
      if (intento === generacion.current) cambiarEstado("listo");
    }
  }, [destino]);

  useEffect(() => {
    if (!codigoInicial) return;
    const espera = window.setTimeout(() => void comprobarQr(codigoInicial), 0);
    return () => window.clearTimeout(espera);
  }, [codigoInicial, comprobarQr]);

  async function validarUbicacion() {
    if (!preparacion || !codigoPendiente) return;
    const intento = ++generacion.current;
    cambiarMensaje("");
    cambiarEstado("ubicando");
    try {
      const ubicacion = await obtenerUbicacion();
      if (intento !== generacion.current) return;
      cambiarEstado("registrando");
      const respuesta = await verificarVisita(
        codigoPendiente,
        ubicacion,
        destino,
      );
      if (intento !== generacion.current) return;
      if (respuesta.ok) {
        cambiarResultado({ modo: "real", datos: respuesta.datos });
      } else {
        cambiarMensaje(respuesta.mensaje);
        cambiarRequiereNuevoQr([409, 410].includes(respuesta.estado));
        if ([401, 403, 409, 410].includes(respuesta.estado)) {
          if (respuesta.estado === 401)
            cambiarEnlaceIngreso(ingresoParaVisita(destino, codigoPendiente));
          cambiarCodigoPendiente("");
          cambiarPreparacion(undefined);
        }
      }
    } catch (error) {
      if (intento !== generacion.current) return;
      cambiarMensaje(
        error instanceof Error
          ? error.message
          : "No pudimos verificar la ubicación. Intenta de nuevo.",
      );
    } finally {
      if (intento === generacion.current) cambiarEstado("listo");
    }
  }

  function cancelarUbicacion() {
    detener();
    cambiarPreparacion(undefined);
    cambiarCodigoPendiente("");
    cambiarMensaje("");
    cambiarEstado("listo");
  }

  async function activar() {
    const intento = ++generacion.current;
    cambiarEstado("solicitando-camara");
    cambiarMensaje("");
    cambiarCodigoPendiente("");
    try {
      const camara = await solicitarCamaraVisita(navigator.mediaDevices);
      if (intento !== generacion.current) {
        camara.getTracks().forEach((pista) => pista.stop());
        return;
      }
      flujo.current = camara;
      cambiarEstado("iniciando");
      for (const pista of camara.getVideoTracks()) {
        pista.addEventListener(
          "ended",
          () => {
            if (intento !== generacion.current) return;
            detener();
            cambiarEstado("listo");
            cambiarMensaje(
              "Se interrumpió la cámara. Vuelve a activarla para escanear el QR.",
            );
          },
          { once: true },
        );
      }
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (intento !== generacion.current || !visor.current) return;
      const lector = new BrowserQRCodeReader();
      const control = await lector.decodeFromStream(
        camara,
        visor.current,
        (lectura) => {
          if (!lectura || intento !== generacion.current) return;
          detener();
          void comprobarQr(lectura.getText());
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
      cambiarMensaje(mensajeErrorCamara(error));
    }
  }

  if (codigoInicial && !resultado && !preparacion) {
    return (
      <section className="space-y-4 rounded-3xl border border-teal-200 bg-teal-50 p-6">
        <h2 className="font-serif text-2xl">{requiereNuevoQr ? "Escanea el código actualizado" : "Código de visita detectado"}</h2>
        <p role="status" className="text-sm">
          {estado === "comprobando"
            ? "Estamos comprobando el código del destino…"
            : requiereNuevoQr
              ? "Pide al encargado que te muestre el QR vigente."
              : "Comprueba el código para continuar con la ubicación."}
        </p>
        {mensaje && (
          <p role="alert" className="text-sm text-rose-900">
            {mensaje}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          {enlaceIngreso ? (
            <Link
              href={enlaceIngreso}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-5 py-2.5 font-semibold text-white"
            >
              Iniciar sesión para continuar
            </Link>
          ) : !requiereNuevoQr && estado !== "comprobando" ? (
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-5 py-2.5 font-semibold text-white active:scale-95 transition-transform disabled:opacity-60"
              onClick={() => void comprobarQr(codigoInicial)}
            >
              Reintentar comprobación
            </button>
          ) : null}
          <Link
            href={rutaEscanerVisita(destino)}
            className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
          >
            Escanear otro QR
          </Link>
        </div>
      </section>
    );
  }

  if (resultado?.modo === "demo") {
    return (
      <section className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <div role="status" className="space-y-2">
          <p className="text-sm font-semibold text-amber-900">
            Modo demostración
          </p>
          <h2 className="text-2xl font-bold text-teal-950">
            Visita de prueba verificada
          </h2>
          <p>
            Atractivo de demostración ·{" "}
            {fechaVisita.format(new Date(resultado.fecha))}
          </p>
          <p className="text-sm">Identificador de prueba: DEMO-MUNAY-001</p>
          <p className="text-sm">
            Este resultado es de práctica. Para habilitar una reseña, verifica
            tu visita con el QR del atractivo.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold hover:bg-amber-100 active:scale-95 transition-transform"
          onClick={() => cambiarResultado(undefined)}
        >
          Volver al escáner
        </button>
      </section>
    );
  }

  if (resultado?.modo === "real") {
    const { datos } = resultado;
    return (
      <section
        className="space-y-4 rounded-3xl bg-teal-50 p-6"
      >
        <div role="status" className="space-y-2">
          <p className="text-sm font-semibold text-emerald-900">Visita verificada</p>
          <h2 className="font-serif text-3xl text-teal-950">Tu visita quedó guardada</h2>
          <p className="font-semibold text-teal-950">{datos.destino.nombre}</p>
          <p className="text-sm text-stone-700">
            {fechaVisita.format(new Date(datos.visita.verificadaEn))}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-stone-700">
          Puedes escribir una reseña ahora o volver a la página del destino más tarde.
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:gap-4">
          <Link href={`${enlaceFicha(datos.destino.slug)}#opiniones`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-5 font-semibold text-white hover:bg-teal-800">
            {datos.yaVerificada ? "Ver o escribir reseña" : "Escribir reseña"}
          </Link>
          <Link href={enlaceFicha(datos.destino.slug)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-teal-200 bg-white px-5 font-semibold text-teal-950 hover:bg-teal-100">
            Ahora no
          </Link>
        </div>
      </section>
    );
  }

  if (preparacion) {
    const solicitando = estado === "ubicando";
    const registrando = estado === "registrando";
    return (
      <section className="space-y-4 rounded-3xl border border-teal-200 bg-white p-5 sm:p-7">
        <p className="text-sm font-semibold text-emerald-900">QR comprobado</p>
        <h2 className="font-serif text-3xl text-teal-950">Confirma tu ubicación</h2>
        <p className="font-semibold text-teal-950">{preparacion.destino.nombre}</p>
        <p role="status" className="text-sm font-semibold text-teal-950">
          {registrando
            ? "Ubicación obtenida. Comprobando el radio y registrando la visita…"
            : solicitando
              ? "Solicitando ubicación…"
              : "Permite el acceso a tu ubicación para guardar la visita."}
        </p>
        <p className="text-sm">
          Tienes cinco minutos desde la lectura válida para confirmar tu
          ubicación, aunque el QR de la pantalla cambie.
        </p>
        <p className="text-sm">
          Usaremos tu ubicación solo para confirmar que estás a{" "}
          {preparacion.radioMetros} m o menos del atractivo. Las coordenadas no
          se guardan ni se comparten con proveedores de mapas.
        </p>
        {mensaje && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-950">
            {mensaje}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={solicitando || registrando}
            onClick={() => void validarUbicacion()}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-5 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
          >
            {mensaje ? "Intentar de nuevo" : "Permitir ubicación"}
          </button>
          {!registrando && (
            <button
              type="button"
              className="inline-flex min-h-12 items-center text-sm font-semibold underline hover:text-[#0b6b52]"
              onClick={cancelarUbicacion}
            >
              Cancelar
            </button>
          )}
          {!solicitando && !registrando && mensaje && (
            <>
              <Link
                href={`${enlaceFicha(preparacion.destino.slug)}#como-llegar`}
                className="inline-flex min-h-12 items-center text-sm font-semibold underline hover:text-[#0b6b52]"
              >
                Cómo llegar
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center text-sm font-semibold underline hover:text-[#0b6b52]"
              >
                Volver al inicio
              </Link>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-4 sm:p-6">
      <div>
        <h2 className="font-serif text-2xl text-teal-950">Escanea el QR del destino</h2>
        <p className="mt-1 text-sm text-stone-700">Centra el código en el visor. Después podrás confirmar dónde estás.</p>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-teal-950">
        <video
          ref={visor}
          muted
          playsInline
          aria-label="Visor de cámara"
          className="h-full w-full object-contain"
        />
        {estado === "activo" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="aspect-square w-[42%] rounded-2xl border-2 border-white shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
          </div>
        )}
        {estado !== "activo" && (
          <p
            role="status"
            className="absolute inset-0 grid place-items-center px-6 text-center text-white"
          >
            {estado === "solicitando-camara"
              ? "Si tu navegador solicita acceso a la cámara, pulsa «Permitir»."
              : estado === "iniciando"
                ? "Preparando el escáner…"
                : estado === "comprobando"
                  ? "Comprobando QR…"
                  : "Cámara desactivada"}
          </p>
        )}
      </div>
      {estado === "comprobando" ? (
        <button
          type="button"
          className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
          onClick={cancelarUbicacion}
        >
          Cancelar
        </button>
      ) : estado === "activo" ||
        estado === "iniciando" ||
        estado === "solicitando-camara" ? (
        <button
          type="button"
          className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
          onClick={() => {
            detener();
            cambiarEstado("listo");
          }}
        >
          {estado === "activo"
            ? "Desactivar cámara"
            : "Cancelar apertura de cámara"}
        </button>
      ) : (
        <button
          type="button"
          disabled={Boolean(enlaceIngreso)}
          onClick={() => void activar()}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-950 px-6 py-3 font-semibold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
        >
          Activar cámara
        </button>
      )}
      {mensaje && (
        <p role="alert" className="text-red-800">
          {mensaje}
        </p>
      )}
      {enlaceIngreso && (
        <Link
          href={enlaceIngreso}
          className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
        >
          Iniciar sesión para continuar
        </Link>
      )}
      {codigoPendiente && (
        <button
          type="button"
          className="inline-flex min-h-12 items-center font-semibold underline hover:text-[#0b6b52]"
          onClick={() => void comprobarQr(codigoPendiente)}
        >
          Reintentar validación
        </button>
      )}
      {demoHabilitada && !enlaceIngreso && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-950">
            Practica el escaneo con datos de prueba, sin usar la cámara.
          </p>
          <button
            type="button"
            disabled={estado === "comprobando"}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold hover:bg-amber-100 active:scale-95 transition-transform disabled:opacity-50"
            onClick={() => {
              detener();
              cambiarEstado("listo");
              cambiarMensaje("");
              cambiarCodigoPendiente("");
              cambiarResultado({
                modo: "demo",
                fecha: new Date().toISOString(),
              });
            }}
          >
            Simular escaneo inmediato
          </button>
        </div>
      )}
    </section>
  );
}
