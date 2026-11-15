"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { consultar, useDestinos } from "./consultas";
import { FichaUsuario } from "./detalle";
import { boton, campo, fecha, principal, roles, type Pagina } from "./tipos";

const ruta = "/superadmin/usuarios";
const camposFiltro = [
  "buscar",
  "rol",
  "estado",
  "correo",
  "desde",
  "hasta",
  "destino",
] as const;

export function TablaUsuarios() {
  const router = useRouter();
  const { usuarioId } = useParams<{ usuarioId?: string }>();
  const params = useSearchParams();
  const vista = params.get("vista") === "super" ? "super" : "general";
  const superAdmin = vista === "super";
  const filtros = new URLSearchParams({ vista });
  for (const clave of camposFiltro) {
    const valor = params.get(clave);
    if (valor && !(superAdmin && (clave === "rol" || clave === "destino")))
      filtros.set(clave, valor);
  }
  filtros.set("limite", params.get("limite") ?? "20");
  const clave = filtros.toString();
  const pagina = params.get("pagina") ?? "1";
  const consulta = useQuery({
    queryKey: ["usuarios", clave, pagina],
    queryFn: ({ signal }) =>
      consultar<Pagina>(
        `?${clave}&pagina=${encodeURIComponent(pagina)}`,
        signal,
      ),
    placeholderData: (anterior, consultaAnterior) =>
      consultaAnterior?.queryKey[1] === clave ? anterior : undefined,
  });
  const datos = consulta.data;
  const destinos = useDestinos();
  const consultaActual = new URLSearchParams(params);
  const base = consultaActual.size ? `?${consultaActual}` : "";

  function ir(siguientes: URLSearchParams) {
    router.push(`${ruta}${siguientes.size ? `?${siguientes}` : ""}`, {
      scroll: false,
    });
  }

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const data = new FormData(evento.currentTarget);
    const siguientes = new URLSearchParams({
      vista,
      limite: filtros.get("limite") ?? "20",
    });
    for (const campo of camposFiltro) {
      const valor = String(data.get(campo) ?? "").trim();
      if (valor) siguientes.set(campo, valor);
    }
    ir(siguientes);
  }

  function cambiarPagina(nueva: number) {
    const siguientes = new URLSearchParams(filtros);
    siguientes.set("pagina", String(nueva));
    ir(siguientes);
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">Usuarios</h1>
        <p className="mt-2 text-sm text-[#4d665b]">
          Consulta cuentas y gestiona sus accesos.
        </p>
      </div>
      <nav aria-label="Vistas de usuarios" className="flex flex-wrap gap-2">
        {(
          [
            ["general", "Usuarios y administradores"],
            ["super", "Super Administrador"],
          ] as const
        ).map(([id, etiqueta]) => (
          <Link
            key={id}
            href={id === "general" ? ruta : `${ruta}?vista=super`}
            scroll={false}
            aria-current={vista === id ? "page" : undefined}
            className="rounded-full border border-[#bdcfc2] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#edf4ed] aria-[current=page]:border-[#174238] aria-[current=page]:bg-[#dbece0]"
          >
            {etiqueta}
          </Link>
        ))}
      </nav>
      <form
        key={clave}
        onSubmit={aplicar}
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-4 sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <Filtro etiqueta="Buscar por nombre o correo">
            <input
              name="buscar"
              className={campo}
              defaultValue={filtros.get("buscar") ?? ""}
              maxLength={120}
              placeholder="Nombre o correo electrónico"
            />
          </Filtro>
          {!superAdmin && (
            <Filtro etiqueta="Rol">
              <select
                name="rol"
                className={campo}
                defaultValue={filtros.get("rol") ?? ""}
              >
                <option value="">Todos los roles</option>
                <option value="TURISTA">Usuario</option>
                <option value="ADMIN_DESTINO">Admin</option>
              </select>
            </Filtro>
          )}
          <Filtro etiqueta="Estado">
            <select
              name="estado"
              className={campo}
              defaultValue={filtros.get("estado") ?? ""}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activas</option>
              <option value="inactivo">Desactivadas</option>
            </select>
          </Filtro>
        </div>
        <details
          open={
            ["correo", "desde", "hasta", "destino"].some((id) =>
              filtros.has(id),
            ) || undefined
          }
          className="rounded-xl border border-[#dce3da] p-3"
        >
          <summary className="cursor-pointer text-sm font-semibold">
            Filtros avanzados
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Filtro etiqueta="Confirmación del correo">
              <select
                name="correo"
                className={campo}
                defaultValue={filtros.get("correo") ?? ""}
              >
                <option value="">Todos</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </Filtro>
            <Filtro etiqueta="Registrado desde">
              <input
                type="date"
                name="desde"
                className={campo}
                defaultValue={filtros.get("desde") ?? ""}
              />
            </Filtro>
            <Filtro etiqueta="Registrado hasta">
              <input
                type="date"
                name="hasta"
                className={campo}
                defaultValue={filtros.get("hasta") ?? ""}
              />
            </Filtro>
            {!superAdmin && (
              <Filtro etiqueta="Destino asignado">
                <select
                  name="destino"
                  className={campo}
                  defaultValue={filtros.get("destino") ?? ""}
                >
                  <option value="">Todos los destinos</option>
                  {destinos.data?.map(({ id, nombre }) => (
                    <option key={id} value={id}>
                      {nombre}
                    </option>
                  ))}
                  {!destinos.data && filtros.has("destino") && (
                    <option value={filtros.get("destino")!}>
                      Destino filtrado
                    </option>
                  )}
                </select>
              </Filtro>
            )}
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <button className={principal}>Aplicar filtros</button>
          <Link
            href={superAdmin ? `${ruta}?vista=super` : ruta}
            scroll={false}
            className={boton}
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      <section
        aria-label="Resultados"
        aria-busy={consulta.isFetching}
        className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white"
      >
        {consulta.isPending && (
          <p role="status" className="p-5">
            Cargando usuarios…
          </p>
        )}
        {consulta.isError && (
          <div className="space-y-3 p-5">
            <p role="alert">{consulta.error.message}</p>
            <button className={boton} onClick={() => consulta.refetch()}>
              Reintentar
            </button>
          </div>
        )}
        {datos && (
          <>
            {datos.usuarios.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#edf3ec]">
                    <tr>
                      <th scope="col" className="p-3 sm:px-5">
                        Usuario
                      </th>
                      <th scope="col" className="p-3">
                        Rol
                      </th>
                      <th scope="col" className="p-3">
                        Estado
                      </th>
                      <th scope="col" className="hidden p-3 lg:table-cell">
                        Correo
                      </th>
                      <th scope="col" className="hidden p-3 lg:table-cell">
                        Destinos
                      </th>
                      <th scope="col" className="hidden p-3 lg:table-cell">
                        Registro
                      </th>
                      <th scope="col" className="p-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e9e1]">
                    {datos.usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <th
                          scope="row"
                          className="wrap-anywhere p-3 font-semibold sm:px-5"
                        >
                          {usuario.nombreCompleto}
                          <span className="block text-xs font-normal text-[#4d665b]">
                            {usuario.correo}
                          </span>
                        </th>
                        <td className="p-3">{roles[usuario.rol]}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${usuario.activo ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"}`}
                          >
                            {usuario.activo ? "Activa" : "Desactivada"}
                          </span>
                        </td>
                        <td className="hidden p-3 lg:table-cell">
                          {usuario.confirmado ? "Confirmado" : "Pendiente"}
                        </td>
                        <td className="hidden p-3 lg:table-cell">
                          {usuario.rol === "ADMIN_DESTINO"
                            ? usuario.asignados
                            : "—"}
                        </td>
                        <td className="hidden p-3 lg:table-cell">
                          {fecha.format(new Date(usuario.creadaEn))}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`${ruta}/${usuario.id}${base}`}
                            scroll={false}
                            className="font-semibold underline underline-offset-4"
                            aria-label={`Ver detalle de ${usuario.nombreCompleto}`}
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-5">No encontramos cuentas con estos filtros.</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce3da] p-4">
              <p aria-live="polite" className="text-sm">
                {datos.total} {datos.total === 1 ? "cuenta" : "cuentas"} ·
                Página {datos.pagina} de{" "}
                {Math.max(1, Math.ceil(datos.total / datos.limite))}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm">
                  Por página{" "}
                  <select
                    className={campo}
                    value={filtros.get("limite") ?? "20"}
                    onChange={(evento) => {
                      const siguientes = new URLSearchParams(filtros);
                      siguientes.set("limite", evento.target.value);
                      ir(siguientes);
                    }}
                  >
                    {[10, 20, 50].map((limite) => (
                      <option key={limite} value={limite}>
                        {limite}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={boton}
                  disabled={consulta.isPlaceholderData || datos.pagina <= 1}
                  onClick={() => cambiarPagina(datos.pagina - 1)}
                >
                  Anterior
                </button>
                <button
                  className={boton}
                  disabled={
                    consulta.isPlaceholderData ||
                    datos.pagina * datos.limite >= datos.total
                  }
                  onClick={() => cambiarPagina(datos.pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {usuarioId && (
        <PanelLateral
          key={usuarioId}
          cerrar={() => router.replace(`${ruta}${base}`, { scroll: false })}
        >
          <FichaUsuario id={usuarioId} />
        </PanelLateral>
      )}
    </main>
  );
}

function Filtro({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {etiqueta}
      {children}
    </label>
  );
}

function PanelLateral({
  children,
  cerrar,
}: {
  children: ReactNode;
  cerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const nodo = dialogo.current;
    nodo?.showModal();
    return () => nodo?.close();
  }, []);
  return (
    <dialog
      ref={dialogo}
      aria-labelledby="detalle-cuenta"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-l border-[#dce3da] bg-[#fbfcf8] text-[#173b32] shadow-2xl backdrop:bg-[#0e2a23]/55 sm:w-[min(34rem,100vw)]"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#dce3da] bg-[#fbfcf8] px-5 py-3">
        <h2 id="detalle-cuenta" className="font-semibold">
          Detalle de la cuenta
        </h2>
        <button className={boton} onClick={cerrar}>
          Cerrar
        </button>
      </header>
      {children}
    </dialog>
  );
}
