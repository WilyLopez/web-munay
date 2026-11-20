"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CondicionesBeneficio } from "./condiciones";
import { confirmarCanje } from "./acciones";
import type { Beneficio, ComprobanteCanje } from "./tipos";
const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});
const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-50";

export function ReciboCanje({ canje }: { canje: ComprobanteCanje }) {
  const [qr, cambiarQr] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  useEffect(() => {
    let activo = true;
    void import("qrcode")
      .then((modulo) =>
        modulo.toDataURL(`munay:canje:${canje.codigo}`, {
          width: 256,
          margin: 2,
          color: { dark: "#14382e", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (activo) cambiarQr(url);
      })
      .catch(() => {
        if (activo)
          cambiarMensaje(
            "No pudimos dibujar el QR. Puedes usar el código escrito.",
          );
      });
    return () => {
      activo = false;
    };
  }, [canje.codigo]);
  return (
    <article className="space-y-4 rounded-2xl border border-[#c7d7cb] bg-white p-5 text-[#14382e]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{canje.nombre}</h3>
        <span className="rounded-full bg-[#edf4ed] px-3 py-1 text-xs font-semibold">
          {canje.estado === "disponible"
            ? "Listo para usar"
            : canje.estado === "usado"
              ? "Ya utilizado"
              : "Vencido"}
        </span>
      </div>
      <p className="text-sm text-[#526a60]">
        {canje.local} · {canje.destino.nombre}
      </p>
      <div className="rounded-xl bg-[#f3f6ef] p-4 text-sm">
        <p>
          Canjeado por <strong>{canje.costo} puntos</strong>
        </p>
        <p>
          Saldo actual: <strong>{canje.saldo} puntos</strong>
        </p>
        <p className="mt-2">
          Vigencia hasta {fecha.format(new Date(canje.venceEn))}
        </p>
      </div>
      {canje.detalle && <CondicionesBeneficio datos={canje.detalle} />}
      <details open={canje.estado === "disponible"}>
        <summary className="cursor-pointer py-2 text-sm font-semibold">
          Ver código y comprobante QR
        </summary>
        <div className="mt-3 grid justify-items-center gap-3 rounded-xl border border-[#dce3da] p-4">
          {qr ? (
            <Image
              src={qr}
              alt="Código QR del comprobante de canje"
              width={224}
              height={224}
              unoptimized
              className="size-48 max-w-full sm:size-56"
            />
          ) : (
            <p role="status" className="text-sm">
              Preparando QR…
            </p>
          )}
          <code className="max-w-full break-all text-center text-sm tracking-wide">
            {canje.codigo}
          </code>
          <button
            type="button"
            className={boton}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(canje.codigo);
                cambiarMensaje("Código copiado.");
              } catch {
                cambiarMensaje(
                  "Selecciona el código para copiarlo manualmente.",
                );
              }
            }}
          >
            Copiar código
          </button>
        </div>
      </details>
      <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed">
        {canje.condiciones}
      </p>
      <p className="text-xs text-[#526a60]">
        Horario: {canje.horario}. Presenta este comprobante al encargado. Es
        personal y solo se valida una vez. No compartas el código.
      </p>
      {mensaje && (
        <p role="status" className="text-sm">
          {mensaje}
        </p>
      )}
    </article>
  );
}

