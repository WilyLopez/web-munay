"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  type Coordenadas,
  type PreparacionVisita,
  type Verificacion,
} from "./tipos";
import { obtenerUbicacion } from "./ubicacion-visita";

const MapaGeocerca = dynamic(
  () => import("./mapa-geocerca").then((m) => m.MapaGeocerca),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100">
        <p className="text-sm text-teal-800">Cargando mapa…</p>
      </div>
    ),
  },
);

type ResultadoEscaneo =
  | { modo: "real"; datos: Verificacion; ubicacion?: Coordenadas }
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
  >("listo");
  const [mensaje, cambiarMensaje] = useState(avisoInicial ?? "");
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

  async function comprobarQr(valor: string) {
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
  }

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
        cambiarResultado({ modo: "real", datos: respuesta.datos, ubicacion });
      } else {
        cambiarMensaje(respuesta.mensaje);
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
        <h2 className="font-serif text-2xl">Código de visita detectado</h2>
        <p>
          Comprueba el código para continuar con la verificación de tu
          ubicación.
        </p>
        {mensaje && (
          <p role="alert" className="text-sm text-rose-900">
            {mensaje}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {enlaceIngreso ? (
            <Link
              href={enlaceIngreso}
              className="rounded-lg bg-teal-950 px-4 py-2 font-semibold text-white"
            >
              Iniciar sesión para continuar
            </Link>
          ) : (
            <button
              type="button"
              disabled={estado === "comprobando"}
              className="rounded-lg bg-teal-950 px-4 py-2 text-white disabled:opacity-60"
              onClick={() => void comprobarQr(codigoInicial)}
            >
              {estado === "comprobando" ? "Comprobando…" : "Comprobar código"}
            </button>
          )}
          <Link
            href={rutaEscanerVisita(destino)}
            className="self-center font-semibold underline"
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
          className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold hover:bg-amber-100"
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
        className="space-y-3 rounded-3xl bg-teal-50 p-6"
        aria-live="polite"
      >
        <h2 className="text-2xl font-bold text-teal-950">
          {datos.yaVerificada
            ? "Tu visita ya estaba verificada"
            : "¡Visita validada!"}
        </h2>
        <p>
          {datos.destino.nombre} ·{" "}
          {fechaVisita.format(new Date(datos.visita.verificadaEn))}
        </p>
        <p className="text-sm">Identificador de visita: {datos.visita.id}</p>
        {datos.geocerca && resultado.ubicacion && (
          <>
            <p className="text-sm">
              Distancia aproximada: {datos.geocerca.distanciaMetros} m · Radio
              permitido: {datos.geocerca.radioMetros} m.
            </p>
            <MapaGeocerca
              destino={datos.destino}
              ubicacion={resultado.ubicacion}
              radio={datos.geocerca.radioMetros}
            />
          </>
        )}
        <Link
          href={`${enlaceFicha(datos.destino.slug)}#opiniones`}
          className="font-semibold text-teal-900 underline"
        >
          Escribir o consultar mi reseña
        </Link>
        <Link
          href="/mi-perfil"
          className="block w-fit text-sm font-semibold text-teal-900 underline underline-offset-4"
        >
          Ver mi perfil
        </Link>
      </section>
    );
  }

  if (preparacion) {
    const solicitando = estado === "ubicando";
    const registrando = estado === "registrando";
    return (
      <section className="space-y-4 rounded-3xl border border-teal-200 bg-teal-50 p-6">
        <h2 className="text-2xl font-bold text-teal-950">
          {preparacion.destino.nombre}
        </h2>
        <p role="status" className="text-sm font-semibold text-teal-950">
          {registrando
            ? "Ubicación obtenida. Comprobando el radio y registrando la visita…"
            : solicitando
              ? "Solicitando ubicación…"
              : "QR comprobado. Falta validar tu ubicación."}
        </p>
        <p className="text-sm">
          Usaremos tu ubicación solo para confirmar que estás a{" "}
          {preparacion.radioMetros} m o menos del atractivo. Las coordenadas no
          se guardan ni se comparten con proveedores de mapas.
        </p>
        {mensaje && (
          <p role="alert" className="text-sm text-red-800">
            {mensaje}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={solicitando || registrando}
            onClick={() => void validarUbicacion()}
            className="rounded-full bg-teal-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {mensaje ? "Intentar de nuevo" : "Permitir ubicación"}
          </button>
          {!registrando && (
            <button
              type="button"
              className="text-sm font-semibold underline"
              onClick={cancelarUbicacion}
            >
              Cancelar
            </button>
          )}
          {!solicitando && !registrando && mensaje && (
            <>
              <Link
                href={`${enlaceFicha(preparacion.destino.slug)}#como-llegar`}
                className="text-sm font-semibold underline"
              >
                Cómo llegar
              </Link>
              <Link href="/" className="text-sm font-semibold underline">
                Volver al inicio
              </Link>
            </>
          )}
        </div>
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
          className="font-semibold underline"
          onClick={cancelarUbicacion}
        >
          Cancelar
        </button>
      ) : estado === "activo" ||
        estado === "iniciando" ||
        estado === "solicitando-camara" ? (
        <button
          type="button"
          className="font-semibold underline"
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
      {enlaceIngreso && (
        <Link href={enlaceIngreso} className="font-semibold underline">
          Iniciar sesión para continuar
        </Link>
      )}
      {codigoPendiente && (
        <button
          type="button"
          className="block font-semibold underline"
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
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50"
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
