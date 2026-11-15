"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { guardarUsuario } from "./acciones";
import { consultar, useDestinos } from "./consultas";
import {
  boton,
  campo,
  fecha,
  principal,
  roles,
  type Cambio,
  type Detalle,
} from "./tipos";

const acciones = {
  nombre: "Nombre actualizado",
  rol: "Rol actualizado",
  estado: "Estado actualizado",
  asignar: "Destino asignado",
  retirar: "Acceso retirado",
};

export function FichaUsuario({
  id = "perfil",
  soloPerfil = false,
}: {
  id?: string;
  soloPerfil?: boolean;
}) {
  const consulta = useQuery({
    queryKey: ["usuario", id],
    queryFn: ({ signal }) =>
      consultar<Detalle>(`/${encodeURIComponent(id)}`, signal),
  });
  if (consulta.isPending)
    return (
      <p role="status" className="p-5">
        Cargando cuenta…
      </p>
    );
  if (consulta.isError)
    return (
      <div className="space-y-3 p-5">
        <p role="alert">{consulta.error.message}</p>
        <button className={boton} onClick={() => consulta.refetch()}>
          Reintentar
        </button>
      </div>
    );
  return (
    <Contenido
      key={consulta.data.id}
      usuario={consulta.data}
      soloPerfil={soloPerfil}
    />
  );
}

