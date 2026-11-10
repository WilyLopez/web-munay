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

## Supabase Auth

Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con el mismo proyecto que usa la API. Las pantallas de acceso están en `/registro` y `/ingresar`. Los enlaces del registro abren `/terminos-de-uso` y `/politica-de-privacidad`.

En **Authentication → URL Configuration**, configura **Site URL** como `http://localhost:3000` para este proyecto de desarrollo. En **Authentication → Email Templates → Confirm signup**, usa este enlace para abrir la pantalla que consume el token cuando el usuario confirma.

```html
<a href="{{ .SiteURL }}/autenticacion/confirmar?token_hash={{ .TokenHash }}">Confirmar correo</a>
```

Mantén habilitada la confirmación de correo. Para probar con el servicio de correo incluido usa una dirección autorizada del equipo de Supabase. Para usuarios externos, configura SMTP propio.
