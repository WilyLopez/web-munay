"use client";

import { useActionState, useState } from "react";
import { guardarFichaOperativa } from "./ficha-operativa";

export type FichaOperativa = {
  nombre: string;
  horario: string | null;
  diasAtencion: number[];
  tarifaGeneral: string | null;
  tarifaEstudiantes: string | null;
};

const campo = "rounded-lg border border-[#bdcfc2] bg-white px-3 py-2 text-sm";
const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const ordenDias = [1, 2, 3, 4, 5, 6, 0];

export function FormularioFicha({
  ficha,
  slug,
}: {
  ficha: FichaOperativa;
  slug: string;
}) {
  const [confirmar, mostrarConfirmacion] = useState(false);
  const [dias, cambiarDias] = useState(ficha.diasAtencion ?? []);
  const [campos, cambiarCampos] = useState({
    horario: ficha.horario ?? "",
    tarifaGeneral: ficha.tarifaGeneral ?? "",
    tarifaEstudiantes: ficha.tarifaEstudiantes ?? "",
  });
  const [estado, guardar, pendiente] = useActionState(
    guardarFichaOperativa.bind(null, slug),
    { mensaje: "", error: false },
  );

  return (
    <form
      action={guardar}
      onSubmit={(evento) => {
        if (!confirmar) {
          evento.preventDefault();
          mostrarConfirmacion(true);
        } else {
          mostrarConfirmacion(false);
        }
      }}
      className="space-y-5 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
    >
      <label className="grid gap-2 text-sm font-semibold">
        Horario de atención
        <textarea
          name="horario"
          rows={3}
          maxLength={240}
          className={campo}
          value={campos.horario}
          onChange={(evento) => {
            mostrarConfirmacion(false);
            cambiarCampos({ ...campos, horario: evento.target.value });
          }}
        />
      </label>
      <fieldset disabled={pendiente} className="space-y-2">
        <legend className="text-sm font-semibold">
          Días habituales de atención
        </legend>
        <div className="flex flex-wrap gap-2">
          {ordenDias.map((dia) => (
            <label
              key={dia}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#bdcfc2] px-3 py-2 text-sm has-checked:border-[#174238] has-checked:bg-[#e6eee6]"
            >
              <input
                name="diasAtencion"
                type="checkbox"
                value={dia}
                checked={dias.includes(dia)}
                className="accent-[#174238]"
                onChange={(evento) => {
                  mostrarConfirmacion(false);
                  cambiarDias(
                    evento.target.checked
                      ? [...dias, dia]
                      : dias.filter((actual) => actual !== dia),
                  );
                }}
              />
              {diasSemana[dia]}
            </label>
          ))}
        </div>
        <p className="text-xs text-[#4d665b]">
          La ficha usará estos días para la consulta de disponibilidad. Si dejas
          todos sin marcar, se mostrará como pendiente de confirmación.
        </p>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["tarifaGeneral", "Tarifa general (S/)"],
            ["tarifaEstudiantes", "Tarifa para estudiantes (S/)"],
          ] as const
        ).map(([clave, etiqueta]) => (
          <label key={clave} className="grid gap-2 text-sm font-semibold">
            {etiqueta}
            <input
              name={clave}
              className={campo}
              inputMode="decimal"
              maxLength={11}
              pattern="[0-9]{1,8}([.,][0-9]{1,2})?"
              value={campos[clave]}
              onChange={(evento) => {
                mostrarConfirmacion(false);
                cambiarCampos({ ...campos, [clave]: evento.target.value });
              }}
            />
          </label>
        ))}
      </div>
      <p className="text-sm text-[#4d665b]">
        Deja un campo vacío para indicar que ese dato no está disponible. Usa 0
        si la entrada es gratuita.
      </p>
      {confirmar && (
        <div
          className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          role="status"
        >
          <p className="text-sm">
            Los cambios serán visibles en la ficha pública de {ficha.nombre}.
            ¿Deseas guardarlos?
          </p>
          <button
            type="button"
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold"
            onClick={() => mostrarConfirmacion(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      <button
        disabled={pendiente}
        className="rounded-lg bg-[#174238] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23574a] disabled:opacity-60"
      >
        {pendiente
          ? "Guardando…"
          : confirmar
            ? "Confirmar cambios"
            : "Guardar cambios"}
      </button>
      {estado.mensaje && (
        <p
          role={estado.error ? "alert" : "status"}
          className={
            estado.error ? "text-sm text-rose-900" : "text-sm text-green-900"
          }
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