function Contenido({
  usuario,
  soloPerfil,
}: {
  usuario: Detalle;
  soloPerfil: boolean;
}) {
  const cliente = useQueryClient();
  const [cambio, preparar] = useState<Cambio | null>(null);
  const [mensaje, informar] = useState("");
  const advertencia = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cambio) advertencia.current?.focus();
  }, [cambio]);

  const mutacion = useMutation({
    mutationFn: async (operacion: Cambio) => {
      const error = await guardarUsuario(
        usuario.id,
        operacion.accion,
        operacion.valor,
      );
      if (error) throw new Error(error);
    },
    onSuccess: async () => {
      await Promise.all([
        cliente.invalidateQueries({ queryKey: ["usuarios"] }),
        cliente.invalidateQueries({ queryKey: ["usuario"] }),
      ]);
      preparar(null);
      informar("Cambios guardados.");
    },
  });

  function confirmar(operacion: Cambio) {
    if (mutacion.isPending) return;
    mutacion.reset();
    informar("");
    preparar(operacion);
  }

  function editarNombre(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nombre = String(
      new FormData(evento.currentTarget).get("nombre") ?? "",
    ).trim();
    if (nombre && nombre !== usuario.nombreCompleto)
      confirmar({
        accion: "nombre",
        valor: nombre,
        titulo: "Guardar nombre",
        mensaje: `¿Actualizar el nombre de ${usuario.nombreCompleto} a ${nombre}?`,
      });
  }

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div className="space-y-2">
        <h2 className="wrap-anywhere font-serif text-3xl">
          {usuario.nombreCompleto}
        </h2>
        <p className="wrap-anywhere text-sm text-[#4d665b]">{usuario.correo}</p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#e6eee6] px-3 py-1">
            {roles[usuario.rol]}
          </span>
          <span
            className={`rounded-full px-3 py-1 ${usuario.activo ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"}`}
          >
            {usuario.activo ? "Activa" : "Desactivada"}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#edf3ec] p-4 text-sm">
        <div>
          <dt className="font-semibold">Registro</dt>
          <dd>{fecha.format(new Date(usuario.creadaEn))}</dd>
        </div>
        <div>
          <dt className="font-semibold">Correo</dt>
          <dd>{usuario.confirmado ? "Confirmado" : "Pendiente"}</dd>
        </div>
      </dl>
      <p className="wrap-anywhere text-xs text-[#4d665b]">
        <span className="font-semibold">Identificador </span>
        {usuario.id}
      </p>

      {usuario.propia && !soloPerfil ? (
        <Link href="/superadmin/perfil" className={boton}>
          Ir a Mi perfil
        </Link>
      ) : (
        <form
          key={usuario.nombreCompleto}
          onSubmit={editarNombre}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid min-w-0 grow gap-1 text-sm font-semibold">
            Nombre completo
            <input
              className={campo}
              name="nombre"
              defaultValue={usuario.nombreCompleto}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <button className={boton} disabled={mutacion.isPending}>
            Guardar nombre
          </button>
        </form>
      )}

      {usuario.rol === "TURISTA" && (
        <section className="space-y-2">
          <h3 className="font-semibold">Actividad como visitante</h3>
          <p className="text-sm">
            {usuario.visitas} visitas verificadas · {usuario.resenas} reseñas
          </p>
        </section>
      )}
      {usuario.rol === "ADMIN_DESTINO" && (
        <Asignaciones usuario={usuario} confirmar={confirmar} />
      )}

      {!usuario.propia && (
        <section className="space-y-3 border-t border-[#dce3da] pt-5">
          <h3 className="font-semibold">Acceso y permisos</h3>
          <form
            key={usuario.rol}
            className="flex flex-wrap items-end gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              const rol = new FormData(evento.currentTarget).get(
                "rol",
              ) as keyof typeof roles;
              if (rol === usuario.rol) return;
              confirmar({
                accion: "rol",
                valor: rol,
                titulo: "Cambiar rol",
                mensaje: `¿Cambiar el rol de ${usuario.nombreCompleto} a ${roles[rol]}?${usuario.rol === "ADMIN_DESTINO" ? " Se retirarán sus asignaciones actuales." : ""}`,
              });
            }}
          >
            <label className="grid gap-1 text-sm font-semibold">
              Nuevo rol
              <select className={campo} name="rol" defaultValue={usuario.rol}>
                {Object.entries(roles).map(([rol, nombre]) => (
                  <option key={rol} value={rol}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <button className={boton}>Cambiar rol</button>
          </form>
          <button
            className={usuario.activo ? `${boton} text-rose-900` : boton}
            onClick={() =>
              confirmar({
                accion: "estado",
                valor: !usuario.activo,
                peligro: usuario.activo,
                titulo: usuario.activo
                  ? "Desactivar cuenta"
                  : "Reactivar cuenta",
                mensaje: usuario.activo
                  ? `¿Desactivar la cuenta de ${usuario.nombreCompleto}? Se cerrarán sus sesiones y se conservará su historial.`
                  : `¿Reactivar la cuenta de ${usuario.nombreCompleto}? Podrá volver a iniciar sesión.`,
              })
            }
          >
            {usuario.activo ? "Desactivar cuenta" : "Reactivar cuenta"}
          </button>
        </section>
      )}

      {cambio && (
        <div
          ref={advertencia}
          tabIndex={-1}
          role="region"
          aria-label="Confirmación de cambio"
          className={`space-y-3 rounded-xl border p-4 ${cambio.peligro ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}
        >
          <h3 className="font-semibold">{cambio.titulo}</h3>
          <p className="text-sm">{cambio.mensaje}</p>
          {mutacion.isError && (
            <p role="alert" className="text-sm text-rose-900">
              {mutacion.error.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className={boton}
              disabled={mutacion.isPending}
              onClick={() => preparar(null)}
            >
              Cancelar
            </button>
            <button
              className={
                cambio.peligro
                  ? `${principal} bg-rose-800 hover:bg-rose-900`
                  : principal
              }
              disabled={mutacion.isPending}
              onClick={() => mutacion.mutate(cambio)}
            >
              {mutacion.isPending ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
      {mensaje && (
        <p role="status" className="text-sm font-semibold text-green-900">
          {mensaje}
        </p>
      )}

      <section className="space-y-3 border-t border-[#dce3da] pt-5">
        <h3 className="font-semibold">Historial administrativo</h3>
        {usuario.historial.length ? (
          <ul className="divide-y divide-[#dce3da] rounded-xl border border-[#dce3da]">
            {usuario.historial.map((evento) => (
              <li key={evento.id} className="space-y-1 p-3 text-sm">
                <p className="font-semibold">
                  {acciones[evento.accion as keyof typeof acciones] ??
                    evento.accion}{" "}
                  · {fecha.format(new Date(evento.creadaEn))}
                </p>
                <p className="wrap-anywhere text-xs text-[#4d665b]">
                  Responsable {evento.actorId}
                </p>
                {typeof evento.cambios.destino === "string" && (
                  <p>{evento.cambios.destino}</p>
                )}
                {"anterior" in evento.cambios && (
                  <p>
                    {valorHistorial(evento.cambios.anterior)} →{" "}
                    {valorHistorial(evento.cambios.nuevo)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#4d665b]">
            Todavía no hay cambios registrados.
          </p>
        )}
      </section>
    </div>
  );
}

function valorHistorial(valor: unknown) {
  if (typeof valor === "boolean") return valor ? "Activa" : "Desactivada";
  return typeof valor === "string"
    ? (roles[valor as keyof typeof roles] ?? valor)
    : "";
}

function Asignaciones({
  usuario,
  confirmar,
}: {
  usuario: Detalle;
  confirmar: (operacion: Cambio) => void;
}) {
  const opciones = useDestinos();
  const disponibles = opciones.data?.filter(
    (destino) => !usuario.destinos.some(({ id }) => id === destino.id),
  );
  return (
    <section className="space-y-3 border-t border-[#dce3da] pt-5">
      <h3 className="font-semibold">Destinos asignados</h3>
      {usuario.destinos.length ? (
        <ul className="space-y-2">
          {usuario.destinos.map(({ id, slug, nombre }) => (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <Link
                href={`/administracion/estadisticas?destino=${encodeURIComponent(slug)}`}
                className="text-sm underline underline-offset-4"
              >
                {nombre}
              </Link>
              <button
                className={`${boton} text-rose-900`}
                onClick={() =>
                  confirmar({
                    accion: "retirar",
                    valor: id,
                    titulo: "Retirar acceso",
                    mensaje: `¿Retirar a ${usuario.nombreCompleto} el acceso a ${nombre}? Dejará de gestionar su QR y estadísticas.`,
                    peligro: true,
                  })
                }
              >
                Retirar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#4d665b]">
          Este administrador aún no tiene destinos asignados.
        </p>
      )}
      {usuario.activo && usuario.destinos.length === 0 && opciones.isError && (
        <button className={boton} onClick={() => opciones.refetch()}>
          Reintentar carga de destinos
        </button>
      )}
      {usuario.activo && usuario.destinos.length === 0 && Boolean(disponibles?.length) && (
        <form
          key={usuario.destinos.map(({ id }) => id).join(",")}
          className="flex flex-wrap items-end gap-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            const id = new FormData(evento.currentTarget).get("destino");
            const destino = disponibles?.find((item) => item.id === id);
            if (destino)
              confirmar({
                accion: "asignar",
                valor: destino.id,
                titulo: "Asignar destino",
                mensaje: `¿Dar a ${usuario.nombreCompleto} acceso a ${destino.nombre}?`,
              });
          }}
        >
          <label className="grid min-w-0 grow gap-1 text-sm font-semibold">
            Destino disponible
            <select name="destino" className={campo} required defaultValue="">
              <option value="" disabled>
                Selecciona un destino
              </option>
              {disponibles?.map(({ id, nombre }) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <button className={boton}>Asignar</button>
        </form>
      )}
    </section>
  );
}
