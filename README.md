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
