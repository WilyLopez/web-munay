# Munay Web

Aplicación web de Munay con Next.js, App Router, TypeScript y Tailwind CSS.

## Desarrollo local

```sh
npm ci
npm run dev
```

Abre [Munay Web en el puerto 3000](http://localhost:3000). La página inicial está en `src/app/page.tsx`.

Si aún no tienes un archivo `.env`, crea uno a partir de `.env.example`. `NEXT_PUBLIC_API_URL` indica la URL base de la API para las futuras llamadas del frontend. Su valor es público y debe contener solo la URL.

Usa `npm run lint` para revisar el código y `npm run build` para generar la compilación de producción.

Los comandos de desarrollo y compilación usan Webpack para procesar Tailwind con PostCSS.

## Despliegue en Vercel

Importa el repositorio como Next.js con Node.js 24.x. Configura `NEXT_PUBLIC_API_URL` con el dominio HTTPS de la API desplegada y las dos variables públicas del proyecto Supabase correspondiente. Mantén `MUNAY_DEMO_ESCANEO=false` en producción. Configura la **Site URL** de Supabase con el dominio definitivo del frontend para los correos de acceso.

## Supabase Auth

Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con el mismo proyecto que usa la API. Las pantallas de acceso están en `/registro` y `/ingresar`. Los enlaces del registro abren `/terminos-de-uso` y `/politica-de-privacidad`.

En **Authentication → URL Configuration**, configura **Site URL** como `http://localhost:3000` para este proyecto de desarrollo. En **Authentication → Email Templates → Confirm signup**, usa este enlace para abrir la pantalla que consume el token cuando el usuario confirma.

```html
<a href="{{ .SiteURL }}/autenticacion/confirmar?token_hash={{ .TokenHash }}">Confirmar correo</a>
```

Mantén habilitada la confirmación de correo. Para probar con el servicio de correo incluido usa una dirección autorizada del equipo de Supabase. Para usuarios externos, configura SMTP propio.

### Resend como SMTP de Supabase Auth

1. Agrega un dominio en Resend, publica los registros DNS que indique y espera a que aparezca como verificado. Crea una clave con permiso de envío para ese dominio.
2. En Supabase, abre **Authentication → Email → SMTP Settings** y habilita el SMTP personalizado. Usa el host `smtp.resend.com`, el puerto `465`, el usuario `resend` y la clave de Resend como contraseña. Guarda la clave únicamente en la configuración de Supabase. Usa **Munay** como nombre del remitente y una dirección de tu dominio verificado como correo del remitente.
3. En **Authentication → URL Configuration**, configura **Site URL** con el origen del frontend, sin barra final. Usa `http://localhost:3000` para pruebas en esta computadora o la URL HTTPS de Munay para los demás usuarios.
4. Mantén **Confirm email** habilitado. En **Authentication → Email → Templates → Confirm signup**, usa el asunto **Confirma tu correo en Munay** y pega el contenido de [confirmar-registro.html](supabase/plantillas/confirmar-registro.html). Mantén desactivado el seguimiento de clics en Resend para conservar el enlace original.
5. Registra un correo de prueba nuevo en `/registro`. Revisa la entrega en Resend, abre el enlace y presiona **Confirmar correo** dentro de Munay. En **Authentication → Users**, verifica la confirmación e inicia sesión. También puedes probar `/autenticacion/reenviar` con una cuenta pendiente, respetando los límites de envío.

[Integración SMTP de Resend](https://resend.com/docs/send-with-supabase-smtp) · [Configuración SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

### Recuperación de contraseña

En **Authentication → Emails → Reset password**, guarda el asunto **Restablece tu contraseña en Munay** y pega el contenido de [restablecer-contrasena.html](supabase/plantillas/restablecer-contrasena.html). La URL de la plantilla usa la **Site URL** del frontend sin barra final. El botón abre el formulario de Munay, que valida el enlace temporal al guardar la nueva contraseña.

## Vista de Google Maps

Configura `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env` con una clave de navegador autorizada para Maps JavaScript API y para el origen de Munay. Google Cloud requiere habilitar la API y configurar facturación. Opcionalmente, configura `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` con el identificador del mapa. Reinicia el servidor de desarrollo o vuelve a compilar si usas el servidor de producción.
