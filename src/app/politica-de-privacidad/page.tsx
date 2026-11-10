import type { Metadata } from "next";
import { DocumentoLegal } from "@/features/autenticacion/documento-legal";

export const metadata: Metadata = {
  title: "Política de privacidad · Munay",
  robots: { index: false, follow: false },
};

export default function PaginaPrivacidad() {
  return (
    <DocumentoLegal titulo="Política de privacidad">
      <h2>Responsable del tratamiento</h2>
      <p>
        Pendiente de completar antes del lanzamiento. Falta identificar al
        responsable, su domicilio y el canal para consultas y solicitudes de
        privacidad.
      </p>
      <h2>Datos que usa el registro</h2>
      <p>
        El formulario solicita nombre, correo y contraseña para crear una
        cuenta. Supabase Auth gestiona las credenciales, la confirmación del
        correo y los tokens de acceso. Munay usa el identificador de la cuenta,
        el nombre y el estado de la sesión para gestionar el perfil y proteger
        el acceso.
      </p>
      <h2>Cookies de sesión</h2>
      <p>
        La aplicación utiliza cookies de sesión para mantener el acceso en el
        navegador y gestionar el inicio y el cierre de sesión.
      </p>
      <h2>Proveedores y conservación</h2>
      <p>
        Supabase presta los servicios de autenticación y alojamiento de la base
        de datos. Antes del lanzamiento se informarán los destinatarios, la
        ubicación del tratamiento, las transferencias aplicables y los plazos de
        conservación de los datos.
      </p>
      <h2>Derechos sobre tus datos</h2>
      <p>
        La versión final indicará cómo ejercer los derechos de información,
        acceso, rectificación, cancelación y oposición conforme a la normativa
        peruana aplicable.
      </p>
    </DocumentoLegal>
  );
}
