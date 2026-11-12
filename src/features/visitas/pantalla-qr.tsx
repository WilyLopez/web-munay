"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { consultarHistorial, sincronizarPantalla } from "./acciones";
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
      void QRCode.toCanvas(lienzo.current, valor, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: "M",
      }).catch(() => cambiarFallo(true));
    }
  }, [valor]);

  return fallo ? (
    <p role="alert">No se pudo dibujar el QR.</p>
  ) : (
    <canvas
      ref={lienzo}
      role="img"
      aria-label="QR de verificación de visita"
      className="mx-auto h-auto max-w-full"
    />
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
  const bloqueo = useRef(false);
  const [pantalla, cambiarPantalla] = useState<EstadoPantalla>();
  const [ahora, cambiarAhora] = useState(0);
  const [error, cambiarError] = useState("");
  const [requiereSesion, cambiarRequiereSesion] = useState(false);
  const [renovando, cambiarRenovando] = useState(false);
  const [sincronizando, cambiarSincronizando] = useState(false);

  const sincronizar = useCallback(
    async (renovar = false) => {
      if (solicitud.current || bloqueo.current || !navigator.onLine) return;
      solicitud.current = true;
      cambiarSincronizando(true);
      const inicio = Date.now();
      if (renovar) cambiarRenovando(true);
      try {
        const respuesta = await sincronizarPantalla(slug, renovar);
        if (!navigator.onLine) return;
        if (!respuesta.ok) {
          cambiarPantalla(undefined);
          cambiarError(respuesta.mensaje);
          cambiarRequiereSesion(respuesta.estado === 401);
          bloqueo.current = [401, 403, 404].includes(respuesta.estado);
          return;
        }
        const datos = respuesta.datos;
        const instante = Date.now();
        cambiarAhora(instante);
        cambiarPantalla({
          datos,
          venceLocal:
            inicio +
            Date.parse(datos.codigo.venceEn) -
            Date.parse(datos.horaServidor),
        });
        cambiarError("");
      } catch {
        cambiarPantalla(undefined);
        cambiarError("Se perdió la conexión. Esperando sincronización.");
      } finally {
        solicitud.current = false;
        cambiarSincronizando(false);
        if (renovar) cambiarRenovando(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    function actualizar() {
      cambiarAhora(Date.now());
      if (!document.hidden) void sincronizar();
    }
    function desconectar() {
      cambiarPantalla(undefined);
      cambiarError("Se perdió la conexión. Esperando sincronización.");
    }
    const reloj = window.setInterval(() => cambiarAhora(Date.now()), 250);
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

  const restante = pantalla ? Math.max(0, pantalla.venceLocal - ahora) : 0;
  const codigo = pantalla?.datos.codigo;
  const duracion = codigo
    ? Date.parse(codigo.venceEn) - Date.parse(codigo.creadoEn)
    : 1;
  const vigente = codigo && restante > 0 && !renovando;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
        {vigente ? (
          <>
            <p className="font-semibold text-teal-900">Sesión activa</p>
            <CodigoQr key={codigo.id} valor={codigo.valor} />
            <p className="break-all text-sm">
              Identificador del QR: {codigo.id}
            </p>
            <p className="text-sm">
              Generado: {fechaVisita.format(new Date(codigo.creadoEn))}
            </p>
            <p className="text-sm">
              Renovación en {Math.ceil(restante / 1000)} s
            </p>
            <progress
              aria-label="Tiempo restante del QR"
              className="w-full accent-teal-800"
              max={duracion}
              value={restante}
            />
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
          onClick={() => void sincronizar(true)}
          className="rounded-full bg-teal-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Generar nuevo QR
        </button>
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
