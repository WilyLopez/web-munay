"use client";

import Link from "next/link";
import { useState } from "react";

type TabId = "cuenta" | "sistema" | "integraciones";

const tabs: { id: TabId; etiqueta: string }[] = [
  { id: "cuenta", etiqueta: "Mi cuenta" },
  { id: "sistema", etiqueta: "Sistema" },
  { id: "integraciones", etiqueta: "Integraciones" },
];

function TabCuenta() {
  return (
    <section
      aria-labelledby="seguridad-cuenta"
      className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
    >
      <h2 id="seguridad-cuenta" className="text-lg font-semibold">
        Seguridad de la cuenta
      </h2>
      <p className="text-sm leading-relaxed text-[#4d665b]">
        La sesión del panel vence después de 30 minutos de inactividad.
      </p>
      <p className="text-sm leading-relaxed text-[#4d665b]">
        Para restablecer tu contraseña, solicita un enlace al correo de tu
        cuenta.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/autenticacion/recuperar"
          className="inline-block rounded-lg bg-[#174238] px-3 py-2 text-sm font-semibold text-white hover:bg-[#23574a]"
        >
          Restablecer contraseña
        </Link>
        <Link
          href="/superadmin/perfil"
          className="inline-block rounded-lg border border-[#ccd9cf] px-3 py-2 text-sm font-semibold hover:bg-[#e6eee6]"
        >
          Ver mi perfil
        </Link>
      </div>
    </section>
  );
}

function TabSistema() {
  return (
    <div className="space-y-4">
      <section
        aria-labelledby="moderacion-sistema"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <h2 id="moderacion-sistema" className="text-lg font-semibold">
          Moderación automática
        </h2>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Las reseñas con un índice de riesgo igual o superior al umbral
          configurado se marcan para revisión manual antes de publicarse.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Umbral de riesgo activo
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[#173b32]">0.7</dd>
            <p className="mt-1 text-xs text-[#4d665b]">
              Reseñas con riesgo &ge; 0.7 requieren revisión
            </p>
          </div>
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Motor de análisis
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Perspectiva API (Google Cloud)
            </dd>
            <p className="mt-1 text-xs text-[#4d665b]">
              Toxicidad, lenguaje ofensivo y spam
            </p>
          </div>
        </dl>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          El umbral se configura en las variables de entorno del servidor.
          Contacta al equipo técnico para modificarlo.
        </p>
      </section>

      <section
        aria-labelledby="sesiones-sistema"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <h2 id="sesiones-sistema" className="text-lg font-semibold">
          Sesiones y seguridad
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Proveedor de autenticación
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Supabase Auth
            </dd>
          </div>
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Expiración de sesión
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              30 minutos de inactividad
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function TabIntegraciones() {
  return (
    <div className="space-y-4">
      <section
        aria-labelledby="blockchain-integracion"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h.01" />
              <path d="M17 7h.01" />
              <path d="M7 17h.01" />
              <path d="M17 17h.01" />
            </svg>
          </div>
          <h2 id="blockchain-integracion" className="text-lg font-semibold">
            Blockchain (Ethereum)
          </h2>
          <span className="ml-auto rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            Activo
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Las reseñas aprobadas se anclan en la red Ethereum para garantizar
          inmutabilidad y transparencia pública.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Red
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Ethereum Sepolia (testnet)
            </dd>
          </div>
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Proveedor RPC
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Configurado vía variable de entorno
            </dd>
          </div>
        </dl>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          La dirección del contrato y la clave privada se gestionan en las
          variables de entorno del servidor. No se exponen en esta interfaz por
          seguridad.
        </p>
        <Link
          href="/superadmin/blockchain"
          className="inline-block rounded-lg border border-[#ccd9cf] px-3 py-2 text-sm font-semibold hover:bg-[#e6eee6]"
        >
          Ver registros blockchain
        </Link>
      </section>

      <section
        aria-labelledby="mapas-integracion"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <h2 id="mapas-integracion" className="text-lg font-semibold">
            Google Maps Platform
          </h2>
          <span className="ml-auto rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            Activo
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Se utiliza para la selección de ubicación en destinos y atractivos, y
          para mostrar mapas interactivos en las fichas públicas.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              API Key
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Configurada vía variable de entorno
            </dd>
          </div>
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Funciones habilitadas
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Maps JS, Places, Geocoding
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="ia-integracion"
        className="space-y-4 rounded-2xl border border-[#dce3da] bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 8v4l3 3" />
              <path d="M18.5 2.5a2.5 2.5 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </div>
          <h2 id="ia-integracion" className="text-lg font-semibold">
            Perspectiva API (IA de moderación)
          </h2>
          <span className="ml-auto rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            Activo
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#4d665b]">
          Analiza automáticamente el contenido de las reseñas para detectar
          toxicidad, discurso de odio y spam usando modelos de Google Cloud.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Proveedor
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Google Cloud Perspective API
            </dd>
          </div>
          <div className="rounded-xl border border-[#dce3da] bg-[#f4f5ef] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#4d665b]">
              Atributos analizados
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#173b32]">
              Toxicidad, lenguaje ofensivo, spam
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function PaginaConfiguracion() {
  const [tabActiva, setTabActiva] = useState<TabId>("cuenta");

  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">Configuración</h1>

      <div
        role="tablist"
        aria-label="Secciones de configuración"
        className="flex gap-1 rounded-xl border border-[#dce3da] bg-white p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tabActiva === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setTabActiva(tab.id)}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors aria-[selected=true]:bg-[#174238] aria-[selected=true]:text-white aria-[selected=false]:text-[#4d665b] aria-[selected=false]:hover:bg-[#e6eee6]"
          >
            {tab.etiqueta}
          </button>
        ))}
      </div>

      <div
        id={`panel-${tabActiva}`}
        role="tabpanel"
        aria-labelledby={tabActiva}
      >
        {tabActiva === "cuenta" && <TabCuenta />}
        {tabActiva === "sistema" && <TabSistema />}
        {tabActiva === "integraciones" && <TabIntegraciones />}
      </div>
    </main>
  );
}
