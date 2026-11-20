import { Suspense } from "react";
import {
  DashboardEncargado,
  EsqueletoDashboard,
  type ConsultaDashboard,
} from "@/features/administracion/dashboard-encargado";

export default function PaginaAdministracion({
  searchParams,
}: {
  searchParams: Promise<ConsultaDashboard>;
}) {
  return (
    <main className="w-full space-y-5 py-2">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#14382e] sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#526a60]">
          Una mirada a tu atractivo y a la experiencia de tus visitantes.
        </p>
      </header>
      <Suspense fallback={<EsqueletoDashboard />}>
        <DashboardEncargado consulta={searchParams} />
      </Suspense>
    </main>
  );
}
