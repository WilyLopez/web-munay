export type ColumnaCsv<T> = {
  cabecera: string;
  valor: (fila: T) => string | number | boolean | null | undefined;
};

export function descargarCsv<T>(
  nombreArchivo: string,
  columnas: ColumnaCsv<T>[],
  filas: T[],
) {
  const escapar = (texto: string) => {
    if (texto.includes(",") || texto.includes('"') || texto.includes("\n")) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const lineaCabecera = columnas.map((c) => escapar(c.cabecera)).join(",");

  const lineasDatos = filas.map((fila) =>
    columnas
      .map((c) => {
        const val = c.valor(fila);
        if (val === null || val === undefined) return "";
        return escapar(String(val));
      })
      .join(","),
  );

  const contenido = "\uFEFF" + [lineaCabecera, ...lineasDatos].join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith(".csv")
    ? nombreArchivo
    : `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
