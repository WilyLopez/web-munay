"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { sincronizarPantalla } from "./acciones";
import { generarEnlaceQr } from "./enlace-qr";
import {
  type DestinoVisita,
  type PantallaVisitas,
} from "./tipos";

type EstadoPantalla = { datos: PantallaVisitas; venceLocal: number };

type AlertaEscaneo = {
  id: string;
  codigoId: string;
  fecha: Date;
  totalHoy: number;
};

function reproducirSonidoEscaneo() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = "sine";
    // Tono doble de éxito (587Hz -> 880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    ganancia.gain.setValueAtTime(0.2, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Si la política de audio del navegador lo restringe, omitir silenciosamente
  }
}

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
  const [alerta, setAlerta] = useState<AlertaEscaneo | null>(null);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const solicitudRef = useRef(false);
  const versionConexion = useRef(0);
  const ultimoCodigoIdRef = useRef<string | undefined>(undefined);
  const ultimoTotalHoyRef = useRef<number | undefined>(undefined);
  const ultimaVisitaIdRef = useRef<string | undefined>(undefined);

  const destinoSeleccionado =
    destinos.find((d) => d.slug === slugActual) ?? destinos[0];

  const sincronizar = useCallback(
    async function consultar(codigoId?: string) {
      if (solicitudRef.current || !navigator.onLine) return;
      solicitudRef.current = true;
      const version = versionConexion.current;
      setSincronizando(true);
      const inicio = performance.now();

      try {
        const respuesta = await sincronizarPantalla(slugActual, codigoId);
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

        // Detección de escaneo en tiempo real
        if (ultimoCodigoIdRef.current !== undefined) {
          const nuevaVisitaRegistrada =
            datos.totalHoy > (ultimoTotalHoyRef.current ?? 0) ||
            (datos.recientes[0] &&
              datos.recientes[0].id !== ultimaVisitaIdRef.current);

          if (nuevaVisitaRegistrada) {
            const codigoEscaneado = ultimoCodigoIdRef.current;

            const nuevaAlerta: AlertaEscaneo = {
              id: crypto.randomUUID(),
              codigoId: codigoEscaneado,
              fecha: new Date(),
              totalHoy: datos.totalHoy,
            };
            setAlerta(nuevaAlerta);

            if (sonidoActivo) {
              reproducirSonidoEscaneo();
            }
          }
        }

        // Actualizar referencias del estado
        ultimoCodigoIdRef.current = datos.codigo.id;
        ultimoTotalHoyRef.current = datos.totalHoy;
        ultimaVisitaIdRef.current = datos.recientes[0]?.id;
      } catch {
        if (version !== versionConexion.current) return;
        setPantalla(undefined);
        setError("Se perdió la conexión. Reintentando sincronización…");
      } finally {
        solicitudRef.current = false;
        setSincronizando(false);
      }
    },
    [slugActual, sonidoActivo],
  );

  function cambiarDestino(nuevoSlug: string) {
    setSlugActual(nuevoSlug);
    ultimoCodigoIdRef.current = undefined;
    ultimoTotalHoyRef.current = undefined;
    ultimaVisitaIdRef.current = undefined;
    setAlerta(null);
  }

  // Dibujar el código QR en el lienzo cuando el valor cambie
  const codigo = pantalla?.datos.codigo;
  useEffect(() => {
    if (!codigo || !lienzoRef.current) return;
    const canvas = lienzoRef.current;
    const urlVisita = generarEnlaceQr(codigo.valor, window.location.origin);

    void QRCode.toCanvas(canvas, urlVisita, {
      width: 380,
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

  // Polling cada 2 segundos para detección rápida de escaneos
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

  // Auto-renovación cuando vence el tiempo del código
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

  // Auto-ocultar alerta después de 10 segundos
  useEffect(() => {
    if (!alerta) return;
    const timer = setTimeout(() => setAlerta(null), 10000);
    return () => clearTimeout(timer);
  }, [alerta]);

  function alternarPantallaCompleta() {
    if (!document.fullscreenElement) {
      void document.documentElement
        .requestFullscreen()
        .then(() => setPantallaCompleta(true))
        .catch(() => {});
    } else {
      void document
        .exitFullscreen()
        .then(() => setPantallaCompleta(false))
        .catch(() => {});
    }
  }

  function copiarEnlace() {
    const url = new URL(
      `/pantalla-qr?destino=${encodeURIComponent(slugActual)}`,
      window.location.origin,
    ).href;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const restante = pantalla ? Math.max(0, pantalla.venceLocal - ahora) : 0;
  const duracion = codigo
    ? Date.parse(codigo.venceEn) - Date.parse(codigo.creadoEn)
    : 1;
  const vigente = codigo && restante > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-[#f5f2e8] text-[#193b33] selection:bg-teal-200">
      {/* Barra superior de control */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#dedacf] bg-[#fffdf7]/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/visitas"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-50"
            title="Volver al panel administrativo"
          >
            ← Panel
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-serif text-lg font-bold sm:text-xl text-[#174238]">
            Munay · Modo Pantalla
          </h1>
        </div>

        {/* Selector de destinos si hay más de uno */}
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

        {/* Acciones de la pantalla */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={copiarEnlace}
            className="rounded-lg border border-[#b9c4b9] bg-white px-3 py-2 text-[#193b33] hover:bg-stone-50 active:scale-95 transition-transform"
          >
            {copiado ? "✓ Enlace copiado" : "Copiar enlace"}
          </button>
          <button
            type="button"
            onClick={() => setSonidoActivo(!sonidoActivo)}
            className="rounded-lg border border-[#b9c4b9] bg-white px-2.5 py-2 hover:bg-stone-50"
            title={sonidoActivo ? "Sonido activado" : "Sonido silenciado"}
          >
            {sonidoActivo ? "🔔 Sonido on" : "🔕 Silenciado"}
          </button>
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            className="hidden sm:inline-flex rounded-lg bg-[#174238] px-3 py-2 text-white hover:bg-[#23574a] active:scale-95 transition-transform"
          >
            {pantallaCompleta ? "Salir pantalla completa" : "Pantalla completa ⛶"}
          </button>
        </div>
      </header>

      {/* Contenido principal en modo Kiosco */}
      <main className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        {/* AVISO DE ESCANEO DESTACADO */}
        {alerta && (
          <div
            role="status"
            aria-live="assertive"
            className="fixed top-20 left-1/2 z-50 w-11/12 max-w-lg -translate-x-1/2 rounded-2xl border-2 border-emerald-500 bg-emerald-950/95 p-5 text-white shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-emerald-500 text-2xl text-emerald-950 font-bold">
                  ✓
                </span>
                <div>
                  <h2 className="text-lg font-bold text-emerald-200">
                    ¡Código QR Escaneado!
                  </h2>
                  <p className="text-xs text-emerald-300">
                    Visita verificada exitosamente a las{" "}
                    {alerta.fecha.toLocaleTimeString("es-PE")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlerta(null)}
                className="text-emerald-300 hover:text-white text-lg font-bold"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 border-t border-emerald-800/80 pt-3 text-xs text-emerald-100 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-emerald-300 font-medium">Identificador escaneado:</span>
                <span className="font-mono text-xs font-bold text-white bg-emerald-900/90 px-2.5 py-1 rounded-md border border-emerald-700 select-all tracking-wider break-all">
                  {alerta.codigoId}
                </span>
              </div>
              <p className="text-emerald-200/90 text-[11px]">
                El código anterior fue <strong className="text-white">descartado</strong> de inmediato. Se ha generado un nuevo QR activo para el siguiente visitante.
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-xl text-center space-y-6">
          <div>
            <span className="inline-block rounded-full bg-teal-900/10 px-4 py-1.5 text-xs font-semibold text-[#174238] uppercase tracking-wider">
              Punto de Control de Visitas
            </span>
            <h2 className="mt-2 text-balance font-serif text-3xl font-extrabold sm:text-4xl lg:text-5xl text-[#14312b]">
              {destinoSeleccionado.nombre}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#465a50]">
              Apunta la cámara de tu celular a la pantalla para registrar tu visita y acumular puntos en Munay.
            </p>
          </div>

          {/* Tarjeta del Código QR */}
          <div
            className={`relative mx-auto flex flex-col items-center justify-center rounded-3xl border-2 bg-white p-6 sm:p-8 shadow-xl transition-all duration-300 ${
              alerta ? "border-emerald-500 ring-4 ring-emerald-300" : "border-[#dedacf]"
            }`}
          >
            {vigente ? (
              <>
                <div className="relative isolate rounded-2xl bg-white p-2">
                  <canvas
                    ref={lienzoRef}
                    role="img"
                    aria-label={`Código QR para registrar visita en ${destinoSeleccionado.nombre}`}
                    className="mx-auto h-auto max-w-[280px] sm:max-w-[340px]"
                  />
                  {sincronizando && (
                    <span className="absolute top-2 right-2 flex size-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-teal-600" />
                    </span>
                  )}
                </div>

                {/* Identificador discreto para cotejo */}
                <p className="mt-2 select-all font-mono text-[11px] text-stone-400 text-center tracking-wide break-all">
                  ID: <span className="text-stone-500 font-medium">{codigo.id}</span>
                </p>

                {/* Barra de progreso de tiempo restante */}
                <div className="w-full max-w-sm mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-stone-500">
                    <span>Código dinámico activo</span>
                    <span className="font-semibold text-teal-900">
                      Renovación en {Math.ceil(restante / 1000)}s
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full bg-[#174238] transition-all duration-200 ease-linear rounded-full"
                      style={{ width: `${(restante / duracion) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-400">
                    El QR es de un solo uso: al ser escaneado se descarta y se renueva automáticamente.
                  </p>
                </div>

                {/* Botón para forzar nuevo código si se necesita */}
                <div className="mt-5 flex items-center justify-center">
                  <button
                    type="button"
                    disabled={sincronizando}
                    onClick={() => codigo && void sincronizar(codigo.id)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-teal-800 bg-white px-5 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    🔄 Forzar nuevo código
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 space-y-3">
                <div className="size-10 animate-spin rounded-full border-4 border-[#174238] border-t-transparent" />
                <p className="text-sm font-semibold text-stone-600">
                  {error || "Sincronizando código QR de visita…"}
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

          {/* Contador en vivo de visitas verificadas hoy */}
          {pantalla && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dedacf] bg-white/80 px-5 py-2 text-sm shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-stone-600">Verificaciones de hoy:</span>
              <strong className="font-bold text-[#174238]">
                {pantalla.datos.totalHoy}
              </strong>
            </div>
          )}
        </div>
      </main>

      {/* Pie con instrucciones para guías turísticos */}
      <footer className="border-t border-[#dedacf] bg-[#fffdf7] px-4 py-3 text-center text-xs text-[#465a50]">
        <p>
          Munay Verificación en Vivo · Diseñado para proyectar en tablets, pantallas de ingreso o puntos de control con guías turísticos.
        </p>
      </footer>
    </div>
  );
}
