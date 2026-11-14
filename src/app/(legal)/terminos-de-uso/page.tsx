import Link from "next/link";
export const metadata = { title: "Términos de uso · Munay" };

export default function PaginaTerminos() {
  return (
    <>
      <h1>Términos de uso</h1>
      <p>
        Estos términos se aplican al piloto académico de Munay, una plataforma
        para explorar destinos turísticos de Lambayeque.
      </p>
      <section>
        <h2>Consulta de destinos</h2>
        <p>
          El catálogo, el mapa y las reseñas son públicos. Los horarios, tarifas
          y rutas son referenciales. Confirma las condiciones de acceso con el
          encargado del destino antes de viajar.
        </p>
      </section>
      <section>
        <h2>Cuenta y uso permitido</h2>
        <p>
          Registra un correo al que tengas acceso, confirma la dirección y
          mantén tu contraseña en privado. Usa únicamente tu propia cuenta. Se
          prohíbe suplantar identidades, compartir códigos de visita o acceder a
          funciones sin autorización.
        </p>
      </section>
      <section>
        <h2>Visitas y reseñas</h2>
        <p>
          El QR vincula el registro de una visita con tu cuenta y el destino.
          Cada visita verificada admite una reseña. Al publicar, tu nombre,
          comentario, calificación y fecha serán visibles en la sección de
          opiniones.
        </p>
        <p>
          Describe tu experiencia con respeto y evita divulgar datos de otras
          personas. La verificación respalda el registro de la visita. La
          opinión pertenece a quien la escribe.
        </p>
      </section>
      <section>
        <h2>Privacidad y materiales</h2>
        <p>
          Consulta la{" "}
          <Link href="/politica-de-privacidad">Política de privacidad</Link> y
          la <Link href="/politica-de-cookies">Política de cookies</Link>. Los
          créditos de las fotografías aparecen junto a las imágenes cuando
          corresponde.
        </p>
      </section>
    </>
  );
}
