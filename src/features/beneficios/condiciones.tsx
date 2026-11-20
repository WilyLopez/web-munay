import type { DetalleBeneficio } from "./tipos";
const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
export function valorBeneficio(datos: Partial<DetalleBeneficio>) {
  if (datos.tipo === "PORCENTAJE" && datos.valor)
    return `${datos.valor} % de descuento`;
  if (datos.tipo === "IMPORTE" && datos.valor)
    return `${moneda.format(datos.valor / 100)} de descuento`;
  return datos.tipo === "ENTRADA" ? "Entrada incluida" : "Experiencia incluida";
}
export function CondicionesBeneficio({
  datos,
}: {
  datos: Partial<DetalleBeneficio>;
}) {
  return (
    <div className="space-y-2 rounded-xl bg-[#f3f6ef] p-4 text-sm leading-relaxed text-[#40594f]">
      {datos.tipo && (
        <p className="font-semibold text-[#174238]">{valorBeneficio(datos)}</p>
      )}
      {datos.dias && datos.dias.length > 0 && (
        <p>
          Días de uso:{" "}
          {datos.dias
            .map(
              (dia) =>
                [
                  "domingo",
                  "lunes",
                  "martes",
                  "miércoles",
                  "jueves",
                  "viernes",
                  "sábado",
                ][dia],
            )
            .join(", ")}
          .
        </p>
      )}
      {datos.horaInicio && datos.horaFin && (
        <p>
          De {datos.horaInicio} a {datos.horaFin}, hora de Perú.
        </p>
      )}
      {!!datos.consumoMinimo && (
        <p>Consumo mínimo: {moneda.format(datos.consumoMinimo / 100)}.</p>
      )}
      {datos.limitePorPersona !== undefined && (
        <p>
          {datos.limitePorPersona === null
            ? "Sin límite por persona, sujeto a cupos."
            : `Hasta ${datos.limitePorPersona} ${datos.limitePorPersona === 1 ? "canje" : "canjes"} por persona.`}
        </p>
      )}
      {datos.reservaPrevia && <p>Requiere reserva previa con el local.</p>}
      {datos.acumulable !== undefined && (
        <p>
          {datos.acumulable
            ? "Acumulable con otras promociones según las condiciones."
            : "No acumulable con otras promociones."}
        </p>
      )}
      {datos.exclusiones && (
        <p className="whitespace-pre-wrap wrap-anywhere">
          Exclusiones: {datos.exclusiones}
        </p>
      )}
    </div>
  );
}