export function CanjearBeneficio({
  beneficio,
  saldo,
  usuarioId,
}: {
  beneficio: Beneficio;
  saldo: number;
  usuarioId: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const solicitud = useRef<string>(null);
  const [paso, cambiarPaso] = useState<"detalle" | "confirmar">("detalle");
  const [recibo, cambiarRecibo] = useState<ComprobanteCanje>();
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  const clave = `munay-canje:${usuarioId}:${beneficio.id}`;
  function canjear() {
    iniciar(async () => {
      try {
        if (!solicitud.current) {
          try {
            solicitud.current = localStorage.getItem(clave);
          } catch {
            /* Puede mantenerse en memoria si el almacenamiento está bloqueado. */
          }
          solicitud.current ??= crypto.randomUUID();
          try {
            localStorage.setItem(clave, solicitud.current);
          } catch {
            /* La solicitud mantiene su ID durante este intento. */
          }
        }
        const resultado = await confirmarCanje(
          beneficio.id,
          solicitud.current,
          beneficio.costo,
          beneficio.revision,
        );
        if (resultado.ok) {
          cambiarRecibo(resultado.datos);
          cambiarError("");
          try {
            localStorage.removeItem(clave);
          } catch {
            /* No afecta al comprobante confirmado. */
          }
          router.refresh();
        } else cambiarError(resultado.mensaje);
      } catch {
        cambiarError(
          "No pudimos confirmar el resultado. Reintenta sin cambiar de cuenta: la misma solicitud no vuelve a descontar puntos.",
        );
      }
    });
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          cambiarPaso("detalle");
          dialogo.current?.showModal();
        }}
        className={boton}
      >
        Ver beneficio
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby={`beneficio-${beneficio.id}`}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-[#c7d7cb] bg-white p-5 text-[#14382e] shadow-xl backdrop:bg-black/40 sm:p-6"
        onCancel={(evento) => {
          if (pendiente) evento.preventDefault();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id={`beneficio-${beneficio.id}`}
            className="text-xl font-semibold"
          >
            {recibo
              ? "Tu comprobante"
              : paso === "confirmar"
                ? "Confirma tu canje"
                : beneficio.nombre}
          </h2>
          <button
            type="button"
            disabled={pendiente}
            className={boton}
            onClick={() => dialogo.current?.close()}
          >
            Cerrar
          </button>
        </div>
        {recibo ? (
          <>
            <ReciboCanje canje={recibo} />
            <Link
              href="/beneficios?seccion=canjes"
              className="mt-4 inline-flex min-h-11 items-center font-semibold underline"
            >
              Ver mis canjes
            </Link>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold">
              {beneficio.local} · Oferta aprobada en Munay
            </p>
            <p className="text-sm text-[#526a60]">{beneficio.destino.nombre}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {beneficio.condiciones}
            </p>
            <CondicionesBeneficio datos={beneficio} />
            <p className="text-sm">Horario: {beneficio.horario}</p>
            <p className="text-sm">
              Válido hasta {fecha.format(new Date(beneficio.venceEn))}.{" "}
              {beneficio.disponibles} unidades disponibles.
              {beneficio.unUso
                ? " Un canje por persona."
                : " Permite más de un canje por persona."}
            </p>
            <dl className="space-y-2 rounded-xl bg-[#edf4ed] p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Tu saldo</dt>
                <dd>{saldo} puntos</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Costo del beneficio</dt>
                <dd>{beneficio.costo} puntos</dd>
              </div>
              <div className="flex justify-between gap-3 font-semibold">
                <dt>Saldo después del canje</dt>
                <dd>
                  {saldo >= beneficio.costo
                    ? `${saldo - beneficio.costo} puntos`
                    : "Puntos insuficientes"}
                </dd>
              </div>
            </dl>
            {saldo < beneficio.costo ? (
              <p className="text-sm text-amber-900">
                Te faltan {beneficio.costo - saldo} puntos. Comparte nuevas
                experiencias con visita verificada para seguir sumando.
              </p>
            ) : !beneficio.disponibles ? (
              <p className="text-sm text-amber-900">
                Este beneficio no tiene unidades disponibles.
              </p>
            ) : paso === "detalle" ? (
              <button
                type="button"
                className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
                onClick={() => cambiarPaso("confirmar")}
              >
                Canjear por {beneficio.costo} puntos
              </button>
            ) : (
              <>
                <p className="text-sm text-[#526a60]">
                  Aún no se descuentan puntos. Al confirmar se reservará una
                  unidad y recibirás el comprobante. El costo y la
                  disponibilidad se vuelven a comprobar.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={pendiente}
                    className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
                    onClick={canjear}
                  >
                    {pendiente ? "Confirmando…" : "Confirmar canje"}
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    className={boton}
                    onClick={() => dialogo.current?.close()}
                  >
                    Ahora no
                  </button>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-rose-900">
                {error}
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
