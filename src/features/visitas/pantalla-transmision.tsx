"use client";

import Image from "next/image";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { consultarPantallaPublica } from "./acciones";
import { generarEnlaceQr } from "./enlace-qr";
import { useReintentoAlVencer } from "./usar-reintento-al-vencer";
import { type DestinoVisita, type PantallaVisitas } from "./tipos";

type DatosPantalla = Omit<PantallaVisitas, "recientes" | "totalHoy">;

type EstadoPantalla = { datos: DatosPantalla; venceLocal: number };

export function PantallaTransmision({
  destinos,
  destinoInicial,
}: {
  destinos: DestinoVisita[];
  destinoInicial: string;
}) {
  const [slugActual, setSlugActual] = useState(destinoInicial);
  const [pantalla, setPantalla] = useState<EstadoPantalla>();
  const [ahora, setAhora] = useState(0);
  const [error, setError] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [estadoCopia, cambiarEstadoCopia] = useState("");
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const solicitudRef = useRef(false);
  const versionConexion = useRef(0);

  const destinoSeleccionado =
    destinos.find((d) => d.slug === slugActual) ?? destinos[0];

  const sincronizar = useCallback(
    async function consultar() {
      if (solicitudRef.current || !navigator.onLine) return;
      solicitudRef.current = true;
      const version = versionConexion.current;
      setSincronizando(true);
      const inicio = performance.now();

      try {
        const respuesta = await consultarPantallaPublica(slugActual);
        if (!navigator.onLine || version !== versionConexion.current) return;
        if (!respuesta.ok) {
          setPantalla(undefined);
          setError(respuesta.mensaje);
          return;
        }

        const datos = respuesta.datos;
        const instante = performance.now();
        setAhora(instante);
        setPantalla({
          datos,
          venceLocal:
            inicio +
            Date.parse(datos.codigo.venceEn) -
            Date.parse(datos.horaServidor),
        });
        setError("");

      } catch {
        if (version !== versionConexion.current) return;
        setPantalla(undefined);
        setError("Se perdió la conexión. Reintentando sincronización…");
      } finally {
        solicitudRef.current = false;
        setSincronizando(false);
      }
    },
    [slugActual],
  );

  function cambiarDestino(nuevoSlug: string) {
    if (nuevoSlug === slugActual) return;
    versionConexion.current++;
    setPantalla(undefined);
    setError("");
    setSlugActual(nuevoSlug);
  }

  const codigo = pantalla?.datos.codigo;
  useEffect(() => {
    if (!codigo || !lienzoRef.current) return;
    const canvas = lienzoRef.current;
    const urlVisita = generarEnlaceQr(codigo.valor, window.location.origin);

    void QRCode.toCanvas(canvas, urlVisita, {
      width: 360,
      margin: 3,
      errorCorrectionLevel: "H",
      color: {
        dark: "#14312b",
        light: "#ffffff",
      },
    }).catch(() => {
      setError("Error al renderizar el código QR.");
    });
  }, [codigo]);

  useEffect(() => {
    function actualizar() {
      setAhora(performance.now());
      if (!document.hidden) void sincronizar();
    }
    function desconectar() {
      versionConexion.current++;
      setPantalla(undefined);
      setError("Sin conexión a internet.");
    }

    const reloj = window.setInterval(() => setAhora(performance.now()), 250);
    const intervalo = window.setInterval(actualizar, 2000);

    window.addEventListener("offline", desconectar);
    window.addEventListener("online", actualizar);
    document.addEventListener("visibilitychange", actualizar);

    if (navigator.onLine) actualizar();
    else desconectar();

    return () => {
      window.clearInterval(reloj);
      window.clearInterval(intervalo);
      window.removeEventListener("offline", desconectar);
      window.removeEventListener("online", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [sincronizar]);

  const venceLocal = pantalla?.venceLocal;
  useEffect(() => {
    if (venceLocal === undefined) return;
    const demora = venceLocal - performance.now();
    if (demora <= 0) return;
    const renovar = window.setTimeout(() => {
      setAhora(performance.now());
      if (!document.hidden) void sincronizar();
    }, Math.ceil(demora));
    return () => window.clearTimeout(renovar);
  }, [venceLocal, sincronizar]);

  useEffect(() => {
    function actualizarPantallaCompleta() {
      setPantallaCompleta(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", actualizarPantallaCompleta);
    return () => document.removeEventListener("fullscreenchange", actualizarPantallaCompleta);
  }, []);

  function alternarPantallaCompleta() {
    if (!document.fullscreenEnabled) return;
    if (!document.fullscreenElement) {
      void document.documentElement
        .requestFullscreen?.()
        .catch(() => {});
    } else {
      void document
        .exitFullscreen()
        .catch(() => {});
    }
  }

  async function copiarEnlace() {
    const url = new URL(
      `/pantalla-qr?destino=${encodeURIComponent(slugActual)}`,
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      cambiarEstadoCopia("Enlace copiado");
    } catch {
      cambiarEstadoCopia("No se pudo copiar. Usa la dirección del navegador.");
    }
  }

  const restante = pantalla ? Math.max(0, pantalla.venceLocal - ahora) : 0;
  useReintentoAlVencer(
    pantalla !== undefined && restante === 0 && !sincronizando,
    sincronizar,
  );
  const duracion = codigo
    ? Date.parse(codigo.venceEn) - Date.parse(codigo.creadoEn)
    : 1;
  const vigente = codigo && restante > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-[#f5f2e8] text-[#193b33] selection:bg-teal-200">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#dedacf] bg-[#fffdf7]/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/marca/logo-navbar.webp"
            width={360}
            height={80}
            alt="Munay"
            className="h-auto w-24"
          />
        </div>

        {destinos.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {destinos.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => cambiarDestino(d.slug)}
                aria-pressed={slugActual === d.slug}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-[#174238] aria-pressed:text-white bg-stone-200/70 text-stone-700 hover:bg-stone-300"
              >
                {d.nombre}
              </button>
            ))}
          </div>
        )}

        <details className="relative text-sm font-semibold">
          <summary className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2.5">Controles de pantalla</summary>
          <div className="absolute right-0 z-40 mt-2 grid w-52 gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
            <Link
              href="/administracion/visitas"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-50"
              title="Volver al panel administrativo"
            >
              Volver al panel
            </Link>

            <button
              type="button"
              onClick={() => void copiarEnlace()}
              className="rounded-lg border border-[#b9c4b9] bg-white px-3 py-2 text-[#193b33] hover:bg-stone-50 active:scale-95 transition-transform"
            >
              Copiar enlace
            </button>
            <button
              type="button"
              onClick={alternarPantallaCompleta}
              className="rounded-lg bg-[#174238] px-3 py-2 text-white hover:bg-[#23574a] active:scale-95 transition-transform"
            >
              {pantallaCompleta
                ? "Salir de pantalla completa"
                : "Pantalla completa"}
            </button>
            <p role="status" className="text-xs text-stone-700">{estadoCopia}</p>
          </div>
        </details>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full min-w-0 max-w-xl space-y-4 text-center sm:space-y-5">
          <div>
            <h1 className="wrap-anywhere text-balance font-serif text-3xl leading-tight text-[#14312b] sm:text-4xl lg:text-5xl">
              {destinoSeleccionado.nombre}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#465a50]">
              Abre la cámara de tu celular y escanea el código para verificar tu
              visita.
            </p>
          </div>

          <div className="relative mx-auto flex min-w-0 flex-col items-center justify-center rounded-3xl border border-[#dedacf] bg-white p-3 sm:p-5">
            {vigente ? (
              <>
                <div className="relative w-full max-w-[360px] bg-white">
                  <canvas
                    ref={lienzoRef}
                    role="img"
                    aria-label={`Código QR para registrar visita en ${destinoSeleccionado.nombre}`}
                    className="block h-auto! max-w-full"
                  />
                  {sincronizando && (
                    <span className="absolute top-2 right-2 flex size-3">
                      <span className="size-3 rounded-full bg-teal-600" />
                    </span>
                  )}
                </div>

                <div className="mt-3 w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-xs font-medium text-stone-500">
                    <span>Código dinámico activo</span>
                    <span className="font-semibold text-teal-900">
                      Renovación en {Math.ceil(restante / 1000)}s
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full bg-[#174238] transition-all duration-200 ease-linear rounded-full"
                      style={{ width: `${Math.min(100, (restante / Math.max(1, duracion)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-600">
                    Una vez comprobado el QR, puedes confirmar tu ubicación aunque cambie el código.
                  </p>
                </div>

              </>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 space-y-3">
                {!error && (
                  <div
                    aria-hidden="true"
                    className="size-10 rounded-full border-4 border-[#174238] border-t-transparent motion-safe:animate-spin"
                  />
                )}
                <p
                  role="status"
                  className="text-sm font-semibold text-stone-600"
                >
                  {error || (pantalla ? "Renovando código…" : "Preparando el código…")}
                </p>
                {error && (
                  <button
                    type="button"
                    onClick={() => void sincronizar()}
                    className="mt-2 rounded-xl bg-teal-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Reintentar conexión
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
