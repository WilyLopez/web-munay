import type { Metadata } from "next";
import { DocumentoLegal } from "@/features/autenticacion/documento-legal";

export const metadata: Metadata = {
  title: "Términos de uso · Munay",
  robots: { index: false, follow: false },
};

export default function PaginaTerminos() {
  return (
    <DocumentoLegal titulo="Términos de uso">
      <h2>Servicio</h2>
      <p>
        Munay es un proyecto de turismo digital para consultar información sobre
        destinos de Lambayeque. Esta versión está en desarrollo y su registro
        está destinado a las pruebas del equipo.
      </p>
      <h2>Cuenta y acceso</h2>
      <p>
        Registra un correo al que tengas acceso y confirma la dirección para
        usar tu cuenta. Mantén tu contraseña en privado y usa la plataforma
        desde una cuenta propia.
      </p>
      <h2>Uso de la plataforma</h2>
      <p>
        Usa Munay de forma lícita y respeta las cuentas y los datos de otras
        personas. Evita suplantar identidades, interferir con el servicio o
        intentar obtener permisos que no te corresponden.
      </p>
      <h2>Información turística</h2>
      <p>
        Los horarios, tarifas y condiciones de acceso pueden variar. Antes de
        viajar, confirma la información directamente con el lugar turístico.
      </p>
      <h2>Responsable y contacto</h2>
      <p>
        Pendiente de completar antes del lanzamiento. Falta confirmar el nombre
        del responsable del servicio, el canal de contacto y la fecha de
        vigencia.
      </p>
    </DocumentoLegal>
  );
}
