"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { consultarHistorial, sincronizarPantalla } from "./acciones";
import { generarEnlaceQr } from "./enlace-qr";
import {
  fechaVisita,
  type HistorialVisitas,
  type PantallaVisitas,
  type Visita,
} from "./tipos";

function CodigoQr({
  valor,
  lienzoRef,
}: {
  valor: string;
  lienzoRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const localRef = useRef<HTMLCanvasElement>(null);
  const lienzo = lienzoRef ?? localRef;
  const [fallo, cambiarFallo] = useState(false);

  useEffect(() => {
    if (lienzo.current) {
      void QRCode.toCanvas(
        lienzo.current,
        generarEnlaceQr(valor, window.location.origin),
        {
          width: 360,
          margin: 3,
          errorCorrectionLevel: "H",
          color: {
            dark: "#14312b",
            light: "#ffffff",
          },
        },
      ).catch(() => cambiarFallo(true));
    }
  }, [valor, lienzo]);

  return fallo ? (
    <p role="alert">No se pudo dibujar el QR.</p>
  ) : (
    <div className="relative isolate mx-auto flex items-center justify-center rounded-2xl bg-white p-2">
      <canvas
        ref={lienzo}
        role="img"
        aria-label="QR de verificación de visita"
        className="mx-auto h-auto max-w-[280px] sm:max-w-[340px]"
      />
    </div>
  );
}

function ListaVisitas({ visitas }: { visitas: Visita[] }) {
  if (visitas.length === 0)
    return (
      <p className="text-sm text-stone-700">
        Todavía no hay visitas verificadas.
      </p>
    );

  return (
    <ul className="divide-y divide-stone-200">
      {visitas.map((visita) => (
        <li key={visita.id} className="space-y-1 py-2 text-sm">
          <p className="break-all font-semibold">{visita.id}</p>
          <time dateTime={visita.verificadaEn}>
            {fechaVisita.format(new Date(visita.verificadaEn))}
          </time>
        </li>
      ))}
    </ul>
  );
}

function Historial({ slug }: { slug: string }) {
  const [historial, cambiarHistorial] = useState<HistorialVisitas>();
  const [pagina, cambiarPagina] = useState(1);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");

  async function cargar(numero: number) {
    cambiarOcupado(true);
    cambiarError("");
    try {
      const respuesta = await consultarHistorial(slug, numero);
      if (respuesta.ok) {
        cambiarHistorial(respuesta.datos);
        cambiarPagina(numero);
      } else {
        cambiarError(respuesta.mensaje);
      }
    } catch {
      cambiarError("Se perdió la conexión. Intenta de nuevo.");
    } finally {
      cambiarOcupado(false);
    }
  }

  return (
    <div className="space-y-3">
      {!historial ? (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void cargar(1)}
          className="font-semibold text-teal-900 underline"
        >
          Ver historial completo
        </button>
      ) : (
        <>
          <h3 className="font-bold">Historial de verificaciones</h3>
          <ListaVisitas visitas={historial.registros} />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={ocupado || pagina === 1}
              onClick={() => void cargar(pagina - 1)}
              className="underline disabled:opacity-50"
            >
              Anterior
            </button>
            <span>Página {pagina}</span>
            <button
              type="button"
              disabled={ocupado || !historial.hayMas}
              onClick={() => void cargar(pagina + 1)}
              className="underline disabled:opacity-50"
            >
              Siguiente
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => cambiarHistorial(undefined)}
              className="underline"
            >
              Cerrar historial
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

type EstadoPantalla = { datos: PantallaVisitas; venceLocal: number };

export function PantallaQr({ slug }: { slug: string }) {
  const solicitud = useRef(false);
  const versionConexion = useRef(0);
  const bloqueo = useRef(false);
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const ultimoTotalHoy = useRef<number | undefined>(undefined);
  const [alertaEscaneo, setAlertaEscaneo] = useState<string | null>(null);
  const [pantalla, cambiarPantalla] = useState<EstadoPantalla>();
  const [ahora, cambiarAhora] = useState(0);
  const [error, cambiarError] = useState("");
  const [requiereSesion, cambiarRequiereSesion] = useState(false);
  const [bloqueada, cambiarBloqueada] = useState(false);
  const [renovando, cambiarRenovando] = useState(false);
  const [sincronizando, cambiarSincronizando] = useState(false);

  const sincronizar = useCallback(
    async function consultar(codigoId?: string) {
      if (solicitud.current || bloqueo.current || !navigator.onLine) return;
      solicitud.current = true;
      const version = versionConexion.current;
      cambiarSincronizando(true);
      const inicio = performance.now();
      if (codigoId) cambiarRenovando(true);
      try {
        const respuesta = await sincronizarPantalla(slug, codigoId);
        if (!navigator.onLine || version !== versionConexion.current) return;
        if (!respuesta.ok) {
          cambiarPantalla(undefined);
          cambiarError(respuesta.mensaje);
          cambiarRequiereSesion(respuesta.estado === 401);
          bloqueo.current = [401, 403, 404].includes(respuesta.estado);
          cambiarBloqueada(bloqueo.current);
          return;
        }
        const datos = respuesta.datos;
        const instante = performance.now();
        cambiarAhora(instante);
        cambiarPantalla({
          datos,
          venceLocal:
            inicio +
            Date.parse(datos.codigo.venceEn) -
            Date.parse(datos.horaServidor),
        });
        cambiarError("");

        if (
          ultimoTotalHoy.current !== undefined &&
          datos.totalHoy > ultimoTotalHoy.current
        ) {
          setAlertaEscaneo(
            `¡Código QR escaneado! Visita registrada a las ${new Date().toLocaleTimeString("es-PE")}.`,
          );
        }
        ultimoTotalHoy.current = datos.totalHoy;
      } catch {
        if (version !== versionConexion.current) return;
        cambiarPantalla(undefined);
        cambiarError("Se perdió la conexión. Esperando sincronización.");
      } finally {
        solicitud.current = false;
        cambiarSincronizando(false);
        if (codigoId) cambiarRenovando(false);
        if (version !== versionConexion.current && !document.hidden) {
          void consultar();
        }
      }
    },
    [slug],
  );

  useEffect(() => {
    function actualizar() {
      cambiarAhora(performance.now());
      if (!document.hidden) void sincronizar();
    }
    function desconectar() {
      versionConexion.current++;
      cambiarPantalla(undefined);
      cambiarError("Se perdió la conexión. Esperando sincronización.");
    }
    const reloj = window.setInterval(
      () => cambiarAhora(performance.now()),
      250,
    );
    const consulta = window.setInterval(actualizar, 4000);
    window.addEventListener("offline", desconectar);
    window.addEventListener("online", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    if (navigator.onLine) actualizar();
    else desconectar();
    return () => {
      window.clearInterval(reloj);
      window.clearInterval(consulta);
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
      cambiarAhora(performance.now());
      if (!document.hidden) void sincronizar();
    }, Math.ceil(demora));
    return () => window.clearTimeout(renovar);
  }, [venceLocal, sincronizar]);

  const restante = pantalla ? Math.max(0, pantalla.venceLocal - ahora) : 0;
  const codigo = pantalla?.datos.codigo;
  const duracion = codigo
    ? Date.parse(codigo.venceEn) - Date.parse(codigo.creadoEn)
    : 1;
  const vigente = codigo && restante > 0 && !renovando;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
        {alertaEscaneo && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-emerald-500 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-900 font-semibold"
          >
            <span>✓ {alertaEscaneo} (El QR anterior fue descartado)</span>
            <button
              type="button"
              onClick={() => setAlertaEscaneo(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-base"
            >
              ✕
            </button>
          </div>
        )}
        {vigente ? (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-teal-900">Sesión activa</p>
              <span className="text-xs text-stone-400">
                Generado: {fechaVisita.format(new Date(codigo.creadoEn))}
              </span>
            </div>
            <CodigoQr key={codigo.id} valor={codigo.valor} lienzoRef={lienzoRef} />
            <p className="mt-2 text-center font-mono text-[11px] text-stone-400 select-all break-all tracking-wide">
              ID: <span className="font-medium text-stone-500">{codigo.id}</span>
            </p>
            <div className="w-full space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-stone-500">
                <span>Código dinámico activo</span>
                <span className="font-semibold text-teal-900">
                  Renovación en {Math.ceil(restante / 1000)}s
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full bg-[#174238] transition-all duration-200 ease-linear rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (restante / duracion) * 100))}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <p role="status" className="text-stone-700">
            {error || "Sincronizando el código QR…"}
          </p>
        )}
        {requiereSesion && (
          <Link
            href="/ingresar?aviso=sesion"
            className="font-semibold underline"
          >
            Iniciar sesión
          </Link>
        )}
        <button
          type="button"
          disabled={!vigente || sincronizando}
          onClick={() => vigente && void sincronizar(codigo.id)}
          className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform"
        >
          {renovando ? "Generando nuevo QR…" : "Generar nuevo QR"}
        </button>
        {error && !bloqueada && (
          <button
            type="button"
            disabled={sincronizando}
            onClick={() => void sincronizar()}
            className="ml-3 min-h-11 font-semibold text-teal-900 underline disabled:opacity-50"
          >
            Reintentar sincronización
          </button>
        )}
        <p className="text-sm text-stone-700">
          El QR se renueva automáticamente y se invalida al registrar una
          visita. Evita compartir capturas de pantalla.
        </p>
      </section>
      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">Verificaciones recientes</h2>
        {pantalla && (
          <>
            <p className="font-semibold text-teal-950">
              Verificaciones de hoy: {pantalla.datos.totalHoy}
            </p>
            <ListaVisitas visitas={pantalla.datos.recientes} />
          </>
        )}
        <Historial slug={slug} />
      </section>
    </div>
  );
}
