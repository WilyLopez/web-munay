import Link from "next/link";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { ReintentarAnclaje } from "@/features/administracion/reintentar-anclaje";
import { solicitarVisitas } from "@/features/visitas/api";
import { fechaVisita } from "@/features/visitas/tipos";

const estados: Record<string, string> = {
  pendiente: "En cola",
  enviado: "Pendiente de confirmación",
  confirmado: "Confirmado",
  fallido: "Fallido",
};
const campo = "rounded-lg border border-[#bdcfc2] bg-white px-3 py-2 text-sm";
type Consulta = { estado?: string; buscar?: string; pagina?: string };
type Listado = {
  total: number;
  confirmados: number;
  pendientes: number;
  costoPromedioWei: string | null;
  contrato: string | null;
  filas: {
    resenaId: string;
    huella: string;
    estado: string;
    transaccion: string | null;
    bloque: string | null;
    creadoEn: string;
    error: string | null;
    resena: {
      usuarioId: string;
      calificacion: number;
      destino: { nombre: string };
    };
  }[];
};

async function Registros({ consulta }: { consulta: Promise<Consulta> }) {
  if (!(await accesoPanel(true))) return null;
  const { estado, buscar, pagina } = await consulta;
  const actual = pagina && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : 1;
  const filtros = new URLSearchParams({
    estado: estado ?? "",
    buscar: buscar ?? "",
  });
  const resultado = await solicitarVisitas<Listado>(
    `/anclajes-resenas?${filtros}&pagina=${actual}`,
  );
  if (!resultado.ok) return <p role="alert">{resultado.mensaje}</p>;
  const { total, filas, confirmados, pendientes, costoPromedioWei, contrato } =
    resultado.datos;

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Confirmados", confirmados],
          ["En cola o en red", pendientes],
          [
            "Costo promedio",
            costoPromedioWei ? `${costoPromedioWei} wei` : "—",
          ],
        ].map(([etiqueta, valor]) => (
          <div
            key={etiqueta}
            className="rounded-2xl border border-[#dce3da] bg-white p-4"
          >
            <dt className="text-sm font-semibold">{etiqueta}</dt>
            <dd className="mt-1 wrap-anywhere text-lg">{valor}</dd>
          </div>
        ))}
      </dl>
      {contrato ? (
        <p className="wrap-anywhere text-sm">
          Contrato de Sepolia{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${contrato}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            {contrato}
          </a>
        </p>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          La conexión con Sepolia está pendiente. Las reseñas verificadas se
          guardan en la cola y la plataforma las enviará cuando se configure el
          backend.
        </p>
      )}
      <form
        action="/superadmin/blockchain"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#dce3da] bg-white p-4"
      >
        <label className="grid min-w-0 grow gap-1 text-sm font-semibold">
          Buscar
          <input
            name="buscar"
            defaultValue={buscar}
            maxLength={80}
            placeholder="Huella, transacción o ID del usuario"
            className={campo}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Estado
          <select name="estado" defaultValue={estado ?? ""} className={campo}>
            <option value="">Todos</option>
            <option value="pendientes">En cola</option>
            <option value="confirmado">Confirmados</option>
            <option value="fallido">Fallidos</option>
          </select>
        </label>
        <button className="rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white">
          Aplicar filtros
        </button>
        <a
          href={`/api/superadmin/blockchain/exportar?${filtros}`}
          download="munay-auditoria-blockchain.csv"
          className="rounded-lg border border-[#bdcfc2] px-3 py-2 text-sm font-semibold hover:bg-[#edf4ed]"
        >
          Exportar auditoría
        </a>
      </form>
      {filas.length ? (
        <ul className="divide-y divide-[#dce3da] rounded-2xl border border-[#dce3da] bg-white">
          {filas.map((fila) => (
            <li key={fila.resenaId} className="space-y-2 p-5 text-sm">
              <p className="font-semibold">
                {fila.resena.destino.nombre} · {fila.resena.calificacion} de 5 ·{" "}
                {estados[fila.estado]}
              </p>
              <p>
                {fechaVisita.format(new Date(fila.creadoEn))}
                {fila.bloque && ` · Bloque ${fila.bloque}`}
              </p>
              <p className="wrap-anywhere">Usuario {fila.resena.usuarioId}</p>
              <p className="wrap-anywhere">
                SHA-256 <code>{fila.huella}</code>
              </p>
              {fila.transaccion && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${fila.transaccion}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wrap-anywhere font-semibold underline"
                >
                  Transacción {fila.transaccion}
                </a>
              )}
              {fila.error && <p className="text-rose-800">{fila.error}</p>}
              {fila.estado === "fallido" && contrato && (
                <ReintentarAnclaje id={fila.resenaId} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-[#dce3da] bg-white p-5">
          No hay registros que coincidan con esta consulta.
        </p>
      )}
      <nav
        aria-label="Páginas de registros blockchain"
        className="flex flex-wrap gap-4 text-sm"
      >
        <span>{total} registros</span>
        {actual > 1 && (
          <Link
            href={`?${filtros}&pagina=${actual - 1}`}
            className="font-semibold underline"
          >
            Anterior
          </Link>
        )}
        {actual * 20 < total && (
          <Link
            href={`?${filtros}&pagina=${actual + 1}`}
            className="font-semibold underline"
          >
            Siguiente
          </Link>
        )}
      </nav>
    </>
  );
}

export default function PaginaBlockchain({
  searchParams,
}: {
  searchParams: Promise<Consulta>;
}) {
  return (
    <main className="max-w-5xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">
        Registros blockchain
      </h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-40 rounded-2xl bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando registros</span>
          </div>
        }
      >
        <Registros consulta={searchParams} />
      </Suspense>
    </main>
  );
}
