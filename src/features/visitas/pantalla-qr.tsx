"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BotonCopiarEnlaceTransmision } from "./boton-copiar-transmision";
import { consultarHistorial, sincronizarPantalla } from "./acciones";
import { generarEnlaceQr } from "./enlace-qr";
import { ModalAficheImprimible } from "./modal-afiche-imprimible";
import { useActividadVisitas } from "./usar-actividad-visitas";
import { useReintentoAlVencer } from "./usar-reintento-al-vencer";
import {
  fechaVisita,
  type HistorialVisitas,
  type PantallaVisitas,
  type Visita,
} from "./tipos";

function CodigoQr({ valor }: { valor: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
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
  }, [valor]);

  return fallo ? (
    <p role="alert">No se pudo dibujar el QR.</p>
  ) : (
    <div className="relative isolate mx-auto w-full max-w-xs rounded-2xl bg-white p-2">
      <canvas
        ref={lienzo}
        role="img"
        aria-label="QR de verificación de visita"
        className="block h-auto! max-w-full"
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
          <p className="font-semibold text-teal-950">Visita verificada</p>
          <p className="text-xs text-stone-600">Identificador de visita</p>
          <code className="block break-all text-xs text-[#335346]">
            {visita.id}
          </code>
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

export function PantallaQr({
  slug,
  nombreDestino,
}: {
  slug: string;
  nombreDestino?: string;
}) {
  const solicitud = useRef(false);
  const consultaPendiente = useRef(false);
  const versionConexion = useRef(0);
  const bloqueo = useRef(false);
  const [confirmacion, cambiarConfirmacion] = useState<string>();
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
      if (bloqueo.current || !navigator.onLine) return;
      if (solicitud.current) {
        consultaPendiente.current = true;
        return;
      }
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
            `Visitas actualizadas. Total de hoy: ${datos.totalHoy}.`,
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
        if (
          (consultaPendiente.current || version !== versionConexion.current) &&
          !document.hidden
        ) {
          consultaPendiente.current = false;
          void consultar();
        }
      }
    },
    [slug],
  );

  const tiempoReal = useActividadVisitas(slug, sincronizar, !bloqueada);

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
    const consulta = window.setInterval(() => {
      if (!tiempoReal) actualizar();
    }, 4000);
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
  }, [sincronizar, tiempoReal]);

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
  useReintentoAlVencer(
    pantalla !== undefined && restante === 0 && !sincronizando,
    sincronizar,
  );
  const duracion = codigo
    ? Date.parse(codigo.venceEn) - Date.parse(codigo.creadoEn)
    : 1;
  const vigente = codigo && restante > 0 && !renovando;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-teal-950">Código de acceso</h2>
          <span
            className={
              vigente
                ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-950"
                : "rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700"
            }
          >
            {vigente
              ? "Sesión activa"
              : error
                ? "QR no disponible"
                : "Sincronizando"}
          </span>
        </div>
        {vigente && (
          <dl className="space-y-3 rounded-xl bg-[#f3f6f2] p-4 text-sm">
            <div>
              <dt className="text-stone-600">Sesión del QR</dt>
              <dd className="mt-1 break-all font-mono text-xs font-medium text-[#174238]">
                {codigo.id}
              </dd>
            </div>
            <div>
              <dt className="text-stone-600">Generado el · hora de Lima</dt>
              <dd className="mt-1 font-medium text-[#174238]">
                <time dateTime={codigo.creadoEn}>
                  {fechaVisita.format(new Date(codigo.creadoEn))}
                </time>
              </dd>
            </div>
          </dl>
        )}
        <div className="rounded-2xl bg-[#f5f2e8] p-3 sm:p-5">
          {vigente ? (
            <CodigoQr key={codigo.id} valor={codigo.valor} />
          ) : (
            <p
              role="status"
              className="mx-auto grid min-h-56 max-w-xs place-items-center text-center text-sm text-stone-700"
            >
              {error ||
                (pantalla ? "Renovando código…" : "Preparando el código…")}
            </p>
          )}
        </div>
        {vigente && (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-stone-700">
              <span>Renovación automática</span>
              <span className="font-semibold tabular-nums text-teal-950">
                {Math.ceil(restante / 1000)} s
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Vigencia restante del QR"
              aria-valuemin={0}
              aria-valuemax={Math.ceil(duracion / 1000)}
              aria-valuenow={Math.ceil(restante / 1000)}
              aria-valuetext={`${Math.ceil(restante / 1000)} segundos para la renovación`}
              className="h-2 overflow-hidden rounded-full bg-stone-200"
            >
              <div
                className="h-full rounded-full bg-teal-800 motion-safe:transition-[width]"
                style={{
                  width: `${Math.min(100, (restante / Math.max(1, duracion)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
        <p className="text-sm text-stone-700">
          Varias personas pueden escanear el mismo QR mientras esté activo.
          Quien ya comprobó el código puede confirmar su ubicación aunque se
          renueve.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/pantalla-qr?destino=${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-950 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Abrir pantalla para visitantes ↗
          </Link>
          <BotonCopiarEnlaceTransmision slug={slug} />
          {codigo && (
            <ModalAficheImprimible
              nombreDestino={nombreDestino ?? slug}
              codigoValor={codigo.valor}
            />
          )}
        </div>
        {requiereSesion && (
          <Link
            href="/ingresar?aviso=sesion"
            className="font-semibold underline"
          >
            Iniciar sesión
          </Link>
        )}
        {error && !bloqueada && (
          <button
            type="button"
            disabled={sincronizando}
            onClick={() => void sincronizar()}
            className="min-h-11 font-semibold text-teal-900 underline disabled:opacity-50"
          >
            Reintentar sincronización
          </button>
        )}
        {vigente &&
          (confirmacion === codigo.id ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">¿Renovar el QR ahora?</p>
              <p>
                El código que se muestra dejará de aceptar nuevos escaneos. Las
                verificaciones en curso podrán continuar.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={sincronizando}
                  onClick={() => {
                    cambiarConfirmacion(undefined);
                    void sincronizar(codigo.id);
                  }}
                  className="min-h-11 rounded-lg bg-teal-950 px-4 font-semibold text-white disabled:opacity-50"
                >
                  Confirmar renovación
                </button>
                <button
                  type="button"
                  onClick={() => cambiarConfirmacion(undefined)}
                  className="min-h-11 px-2 font-semibold underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => cambiarConfirmacion(codigo.id)}
              className="min-h-11 text-sm font-semibold text-teal-950 underline underline-offset-4"
            >
              Generar nuevo QR
            </button>
          ))}
      </section>
      <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-teal-950">
            Actividad de visitas
          </h2>
          <p className="flex items-center gap-2 text-xs text-[#526a60]">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${tiempoReal ? "bg-emerald-600" : "bg-amber-500"}`}
            />
            {tiempoReal
              ? "Actualización en tiempo real"
              : "Actualización periódica cada 4 segundos"}
          </p>
        </div>
        {pantalla && (
          <>
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-950">
              <p className="text-sm font-medium">Visitas verificadas hoy</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">
                {pantalla.datos.totalHoy}
              </p>
            </div>
            <div
              role="status"
              className={
                alertaEscaneo
                  ? "rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-950"
                  : "sr-only"
              }
            >
              {alertaEscaneo}
            </div>
            <h3 className="font-semibold text-teal-950">
              Verificaciones recientes
            </h3>
            <ListaVisitas visitas={pantalla.datos.recientes} />
          </>
        )}
        <Historial slug={slug} />
      </section>
    </div>
  );
}
