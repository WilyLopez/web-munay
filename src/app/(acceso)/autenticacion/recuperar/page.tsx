import { SolicitudRecuperacion } from "@/features/autenticacion/formulario-recuperacion";

export const metadata = { title: "Recuperar contraseña · Munay" };

export default function PaginaRecuperar() {
  return (
    <section className="entrada-acceso space-y-5">
      <SolicitudRecuperacion />
    </section>
  );
}
