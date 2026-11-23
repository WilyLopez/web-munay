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

function tiempoRelativo(iso: string): string {
  const ahora = Date.now();
  const diff = Math.floor((ahora - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function TarjetaKpi({
  href,
  titulo,
  valor,
  subtexto,
  alerta,
  progreso,
  total,
  icono,
}: {
  href: string;
  titulo: string;
  valor: number;
  subtexto: string;
  alerta?: boolean;
  progreso?: number;
  total?: number;
  icono: React.ReactNode;
}) {
  const colorBorde = alerta && valor > 0 ? "border-amber-300" : "border-[#dce3da]";
  const colorFondo = alerta && valor > 0 ? "bg-amber-50" : "bg-white";
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border ${colorBorde} ${colorFondo} p-5 transition-shadow hover:shadow-md`}
    >
      {alerta && valor > 0 && (
        <span className="absolute right-3 top-3 flex h-2 w-2 rounded-full bg-amber-500">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
          {titulo}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ed] text-[#174238] transition-colors group-hover:bg-[#174238] group-hover:text-white">
          {icono}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#173b32]">
        {valor}
      </p>
      <p className="mt-1 text-xs text-[#4d665b]">{subtexto}</p>
      {progreso !== undefined && total !== undefined && total > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-[#4d665b]">
            <span>{progreso} publicados</span>
            <span>{Math.round((progreso / total) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dce3da]">
            <div
              className="h-full rounded-full bg-[#174238] transition-all"
              style={{ width: `${Math.round((progreso / total) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

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
  const usuariosRecientes = usuariosRes.ok ? usuariosRes.datos.usuarios : [];

  const reportes = reportesRes.ok ? reportesRes.datos.reportes : [];
  const totalReportes = reportes.length;
  const reportesRiesgoAlto = reportes.filter(
    (r) => r.riesgo !== null && r.riesgo >= 0.7,
  ).length;

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

  const ahora = new Date();
  const horaStr = ahora.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
  const fechaStr = ahora.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });

  type EventoFeed = {
    tipo: "usuario" | "reporte" | "acceso" | "destino" | "blockchain";
    texto: string;
    sub: string;
    tiempo: string;
  };

  const feedEventos: EventoFeed[] = [
    ...usuariosRecientes.slice(0, 2).map((u) => ({
      tipo: "usuario" as const,
      texto: u.nombreCompleto,
      sub: "Nuevo usuario registrado",
      tiempo: tiempoRelativo(u.creadaEn),
    })),
    ...reportes.slice(0, 2).map((r) => ({
      tipo: "reporte" as const,
      texto: r.resena.destino.nombre,
      sub: `Reporte: ${r.motivo}`,
      tiempo: tiempoRelativo(r.creadoEn),
    })),
    ...accesos.slice(0, 2).map((a) => ({
      tipo: "acceso" as const,
      texto: a.destino?.nombre ?? "Nuevo atractivo",
      sub: a.tipo === "solicitud" ? "Solicitud de acceso" : "Invitación pendiente",
      tiempo: tiempoRelativo(a.creadoEn),
    })),
  ]
    .sort((a, b) => (a.tiempo > b.tiempo ? 1 : -1))
    .slice(0, 6);

  const coloresFeed: Record<EventoFeed["tipo"], string> = {
    usuario: "bg-blue-100 text-blue-700",
    reporte: "bg-rose-100 text-rose-700",
    acceso: "bg-amber-100 text-amber-700",
    destino: "bg-teal-100 text-teal-700",
    blockchain: "bg-violet-100 text-violet-700",
  };

  const iconosFeed: Record<EventoFeed["tipo"], React.ReactNode> = {
    usuario: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    reporte: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    acceso: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    destino: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <path d="M4 22h16" /><path d="M2 18h20" /><path d="M4 18v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7" /><path d="M12 2l8 8H4z" />
      </svg>
    ),
    blockchain: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" />
      </svg>
    ),
  };

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl tracking-tight text-[#173b32] sm:text-4xl">
            Dashboard de administración
          </h1>
          <p className="text-sm text-[#4d665b]">
            Resumen operativo global de la plataforma Munay.
          </p>
        </div>
        <div className="rounded-xl border border-[#dce3da] bg-white px-4 py-2.5 text-right">
          <p className="text-xs font-semibold capitalize text-[#4d665b]">{fechaStr}</p>
          <p className="text-sm font-bold text-[#173b32]">{horaStr}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          href="/superadmin/destinos"
          titulo="Atractivos"
          valor={totalDestinos}
          subtexto={`${destinosEnRevision.length} en revisión · ${totalDestinos - destinosPublicados - destinosEnRevision.length} borradores`}
          progreso={destinosPublicados}
          total={totalDestinos}
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M4 22h16" /><path d="M2 18h20" /><path d="M4 18v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7" /><path d="M12 2l8 8H4z" />
            </svg>
          }
        />
        <TarjetaKpi
          href="/superadmin/usuarios"
          titulo="Usuarios"
          valor={totalUsuarios}
          subtexto="Cuentas registradas en el sistema"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <TarjetaKpi
          href="/superadmin/reportes"
          titulo="Moderación"
          valor={totalReportes}
          subtexto={
            totalReportes === 0
              ? "Sin reportes pendientes"
              : `${reportesRiesgoAlto} de alto riesgo · ${totalReportes} total`
          }
          alerta={totalReportes > 0}
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          }
        />
        <TarjetaKpi
          href="/superadmin/accesos"
          titulo="Accesos"
          valor={totalAccesosPendientes}
          subtexto={`${solicitudesPendientes} solicitudes · ${invitacionesPendientes} invitaciones`}
          alerta={totalAccesosPendientes > 0}
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6 lg:col-span-2">
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
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4ed] text-[#174238]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#173b32]">Todo al día</p>
              <p className="text-xs text-[#4d665b]">
                No hay atractivos turísticos pendientes de revisión editorial.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#173b32]">
              Actividad reciente
            </h2>
          </div>
          {feedEventos.length > 0 ? (
            <ul className="space-y-3">
              {feedEventos.map((evento, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${coloresFeed[evento.tipo]}`}
                  >
                    {iconosFeed[evento.tipo]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#173b32]">
                      {evento.texto}
                    </p>
                    <p className="text-xs text-[#4d665b]">{evento.sub}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#768a80]">
                    {evento.tiempo}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-[#4d665b]">
              No hay actividad reciente para mostrar.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              {reportes.slice(0, 4).map((reporte) => (
                <li
                  key={reporte.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {reporte.resena.destino.nombre}
                    </p>
                    <TextoResena texto={reporte.resena.comentario} compacto />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                        {reporte.motivo}
                      </span>
                      {reporte.riesgo !== null && reporte.riesgo >= 0.7 && (
                        <span className="inline-block rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          Alto riesgo
                        </span>
                      )}
                    </div>
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
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4ed] text-[#174238]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#173b32]">Comunidad moderada</p>
              <p className="text-xs text-[#4d665b]">
                No hay reportes de reseñas pendientes.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-[#173b32]">
            Operaciones y servicios
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-4 rounded-xl border border-[#dce3da] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#173b32]">Registros blockchain</p>
                <p className="mt-0.5 text-xs text-[#4d665b]">
                  {confirmadosBlockchain} confirmados · {pendientesBlockchain} en cola
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#dce3da]">
                  {confirmadosBlockchain + pendientesBlockchain > 0 && (
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{
                        width: `${Math.round((confirmadosBlockchain / (confirmadosBlockchain + pendientesBlockchain)) * 100)}%`,
                      }}
                    />
                  )}
                </div>
                <Link href="/superadmin/blockchain" className="mt-2 inline-flex items-center text-xs font-semibold text-[#174238] underline">
                  Auditar registros
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-[#dce3da] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#173b32]">Encargados de atractivos</p>
                <p className="mt-0.5 text-xs text-[#4d665b]">
                  {totalAccesosPendientes > 0
                    ? `${totalAccesosPendientes} pendientes de revisión`
                    : "Sin accesos pendientes"}
                </p>
                <Link href="/superadmin/accesos" className="mt-2 inline-flex items-center text-xs font-semibold text-[#174238] underline">
                  Administrar accesos
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-[#dce3da] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#173b32]">Estadísticas de visita</p>
                <p className="mt-0.5 text-xs text-[#4d665b]">
                  Flujos de visitantes verificados por QR y calificaciones.
                </p>
                <Link href="/administracion/estadisticas" className="mt-2 inline-flex items-center text-xs font-semibold text-[#174238] underline">
                  Ver métricas detalladas
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaginaSuperAdmin() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="h-10 w-80 animate-pulse rounded-xl bg-[#dce3da]" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-[#dce3da]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white border border-[#dce3da]" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-white border border-[#dce3da]" />
        </div>
      }
    >
      <ContenidoDashboard />
    </Suspense>
  );
}
