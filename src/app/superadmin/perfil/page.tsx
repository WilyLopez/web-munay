import { FichaUsuario } from "@/features/usuarios/detalle";

export default function PaginaPerfil() {
  return (
    <main className="max-w-3xl space-y-5">
      <h1 className="font-serif text-4xl tracking-tight">Mi perfil</h1>
      <section
        aria-label="Datos de mi cuenta"
        className="rounded-2xl border border-[#dce3da] bg-white"
      >
        <FichaUsuario soloPerfil />
      </section>
    </main>
  );
}
