import Link from "next/link";
export const metadata = { title: "Política de privacidad · Munay" };

export default function PaginaPrivacidad() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p>
        Esta política describe cómo se usan los datos durante el piloto
        académico de Munay.
      </p>
      <section>
        <h2>Cuenta y actividad</h2>
        <p>
          El registro solicita nombre, correo y contraseña. Supabase Auth
          gestiona las credenciales, la confirmación del correo y los tokens.
          Munay utiliza el identificador de cuenta, el nombre, el rol y la
          actividad de sesión para gestionar el perfil y los permisos.
        </p>
        <p>
          Los favoritos, las visitas verificadas y los votos de utilidad se
          asocian a tu cuenta. Al publicar una reseña, tu nombre, comentario,
          calificación, fecha de publicación y fecha de visita verificada se
          muestran públicamente. Las respuestas que publiques también muestran
          tu nombre y la fecha de envío. Los encargados
          consultan información de los destinos que tienen asignados.
        </p>
      </section>
      <section>
        <h2>Fotos de las reseñas</h2>
        <p>
          Adjuntar una foto es opcional. Antes de subirla solicitamos tu
          autorización para publicarla con la reseña. La foto se almacena en
          Supabase Storage y puede verla cualquier visitante del sitio.
          Adjunta únicamente fotos propias y con permiso de las personas que
          aparezcan en ellas.
        </p>
        <p>
          Si declaras que apareces en una selfie tomada durante la visita,
          Munay puede acreditar puntos adicionales sujetos a revisión.
          Esta declaración no utiliza reconocimiento facial.
        </p>
      </section>
      <section>
        <h2>Cámara y ubicación</h2>
        <p>
          Si autorizas la cámara, el navegador lee el QR en el dispositivo y
          envía el código a Munay para validarlo. Al pulsar «Mi posición», el
          mapa usa tu ubicación autorizada para mostrar la posición y calcular
          una distancia aproximada. Puedes cambiar ambos permisos en el
          navegador.
        </p>
      </section>
      <section>
        <h2>Proveedores y cookies</h2>
        <p>
          Supabase proporciona autenticación y almacenamiento. Si el SMTP
          personalizado está habilitado, Resend entrega los correos de
          autenticación. Al cargar el mapa, el navegador se conecta al proveedor
          de la vista elegida. Consulta la{" "}
          <Link href="/politica-de-cookies">Política de cookies</Link>.
        </p>
      </section>
      <section>
        <h2>Derechos sobre tus datos</h2>
        <p>
          La Ley N.º 29733 y su reglamento contemplan derechos de acceso,
          rectificación, cancelación y oposición. Para la publicación del
          servicio quedan por confirmar el responsable y su domicilio, el canal
          para ejercer derechos, los plazos de conservación y las transferencias
          aplicables.
        </p>
        <p>
          <a href="https://www.gob.pe/institucion/anpd/normas-legales/6554453-n-016-2024-jus">
            Reglamento peruano de protección de datos personales
          </a>
        </p>
      </section>
    </>
  );
}
