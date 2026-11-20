"use client";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { guardarBeneficio, comprobarCanje } from "./acciones";
import { LectorComprobante } from "./lector-comprobante";
import { CondicionesBeneficio } from "./condiciones";
import type { DetalleBeneficio, Beneficio } from "./tipos";

const campo =
  "min-h-11 w-full rounded-xl border border-[#c7d7cb] bg-white px-3 py-2 text-base font-normal sm:text-sm";
const boton =
  "min-h-11 rounded-xl border border-[#c7d7cb] px-4 text-sm font-semibold hover:bg-[#edf4ed] disabled:opacity-50";

function fechaPeru(valor?: string) {
  return valor
    ? new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(
        new Date(valor),
      )
    : undefined;
}
export function EditorBeneficio({
  beneficio,
  destinos,
  superadmin,
  onDirtyChange,
}: {
  beneficio?: Beneficio;
  destinos: Beneficio["destino"][];
  superadmin: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [paso, cambiarPaso] = useState(0);
  const [tipo, cambiarTipo] = useState(beneficio?.tipo ?? "EXPERIENCIA");
  const [mensaje, cambiarMensaje] = useState("");
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const confirmacion = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const datosPendientes = useRef<Record<string, unknown>>(null);
  const router = useRouter();
  function validar(soloPaso: boolean) {
    const campos = formulario.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      soloPaso
        ? `[data-paso="${paso}"] input, [data-paso="${paso}"] select, [data-paso="${paso}"] textarea`
        : "input, select, textarea",
    );
    const invalido = Array.from(campos ?? []).find(
      (campo) => !campo.checkValidity(),
    );
    if (!invalido) return true;
    cambiarPaso(
      Number((invalido.closest("[data-paso]") as HTMLElement).dataset.paso),
    );
    requestAnimationFrame(() => {
      invalido.focus();
      invalido.reportValidity();
    });
    return false;
  }
  function preparar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!validar(false)) return;
    const datos = new FormData(evento.currentTarget);
    const venceEn = new Date(`${datos.get("venceEn")}T23:59:59-05:00`);
    const iniciaEn = new Date(`${datos.get("iniciaEn")}T00:00:00-05:00`);
    if (
      !Number.isFinite(venceEn.getTime()) ||
      !Number.isFinite(iniciaEn.getTime()) ||
      iniciaEn >= venceEn
    ) {
      cambiarError(
        "Revisa las fechas: el inicio debe ser anterior al vencimiento.",
      );
      return;
    }
    const intencion = (
      (evento.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    )?.value;
    datosPendientes.current = {
      nombre: datos.get("nombre"),
      destinoId: datos.get("destinoId"),
      categoria: datos.get("categoria"),
      local: datos.get("local"),
      condiciones: datos.get("condiciones"),
      horario: datos.get("horario"),
      tipo,
      valor:
        tipo === "PORCENTAJE"
          ? Number(datos.get("valor"))
          : tipo === "IMPORTE"
            ? Math.round(Number(datos.get("valor")) * 100)
            : null,
      costo: Number(datos.get("costo")),
      disponibles: Number(datos.get("disponibles")),
      limitePorPersona: Number(datos.get("limitePorPersona")) || null,
      dias: datos.getAll("dias").map(Number),
      horaInicio: datos.get("horaInicio") || null,
      horaFin: datos.get("horaFin") || null,
      consumoMinimo: Math.round(Number(datos.get("consumoMinimo")) * 100),
      exclusiones: datos.get("exclusiones"),
      reservaPrevia: datos.get("reservaPrevia") === "on",
      acumulable: datos.get("acumulable") === "on",
      estado: intencion === "borrador" ? "borrador" : "pendiente",
      activo: intencion !== "borrador" && datos.get("activo") === "on",
      venceEn: venceEn.toISOString(),
      iniciaEn: iniciaEn.toISOString(),
      ...(beneficio && {
        revision: beneficio.revision,
        stockActual: beneficio.disponibles,
      }),
    };
    cambiarError("");
    confirmacion.current?.showModal();
  }
  function guardar() {
    if (!datosPendientes.current) return;
    iniciar(async () => {
      try {
        const resultado = await guardarBeneficio(
          datosPendientes.current!,
          beneficio?.id,
        );
        if (resultado.ok) {
          onDirtyChange?.(false);
          cambiarMensaje(
            datosPendientes.current?.estado === "borrador"
              ? "Borrador guardado. No está visible para los visitantes."
              : superadmin
                ? "Cambios guardados con el estado de publicación elegido."
                : "Propuesta enviada al SuperAdmin para su revisión.",
          );
          cambiarError("");
          confirmacion.current?.close();
          if (!beneficio) {
            formulario.current?.reset();
            cambiarTipo("EXPERIENCIA");
            cambiarPaso(0);
          }
          router.refresh();
        } else {
          cambiarError(resultado.mensaje);
          confirmacion.current?.close();
        }
      } catch {
        cambiarError(
          "No pudimos guardar. Mantuvimos los datos para que puedas reintentar.",
        );
        confirmacion.current?.close();
      }
    });
  }
  return (
    <div className="space-y-4">
      <ol
        aria-label="Pasos para configurar el beneficio"
        className="grid grid-cols-3 gap-2 text-xs sm:text-sm"
      >
        {["Qué ofreces", "Condiciones de uso", "Puntos y vigencia"].map(
          (titulo, i) => (
            <li
              key={titulo}
              aria-current={paso === i ? "step" : undefined}
              className={`rounded-xl border px-3 py-3 ${paso === i ? "border-[#174238] bg-[#edf4ed] font-semibold text-[#174238]" : "border-[#dce3da] text-[#526a60]"}`}
            >
              {i + 1}. {titulo}
            </li>
          ),
        )}
      </ol>
      <form
        ref={formulario}
        onSubmit={preparar}
        onChange={() => onDirtyChange?.(true)}
        noValidate
        className="space-y-5"
        aria-busy={pendiente}
      >
        <fieldset
          data-paso="0"
          hidden={paso !== 0}
          className={paso === 0 ? "grid gap-4 sm:grid-cols-2" : "hidden"}
          disabled={pendiente}
        >
          <legend className="mb-4 text-lg font-semibold">
            Define qué recibirá el visitante
          </legend>
          <label className="grid gap-1 text-sm font-semibold">
            Atractivo
            <select
              name="destinoId"
              required
              defaultValue={beneficio?.destinoId ?? destinos[0]?.id}
              className={campo}
            >
              {destinos
                .filter((d) => !beneficio || d.id === beneficio.destinoId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Nombre del beneficio
            <input
              name="nombre"
              defaultValue={beneficio?.nombre}
              required
              minLength={3}
              maxLength={120}
              className={campo}
              placeholder="Ej. Descuento en la entrada…"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Local responsable
            <input
              name="local"
              defaultValue={beneficio?.local}
              required
              minLength={3}
              maxLength={120}
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Categoría
            <select
              name="categoria"
              defaultValue={beneficio?.categoria ?? "EXPERIENCIAS"}
              className={campo}
            >
              <option value="EXPERIENCIAS">Experiencias</option>
              <option value="GASTRONOMIA">Gastronomía</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Tipo de beneficio
            <select
              value={tipo}
              onChange={(e) => cambiarTipo(e.target.value as Beneficio["tipo"])}
              className={campo}
            >
              <option value="PORCENTAJE">Descuento porcentual</option>
              <option value="IMPORTE">Descuento en soles</option>
              <option value="ENTRADA">Entrada</option>
              <option value="EXPERIENCIA">Actividad o experiencia</option>
            </select>
          </label>
          {(tipo === "PORCENTAJE" || tipo === "IMPORTE") && (
            <label className="grid gap-1 text-sm font-semibold">
              {tipo === "PORCENTAJE" ? "Descuento (%)" : "Descuento (S/)"}
              <input
                key={tipo}
                name="valor"
                type="number"
                required
                min={tipo === "PORCENTAJE" ? 1 : 0.01}
                step={tipo === "PORCENTAJE" ? 1 : 0.01}
                max={tipo === "PORCENTAJE" ? 100 : 1000000}
                defaultValue={
                  beneficio?.tipo === tipo && beneficio.valor
                    ? beneficio.valor / (tipo === "IMPORTE" ? 100 : 1)
                    : undefined
                }
                className={campo}
              />
            </label>
          )}
          <p className="text-xs leading-relaxed text-[#526a60] sm:col-span-2">
            El valor es lo que recibe el visitante. El costo en puntos se
            configura en el último paso.
          </p>
        </fieldset>
        <fieldset
          data-paso="1"
          hidden={paso !== 1}
          className={paso === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}
          disabled={pendiente}
        >
          <legend className="mb-4 text-lg font-semibold">
            Deja claras las condiciones
          </legend>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Qué incluye y cómo usarlo
            <textarea
              name="condiciones"
              defaultValue={beneficio?.condiciones}
              required
              minLength={15}
              maxLength={2000}
              rows={4}
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Horario e instrucciones para el local
            <input
              name="horario"
              defaultValue={beneficio?.horario}
              required
              minLength={3}
              maxLength={200}
              className={campo}
              placeholder="Ej. Presentar el comprobante en boletería…"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Consumo mínimo (S/)
            <input
              name="consumoMinimo"
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              defaultValue={(beneficio?.consumoMinimo ?? 0) / 100}
              required
              className={campo}
            />
          </label>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-semibold">
              Días de uso (sin selección: todos)
            </legend>
            <div className="flex flex-wrap gap-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                (dia, i) => (
                  <label
                    key={dia}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-[#c7d7cb] px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="dias"
                      value={i}
                      defaultChecked={beneficio?.dias.includes(i)}
                    />
                    {dia}
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <label className="grid gap-1 text-sm font-semibold">
            Desde (opcional)
            <input
              name="horaInicio"
              type="time"
              defaultValue={beneficio?.horaInicio ?? ""}
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Hasta (mismo día)
            <input
              name="horaFin"
              type="time"
              defaultValue={beneficio?.horaFin ?? ""}
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Exclusiones
            <textarea
              name="exclusiones"
              defaultValue={beneficio?.exclusiones}
              maxLength={1000}
              rows={2}
              className={campo}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="reservaPrevia"
              defaultChecked={beneficio?.reservaPrevia}
            />
            Requiere reserva previa
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acumulable"
              defaultChecked={beneficio?.acumulable}
            />
            Acumulable con otras promociones
          </label>
        </fieldset>
        <fieldset
          data-paso="2"
          hidden={paso !== 2}
          className={paso === 2 ? "grid gap-4 sm:grid-cols-2" : "hidden"}
          disabled={pendiente}
        >
          <legend className="mb-4 text-lg font-semibold">
            Configura los puntos y la disponibilidad
          </legend>
          <label className="grid gap-1 text-sm font-semibold">
            Costo en puntos
            <input
              name="costo"
              type="number"
              min={1}
              max={1000000}
              defaultValue={beneficio?.costo ?? 30}
              required
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Cupos disponibles
            <input
              name="disponibles"
              type="number"
              min={0}
              max={1000000}
              defaultValue={beneficio?.disponibles ?? 10}
              required
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Inicio de vigencia
            <input
              name="iniciaEn"
              type="date"
              defaultValue={fechaPeru(beneficio?.iniciaEn)}
              required
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Fin de vigencia
            <input
              name="venceEn"
              type="date"
              defaultValue={fechaPeru(beneficio?.venceEn)}
              required
              className={campo}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Canjes por visitante (0: sin límite)
            <input
              name="limitePorPersona"
              type="number"
              min={0}
              max={100}
              defaultValue={beneficio ? (beneficio.limitePorPersona ?? 0) : 1}
              required
              className={campo}
            />
          </label>
          {superadmin && (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={beneficio?.activo}
              />
              Aprobar y publicar: confirmé el acuerdo con el local
            </label>
          )}
          <p className="text-xs leading-relaxed text-[#526a60] sm:col-span-2">
            Las modificaciones vuelven a revisión. Los comprobantes emitidos
            conservan sus condiciones y su vigencia. Las reglas para ganar
            puntos son generales de Munay.
          </p>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3 border-t border-[#dce3da] pt-4">
          {paso > 0 && (
            <button
              type="button"
              disabled={pendiente}
              className={boton}
              onClick={() => cambiarPaso(paso - 1)}
            >
              Anterior
            </button>
          )}
          {paso < 2 ? (
            <button
              type="button"
              disabled={pendiente}
              className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
              onClick={() => {
                if (validar(true)) cambiarPaso(paso + 1);
              }}
            >
              Siguiente
            </button>
          ) : (
            <>
              <button
                type="submit"
                name="intencion"
                value="borrador"
                disabled={pendiente || !destinos.length}
                className={boton}
              >
                Guardar borrador
              </button>
              <button
                type="submit"
                name="intencion"
                value="enviar"
                disabled={pendiente || !destinos.length}
                className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
              >
                {pendiente
                  ? "Guardando…"
                  : superadmin
                    ? "Revisar y guardar"
                    : "Enviar a revisión"}
              </button>
            </>
          )}
        </div>
      </form>
      {mensaje && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"
        >
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-900">
          {error}
        </p>
      )}
      <dialog
        ref={confirmacion}
        aria-labelledby={`guardar-beneficio-${beneficio?.id ?? "nuevo"}`}
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl bg-white p-6 text-[#14382e] shadow-xl backdrop:bg-black/40"
        onCancel={(e) => {
          if (pendiente) e.preventDefault();
        }}
      >
        <h3
          id={`guardar-beneficio-${beneficio?.id ?? "nuevo"}`}
          className="text-xl font-semibold"
        >
          ¿Confirmar los datos del beneficio?
        </h3>
        <p className="mt-3 text-sm leading-relaxed">
          Comprueba el valor del beneficio, su costo en puntos, los cupos y las
          condiciones. Editar una oferta no modifica comprobantes ya emitidos.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pendiente}
            className={boton}
            onClick={() => confirmacion.current?.close()}
          >
            Seguir editando
          </button>
          <button
            type="button"
            disabled={pendiente}
            className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
            onClick={guardar}
          >
            {pendiente ? "Guardando…" : "Confirmar y guardar"}
          </button>
        </div>
      </dialog>
    </div>
  );
}

export function ValidarComprobante() {
  const [codigo, cambiarCodigo] = useState("");
  const [datos, cambiarDatos] = useState<{
    nombre: string;
    local: string;
    condiciones: string;
    estado: string;
    puedeEntregar: boolean;
    aviso: string | null;
    detalle?: Partial<DetalleBeneficio>;
  }>();
  const [error, cambiarError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const confirmacion = useRef<HTMLDialogElement>(null);
  function consultar(confirmar: boolean, valor = codigo) {
    iniciar(async () => {
      try {
        const resultado = await comprobarCanje(
          valor
            .trim()
            .replace(/^munay:canje:/i, "")
            .toUpperCase(),
          confirmar,
        );
        if (resultado.ok) {
          cambiarDatos(resultado.datos);
          cambiarError("");
        } else {
          cambiarError(resultado.mensaje);
          cambiarDatos(undefined);
        }
      } catch {
        cambiarError(
          "No pudimos confirmar el resultado. Comprueba de nuevo antes de entregar el beneficio.",
        );
        cambiarDatos(undefined);
      } finally {
        confirmacion.current?.close();
      }
    });
  }
  return (
    <section className="space-y-5 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Valida un beneficio antes de entregarlo
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#526a60]">
          Escanea el comprobante o introduce su código. Consultarlo no lo
          consume. Confirma la entrega solo cuando el visitante vaya a recibir
          el beneficio.
        </p>
      </div>
      <LectorComprobante
        onLeer={(valor) => {
          cambiarCodigo(valor);
          cambiarDatos(undefined);
          consultar(false, valor);
        }}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          consultar(false);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold">
          Código del comprobante
          <input
            value={codigo}
            onChange={(e) => {
              cambiarCodigo(e.target.value);
              cambiarDatos(undefined);
            }}
            required
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            className={campo}
          />
        </label>
        <button disabled={pendiente} className={boton}>
          {pendiente ? "Comprobando…" : "Comprobar código"}
        </button>
      </form>
      {datos && (
        <div className="space-y-3 rounded-xl bg-[#edf4ed] p-4">
          <h3 className="font-semibold">{datos.nombre}</h3>
          <p className="text-sm">{datos.local}</p>
          <p className="whitespace-pre-wrap text-sm">{datos.condiciones}</p>
          {datos.detalle && <CondicionesBeneficio datos={datos.detalle} />}
          {datos.aviso && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{datos.aviso} Puedes volver a comprobarlo en el horario indicado.</p>}
          {datos.estado === "usado" ? (
            <p role="status" className="text-sm font-semibold">
              Entrega registrada. El comprobante no se puede volver a utilizar.
            </p>
          ) : (
            <button
              type="button"
              disabled={pendiente || datos.puedeEntregar === false}
              onClick={() => confirmacion.current?.showModal()}
              className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
            >
              Confirmar entrega
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-900">
          {error}
        </p>
      )}
      <dialog
        ref={confirmacion}
        aria-labelledby="confirmar-entrega-beneficio"
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl bg-white p-6 text-[#14382e] shadow-xl backdrop:bg-black/40"
        onCancel={(e) => {
          if (pendiente) e.preventDefault();
        }}
      >
        <h3 id="confirmar-entrega-beneficio" className="text-xl font-semibold">
          ¿Entregar este beneficio?
        </h3>
        <p className="mt-3 text-sm leading-relaxed">
          Se registrará tu nombre como responsable de la entrega y este
          comprobante no podrá utilizarse otra vez. Verifica que el visitante
          cumpla las condiciones del local.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pendiente}
            className={boton}
            onClick={() => confirmacion.current?.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pendiente}
            className={`${boton} bg-[#174238] text-white hover:bg-[#23574a]`}
            onClick={() => consultar(true)}
          >
            {pendiente ? "Registrando…" : "Sí, registrar entrega"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
