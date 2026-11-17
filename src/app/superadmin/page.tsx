import { TextoResena } from "@/features/resenas/texto-resena";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { accesoPanel } from "@/features/administracion/acceso";
import { solicitarVisitas } from "@/features/visitas/api";

type DestinoResumen = {
  id: string;
  nombre: string;
  slug: string;
  estadoEditorial: "borrador" | "en_revision" | "publicado";
  publicado: boolean;
};

type RespuestaUsuarios = {
  total: number;
  usuarios: {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: string;
    activo: boolean;
    creadaEn: string;
  }[];
};

type RespuestaReportes = {
  reportes: {
    id: string;
    motivo: string;
    riesgo: number | null;
    creadoEn: string;
    resena: {
      id: string;
      comentario: string;
      calificacion: number;
      destino: { nombre: string };
      usuario: { nombreCompleto: string };
    };
  }[];
  pendientesAutomaticos: number;
};

type RespuestaAccesos = {
  filas: {
    id: string;
    tipo: "invitacion" | "solicitud";
    estado: string;
    correo: string;
    creadoEn: string;
    destino: { id: string; nombre: string } | null;
  }[];
};

type RespuestaBlockchain = {
  total: number;
  confirmados: number;
  pendientes: number;
};

async function ContenidoDashboard() {
  await connection();
  if (!(await accesoPanel(true))) return null;

  const [destinosRes, usuariosRes, reportesRes, accesosRes, blockchainRes] =
    await Promise.all([
      solicitarVisitas<DestinoResumen[]>("/destinos/administracion/resumen"),
      solicitarVisitas<RespuestaUsuarios>("/superadmin/usuarios?limite=5"),
      solicitarVisitas<RespuestaReportes>(
        "/reportes-resenas?estado=pendientes&pagina=1",
      ),
      solicitarVisitas<RespuestaAccesos>(
        "/gestion-accesos?estado=pendientes&pagina=1",
      ),
      solicitarVisitas<RespuestaBlockchain>(
        "/anclajes-resenas?estado=pendiente&pagina=1",
      ),
    ]);

  const destinos = destinosRes.ok ? destinosRes.datos : [];
  const totalDestinos = destinos.length;
  const destinosEnRevision = destinos.filter(
    (d) => d.estadoEditorial === "en_revision",
  );
  const destinosPublicados = destinos.filter(
    (d) => d.estadoEditorial === "publicado" || d.publicado,
  ).length;

  const totalUsuarios = usuariosRes.ok ? usuariosRes.datos.total : 0;

  const reportes = reportesRes.ok ? reportesRes.datos.reportes : [];
  const totalReportes = reportes.length;

  const accesos = accesosRes.ok ? accesosRes.datos.filas : [];
  const solicitudesPendientes = accesos.filter(
    (a) => a.tipo === "solicitud" && a.estado === "pendiente",
  ).length;
  const invitacionesPendientes = accesos.filter(
    (a) => a.tipo === "invitacion" && a.estado === "pendiente",
  ).length;
  const totalAccesosPendientes =
    solicitudesPendientes + invitacionesPendientes;

  const confirmadosBlockchain = blockchainRes.ok
    ? blockchainRes.datos.confirmados
    : 0;
  const pendientesBlockchain = blockchainRes.ok
    ? blockchainRes.datos.pendientes
    : 0;

  return (
    <main className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl text-[#173b32]">
          Dashboard de administración
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[#4d665b]">
          Resumen operativo global, indicadores clave y tareas prioritarias que
          requieren atención en la plataforma Munay.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/superadmin/destinos"
          className="group rounded-2xl border border-[#dce3da] bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Atractivos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ed] text-[#174238] transition-colors group-hover:bg-[#174238] group-hover:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 22h16" />
                <path d="M2 18h20" />
                <path d="M4 18v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7" />
                <path d="M12 2l8 8H4z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#173b32]">
            {totalDestinos}
          </p>
          <p className="mt-1 text-xs text-[#4d665b]">
            {destinosPublicados} publicados · {destinosEnRevision.length} en revisión
          </p>
        </Link>

        <Link
          href="/superadmin/usuarios"
          className="group rounded-2xl border border-[#dce3da] bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Usuarios
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ed] text-[#174238] transition-colors group-hover:bg-[#174238] group-hover:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#173b32]">
            {totalUsuarios}
          </p>
          <p className="mt-1 text-xs text-[#4d665b]">
            Cuentas registradas en el sistema
          </p>
        </Link>

        <Link
          href="/superadmin/reportes"
          className="group rounded-2xl border border-[#dce3da] bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Moderación
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ed] text-[#174238] transition-colors group-hover:bg-[#174238] group-hover:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#173b32]">
            {totalReportes}
          </p>
          <p className="mt-1 text-xs text-[#4d665b]">
            {totalReportes === 0
              ? "Sin reportes pendientes"
              : `${totalReportes} reportes por moderar`}
          </p>
        </Link>

        <Link
          href="/superadmin/accesos"
          className="group rounded-2xl border border-[#dce3da] bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Accesos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ed] text-[#174238] transition-colors group-hover:bg-[#174238] group-hover:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#173b32]">
            {totalAccesosPendientes}
          </p>
          <p className="mt-1 text-xs text-[#4d665b]">
            {solicitudesPendientes} solicitudes · {invitacionesPendientes} invitaciones
          </p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#173b32]">
              Atractivos en revisión
            </h2>
            <Link
              href="/superadmin/destinos"
              className="text-xs font-semibold text-[#174238] underline hover:text-[#23574a]"
            >
              Ver todos
            </Link>
          </div>
          {destinosEnRevision.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {destinosEnRevision.slice(0, 5).map((destino) => (
                <li
                  key={destino.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-stone-900">
                      {destino.nombre}
                    </p>
                    <p className="text-xs text-[#4d665b]">
                      Pendiente de aprobación editorial
                    </p>
                  </div>
                  <Link
                    href={`/superadmin/destinos/${encodeURIComponent(destino.slug)}`}
                    className="rounded-lg bg-[#edf4ed] px-3 py-1.5 text-xs font-semibold text-[#174238] transition-colors hover:bg-[#174238] hover:text-white"
                  >
                    Revisar
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-[#4d665b]">
              No hay atractivos turísticos pendientes de revisión editorial.
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#173b32]">
              Reportes de reseñas
            </h2>
            <Link
              href="/superadmin/reportes"
              className="text-xs font-semibold text-[#174238] underline hover:text-[#23574a]"
            >
              Ir a reportes
            </Link>
          </div>
          {reportes.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {reportes.slice(0, 5).map((reporte) => (
                <li
                  key={reporte.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {reporte.resena.destino.nombre}
                    </p>
                    <TextoResena texto={reporte.resena.comentario} compacto />
                    <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                      Motivo: {reporte.motivo}
                    </span>
                  </div>
                  <Link
                    href="/superadmin/reportes"
                    className="shrink-0 rounded-lg bg-[#edf4ed] px-3 py-1.5 text-xs font-semibold text-[#174238] transition-colors hover:bg-[#174238] hover:text-white"
                  >
                    Evaluar
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-[#4d665b]">
              No hay reportes de reseñas pendientes. La comunidad se encuentra moderada.
            </p>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-[#173b32]">
          Operaciones y servicios
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[#174238]"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01" />
                <path d="M17 7h.01" />
                <path d="M7 17h.01" />
                <path d="M17 17h.01" />
              </svg>
              <h3 className="text-sm font-semibold text-stone-900">
                Registros blockchain
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#4d665b]">
              {confirmadosBlockchain} anclajes confirmados · {pendientesBlockchain} en cola de procesamiento.
            </p>
            <Link
              href="/superadmin/blockchain"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#174238] underline"
            >
              Auditar registros
            </Link>
          </div>

          <div className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[#174238]"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <h3 className="text-sm font-semibold text-stone-900">
                Encargados de atractivos
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#4d665b]">
              Gestiona invitaciones oficiales y evalúa solicitudes de administradores locales.
            </p>
            <Link
              href="/superadmin/accesos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#174238] underline"
            >
              Administrar accesos
            </Link>
          </div>

          <div className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[#174238]"
                aria-hidden="true"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <h3 className="text-sm font-semibold text-stone-900">
                Estadísticas de visita
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#4d665b]">
              Analiza flujos de visitantes verificados por QR y distribución de calificaciones.
            </p>
            <Link
              href="/administracion/estadisticas"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#174238] underline"
            >
              Ver métricas detalladas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaginaSuperAdmin() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-[#4d665b]">Cargando dashboard…</p>}>
      <ContenidoDashboard />
    </Suspense>
  );
}
