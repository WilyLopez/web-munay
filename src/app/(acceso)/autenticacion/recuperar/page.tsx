import { SolicitudRecuperacion } from "@/features/autenticacion/formulario-recuperacion";

export default function PaginaRecuperar() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f8f4ea] p-5 sm:p-8">
      <section className="w-full max-w-lg space-y-5 rounded-3xl border border-stone-200 bg-white p-6 sm:p-9">
        <SolicitudRecuperacion />
      </section>
    </main>
  );
}
