# Configuración para migrar a GCP

La arquitectura prevista es Firebase Hosting para el sitio estático y Cloud Run
para la API. Estos cambios no publican el proyecto automáticamente.

## API en Cloud Run

Configura las siguientes variables en el servicio:

| Variable | Valor o uso |
| --- | --- |
| `NODE_ENV` | `production` |
| `EMAIL_PROVIDER` | `sendgrid` |
| `QUOTE_RECIPIENT_EMAIL` | Correo que recibirá las cotizaciones |
| `QUOTE_SENDER_EMAIL` | Remitente verificado en SendGrid |
| `CORS_ALLOWED_ORIGINS` | Orígenes completos del sitio, separados por comas, sin barra final |

Conecta estos secretos de Secret Manager como variables de entorno:

- `SENDGRID_API_KEY`: clave de SendGrid con permiso para enviar correo.
- `HCAPTCHA_SECRET_KEY`: clave secreta de hCaptcha.

No escribas estas claves en archivos del repositorio ni en el frontend.
Cloud Run proporciona `PORT`; no hace falta fijarlo manualmente.

El modo `sendgrid` llama directamente a la API de SendGrid y no necesita la
conexión administrada por Replit. Si falta la clave, el formulario devuelve un
error de configuración y no informa que el correo fue enviado.

En Replit se conserva el proveedor existente. `EMAIL_PROVIDER=replit` lo
selecciona explícitamente. Sin esa variable se usa Replit cuando existe
`REPL_ID`, y SendGrid directo fuera de Replit.

La lista CORS se aplica cuando está configurada. Si se deja vacía se conserva
el acceso CORS abierto del entorno actual. Configúrala antes de publicar la API
en GCP; CORS no sustituye la verificación hCaptcha.

## Sitio en Firebase Hosting

Antes de compilar, configura `VITE_HCAPTCHA_SITE_KEY` en el entorno de
compilación. Es una clave pública; no debe confundirse con la clave secreta.
Agrega el dominio definitivo del sitio a los dominios autorizados de hCaptcha.

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/prefabricados-queretaro run build
```

Los archivos estáticos se generan en
`artifacts/prefabricados-queretaro/dist/public`.
Para alojamiento en la raíz del dominio no se requieren `PORT` ni `BASE_PATH`.
Las herramientas de desarrollo de Replit no se activan en la compilación de
producción.

El navegador conserva las llamadas relativas a `/api/quotes`. Al configurar
Firebase Hosting, agrega primero una reescritura de `/api/**` al servicio de
Cloud Run y después la reescritura de la aplicación a `/index.html`. La API
espera conservar el prefijo `/api`.

## Comprobación antes de cambiar el dominio

1. Configurar el despliegue de Cloud Run desde la raíz del monorepo, incluyendo
   sus bibliotecas compartidas; no subir únicamente la carpeta de la API.
2. Publicar los archivos estáticos y la reescritura de Firebase Hosting.
3. Verificar `/api/healthz` y enviar una cotización real con hCaptcha desde el
   nuevo sitio.
4. Confirmar que el correo llega antes de retirar el alojamiento anterior.
