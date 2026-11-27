"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type ItemNavegacion = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  href: string;
  palabrasClave: string[];
};

export function BuscadorGlobal({ global }: { global: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const campoEntrada = useRef<HTMLInputElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const listaId = useId();

  const items: ItemNavegacion[] = useMemo(() => {
    if (global) {
      return [
        {
          id: "dashboard",
          titulo: "Dashboard general",
          categoria: "SuperAdmin",
          descripcion: "Métricas KPI, actividad reciente y estado de servicios",
          href: "/superadmin",
          palabrasClave: ["inicio", "resumen", "kpi", "metricas", "estadisticas"],
        },
        {
          id: "usuarios",
          titulo: "Gestión de usuarios",
          categoria: "SuperAdmin",
          descripcion: "Administrar cuentas, roles y permisos",
          href: "/superadmin/usuarios",
          palabrasClave: ["cuentas", "roles", "turistas", "administradores"],
        },
        {
          id: "accesos",
          titulo: "Accesos de encargados",
          categoria: "SuperAdmin",
          descripcion: "Revisar solicitudes e invitar nuevos encargados",
          href: "/superadmin/accesos",
          palabrasClave: ["invitaciones", "solicitudes", "permisos"],
        },
        {
          id: "destinos",
          titulo: "Revisión de destinos",
          categoria: "SuperAdmin",
          descripcion: "Aprobar, revisar o archivar fichas de atractivos",
          href: "/superadmin/destinos",
          palabrasClave: ["atractivos", "lugares", "fichas", "editorial", "publicar"],
        },
        {
          id: "reportes",
          titulo: "Moderación de reseñas",
          categoria: "SuperAdmin",
          descripcion: "Auditar reportes y alertas de Perspective API",
          href: "/superadmin/reportes",
          palabrasClave: ["comentarios", "toxicidad", "riesgo", "ia", "quejas"],
        },
        {
          id: "beneficios",
          titulo: "Beneficios y canjes",
          categoria: "SuperAdmin",
          descripcion: "Monitoreo global de promociones turísticas",
          href: "/superadmin/beneficios",
          palabrasClave: ["promociones", "descuentos", "premios"],
        },
        {
          id: "blockchain",
          titulo: "Registros blockchain",
          categoria: "SuperAdmin",
          descripcion: "Trazabilidad de anclajes inmutables en Ethereum",
          href: "/superadmin/blockchain",
          palabrasClave: ["sepolia", "ethereum", "hashes", "transacciones"],
        },
        {
          id: "estadisticas",
          titulo: "Estadísticas de visitas",
          categoria: "Operaciones",
          descripcion: "Flujos de visitantes y calificaciones globales",
          href: "/administracion/estadisticas",
          palabrasClave: ["graficos", "visitas", "datos"],
        },
        {
          id: "configuracion",
          titulo: "Configuración del sistema",
          categoria: "Sistema",
          descripcion: "Parámetros del sistema, integraciones y seguridad",
          href: "/superadmin/configuracion",
          palabrasClave: ["ajustes", "sistema", "integraciones", "tokens"],
        },
        {
          id: "perfil",
          titulo: "Mi perfil",
          categoria: "Cuenta",
          descripcion: "Datos de la cuenta de superadministrador",
          href: "/superadmin/perfil",
          palabrasClave: ["cuenta", "clave", "seguridad"],
        },
      ];
    }

    return [
      {
        id: "dashboard-encargado",
        titulo: "Dashboard del encargado",
        categoria: "Panel",
        descripcion: "Resumen de actividad y estado de tu atractivo",
        href: "/administracion",
        palabrasClave: ["inicio", "resumen"],
      },
      {
        id: "mi-atractivo",
        titulo: "Mi atractivo turístico",
        categoria: "Contenido",
        descripcion: "Editar información, descripción, galería y ubicación",
        href: "/administracion/atractivos",
        palabrasClave: ["editar", "fotos", "galeria", "ficha", "horarios"],
      },
      {
        id: "visitas-qr",
        titulo: "QR de visitas",
        categoria: "Operación",
        descripcion: "Generador de QR, afiche imprimible y control en vivo",
        href: "/administracion/visitas",
        palabrasClave: ["codigo", "escaner", "afiche", "imprimir", "visitas"],
      },
      {
        id: "estadisticas-encargado",
        titulo: "Estadísticas de visitantes",
        categoria: "Métricas",
        descripcion: "Cantidad de visitas verificadas y tendencias",
        href: "/administracion/estadisticas",
        palabrasClave: ["reportes", "graficos", "turistas"],
      },
      {
        id: "resenas-encargado",
        titulo: "Reseñas del atractivo",
        categoria: "Interacción",
        descripcion: "Comentarios y calificaciones de los visitantes",
        href: "/administracion/resenas",
        palabrasClave: ["opiniones", "estrellas", "comentarios"],
      },
      {
        id: "beneficios-encargado",
        titulo: "Beneficios y convenios",
        categoria: "Promoción",
        descripcion: "Gestionar ofertas para turistas verificados",
        href: "/administracion/beneficios",
        palabrasClave: ["descuentos", "canjes", "promociones"],
      },
      {
        id: "perfil-encargado",
        titulo: "Mi perfil",
        categoria: "Cuenta",
        descripcion: "Información personal y acceso",
        href: "/administracion/perfil",
        palabrasClave: ["cuenta", "clave"],
      },
    ];
  }, [global]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return items;
    return items.filter(
      (item) =>
        item.titulo.toLowerCase().includes(termino) ||
        item.descripcion.toLowerCase().includes(termino) ||
        item.categoria.toLowerCase().includes(termino) ||
        item.palabrasClave.some((p) => p.includes(termino)),
    );
  }, [items, busqueda]);

  const indiceEfectivo = Math.min(
    indiceSeleccionado,
    Math.max(0, filtrados.length - 1),
  );

  useEffect(() => {
    function manejarAtajo(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((prev) => !prev);
      }
    }
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, []);

  useEffect(() => {
    if (abierto) {
      dialogo.current?.showModal();
      campoEntrada.current?.focus();
    } else {
      dialogo.current?.close();
    }
  }, [abierto]);

  const cerrarModal = () => {
    setAbierto(false);
    setBusqueda("");
    setIndiceSeleccionado(0);
  };

  const navegar = (href: string) => {
    cerrarModal();
    router.push(href);
  };

  const manejarTeclado = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSeleccionado((prev) =>
        prev < filtrados.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSeleccionado((prev) =>
        prev > 0 ? prev - 1 : filtrados.length - 1,
      );
    } else if (e.key === "Enter" && filtrados[indiceEfectivo]) {
      e.preventDefault();
      navegar(filtrados[indiceEfectivo].href);
    } else if (e.key === "Escape") {
      cerrarModal();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Buscar en el panel (Ctrl+K)"
        className="flex items-center gap-2 rounded-lg border border-[#ccd9cf] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4d665b] transition-colors hover:border-[#174238] hover:text-[#174238] focus-visible:outline-2 focus-visible:outline-[#174238]"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-3.5"
          aria-hidden="true"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="m13 13 4 4" />
        </svg>
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="rounded border border-[#ccd9cf] bg-[#f4f5ef] px-1 py-0.5 text-[10px] font-semibold text-[#173b32]">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogo}
        onCancel={cerrarModal}
        className="fixed inset-0 m-auto w-full max-w-xl rounded-2xl border border-[#dce3da] bg-white p-0 text-[#173b32] shadow-2xl backdrop:bg-black/50"
      >
        <div className="flex flex-col overflow-hidden rounded-2xl">
          <div className="flex items-center gap-3 border-b border-[#dce3da] px-4 py-3">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-5 shrink-0 text-[#4d665b]"
              aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              ref={campoEntrada}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setIndiceSeleccionado(0);
              }}
              onKeyDown={manejarTeclado}
              placeholder="Escribe para buscar secciones, módulos o acciones..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#8ba396]"
            />
            <button
              type="button"
              onClick={cerrarModal}
              className="rounded-md p-1 text-xs text-[#4d665b] hover:bg-[#edf3ec]"
            >
              Esc
            </button>
          </div>

          <ul
            id={listaId}
            role="listbox"
            className="max-h-80 overflow-y-auto p-2 divide-y divide-[#edf3ec]"
          >
            {filtrados.length > 0 ? (
              filtrados.map((item, idx) => {
                const seleccionado = idx === indiceEfectivo;
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={seleccionado}
                    onClick={() => navegar(item.href)}
                    onMouseEnter={() => setIndiceSeleccionado(idx)}
                    className={`flex cursor-pointer items-start justify-between rounded-xl p-3 transition-colors ${seleccionado ? "bg-[#e8f1eb]" : "hover:bg-[#f5f8f5]"}`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-[#173b32]">
                        {item.titulo}
                      </p>
                      <p className="text-xs text-[#4d665b]">
                        {item.descripcion}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#dbece0] px-2 py-0.5 text-[10px] font-bold text-[#11342c]">
                      {item.categoria}
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="p-8 text-center text-sm text-[#4d665b]">
                No encontramos resultados para &quot;{busqueda}&quot;
              </li>
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-[#dce3da] bg-[#fbfcf8] px-4 py-2 text-[11px] text-[#4d665b]">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded border bg-white px-1">↑</kbd>{" "}
                <kbd className="rounded border bg-white px-1">↓</kbd> Navegar
              </span>
              <span>
                <kbd className="rounded border bg-white px-1">Enter</kbd> Abrir
              </span>
            </div>
            <span>
              <kbd className="rounded border bg-white px-1">Esc</kbd> Cerrar
            </span>
          </div>
        </div>
      </dialog>
    </>
  );
}
