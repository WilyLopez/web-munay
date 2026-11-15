import { Suspense } from "react";
import { redirect } from "next/navigation";
import { accesoPanel } from "@/features/administracion/acceso";

async function DatosPerfil() {
  const perfil = await accesoPanel();
  if (!perfil) return <p role="alert">No pudimos consultar tu cuenta.</p>;
  if (perfil.rol === "SUPER_ADMIN") redirect("/superadmin/perfil");

  return (
    <dl className="grid gap-4 rounded-2xl border border-[#dce3da] bg-white p-5 text-sm sm:grid-cols-2 sm:p-6">
      <div>
        <dt className="font-semibold">Nombre completo</dt>
        <dd className="mt-1 wrap-anywhere text-[#4d665b]">
          {perfil.nombreCompleto}
        </dd>
      </div>
      <div>
        <dt className="font-semibold">Rol</dt>
        <dd className="mt-1 text-[#4d665b]">Admin</dd>
      </div>
    </dl>
  );
}

export default function PaginaPerfil() {
  return (
    <main className="max-w-3xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Mi perfil</h1>
      <Suspense
        fallback={
          <div
            role="status"
            className="h-24 rounded-2xl border border-[#dce3da] bg-[#e0e9e0] motion-safe:animate-pulse"
          >
            <span className="sr-only">Cargando perfil</span>
          </div>
        }
      >
        <DatosPerfil />
      </Suspense>
    </main>
  );
}
