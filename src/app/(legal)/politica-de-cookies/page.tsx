import Link from "next/link";
export const metadata = { title: "Política de cookies · Munay" };

export default function PaginaCookies() {
  return (
    <>
      <h1>Política de cookies</h1>
      <p>
        Estas son las cookies que utiliza Munay durante el piloto y las opciones
        para gestionarlas.
      </p>
      <section>
        <h2>Cookies de autenticación</h2>
        <p>
          La cookie propia <code>munay-auth</code> permite mantener y renovar la
          sesión. Puede dividirse en fragmentos como <code>munay-auth.0</code>.
          Se configura con <code>HttpOnly</code>, <code>SameSite=Lax</code> y{" "}
          <code>Secure</code> en producción.
        </p>
        <p>
          La librería configura una duración máxima de 400 días por escritura.
          El acceso a Munay vence tras 30 minutos de inactividad. La aplicación
          elimina sus cookies de autenticación al cerrar sesión.
        </p>
      </section>
      <section>
        <h2>Mapas y servicios externos</h2>
        <p>
          Pines carga imágenes del mapa de OpenStreetMap. Google Maps, cuando
          está configurado y seleccionas esa vista, carga servicios de Google
          que pueden usar sus propias tecnologías. Munay utiliza cookies propias
          de autenticación en esta versión.
        </p>
        <p>
          <a href="https://policies.google.com/privacy?hl=es">
            Política de privacidad de Google
          </a>
        </p>
      </section>
      <section>
        <h2>Cómo gestionar las cookies</h2>
        <p>
          Puedes bloquear o eliminar cookies desde los ajustes del navegador. Si
          eliminas las cookies de sesión, deberás volver a iniciar sesión para
          guardar favoritos o publicar reseñas. El catálogo y las reseñas
          públicas se pueden consultar como visitante.
        </p>
        <p>
          Consulta la{" "}
          <Link href="/politica-de-privacidad">Política de privacidad</Link>{" "}
          para conocer cómo usamos los datos de tu cuenta.
        </p>
      </section>
    </>
  );
}
