# Configuración para migrar a GCP

La arquitectura prevista es Firebase Hosting para el sitio estático y Cloud Run
para la API. Estos cambios no publican el proyecto automáticamente.

## API en Cloud Run

### 1. Preparar Cloud Shell (sin tocar el sitio actual)

Abre Cloud Shell en tu proyecto de Google Cloud con facturación habilitada.
Clona o sube **el repositorio completo**, entra en su raíz y comprueba que
existan `Dockerfile`, `pnpm-lock.yaml`, `lib/` y `artifacts/api-server/`.
No ejecutes estos pasos dentro de la carpeta de la API.

Los comandos de esta sección crean recursos y pueden generar cargos. No se
ejecutan automáticamente desde Replit. No ejecutan `firebase deploy`, no
cambian DNS ni el sitio publicado. El servicio dedicado se llama
`prefabricados-api`; comprueba que ese nombre no corresponda a otro servicio
que quieras conservar. Repetir el despliegue actualiza solo ese servicio.

```bash
export PROJECT_ID="TU-ID-DE-PROYECTO"
export REGION="us-central1"
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com iam.googleapis.com
```

Usa una región compatible con la futura reescritura de Firebase Hosting.
La persona que ejecuta los comandos necesita permisos para habilitar APIs,
crear cuentas de servicio y secretos, y administrar sus políticas IAM durante
la preparación. Para desplegar desde código fuente necesita
`roles/run.sourceDeveloper`, `roles/serviceusage.serviceUsageConsumer` y
`roles/iam.serviceAccountUser` sobre **las dos** cuentas siguientes.
Para hacer pública la API también necesita `run.services.setIamPolicy`
(por ejemplo, `roles/run.admin` durante esta preparación).
Si una política de la organización prohíbe acceso público, no la cambies:
consulta al administrador antes de continuar.

### 2. Cuentas separadas para compilación y ejecución

Ejecuta la creación solo una vez. Si las cuentas ya existen, omite esos dos
comandos; no descargues claves JSON de cuentas de servicio.

```bash
gcloud iam service-accounts create prefabricados-api \
  --display-name="API de cotizaciones"
gcloud iam service-accounts create prefabricados-build \
  --display-name="Compilacion API de cotizaciones"

export RUNTIME_SA="prefabricados-api@${PROJECT_ID}.iam.gserviceaccount.com"
export BUILD_SA="prefabricados-build@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${BUILD_SA}" --role="roles/run.builder"
```

La cuenta de ejecución no necesita permisos generales sobre el proyecto;
solo recibirá acceso a los dos secretos individuales. La cuenta de
compilación no recibe acceso a esos secretos.

### 3. Secret Manager (sin claves en archivos ni historial)

Necesitas una clave de SendGrid con permiso **Mail Send** y la clave secreta
de hCaptcha correspondiente al sitio. La conexión SendGrid de Replit no se
transfiere a GCP. Introduce las claves únicamente en los prompts ocultos de
Cloud Shell de abajo, nunca en el chat, argumentos de comandos, archivos
`.env`, Git o el frontend. No actives `set -x`.

Si los secretos ya existen, omite los comandos `secrets create`. Agregar una
versión nueva no elimina las anteriores.

```bash
gcloud secrets create prefabricados-sendgrid --replication-policy=automatic
gcloud secrets create prefabricados-hcaptcha --replication-policy=automatic

# Bloque aislado: incluso ante un error las variables desaparecen al salir.
(
  set -euo pipefail
  set +x
  IFS= read -r -s -p "Clave de SendGrid (oculta): " SENDGRID_VALUE
  printf '\n'
  test -n "$SENDGRID_VALUE"
  printf '%s' "$SENDGRID_VALUE" | gcloud secrets versions add \
    prefabricados-sendgrid --data-file=-
  unset SENDGRID_VALUE
  IFS= read -r -s -p "Clave secreta de hCaptcha (oculta): " HCAPTCHA_VALUE
  printf '\n'
  test -n "$HCAPTCHA_VALUE"
  printf '%s' "$HCAPTCHA_VALUE" | gcloud secrets versions add \
    prefabricados-hcaptcha --data-file=-
  unset HCAPTCHA_VALUE
)

for secret in prefabricados-sendgrid prefabricados-hcaptcha; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done

# Fijar versiones numéricas evita cambios silenciosos entre instancias.
export SENDGRID_SECRET_VERSION="$(gcloud secrets versions describe latest \
  --secret=prefabricados-sendgrid --format='value(name)' | awk -F/ '{print $NF}')"
export HCAPTCHA_SECRET_VERSION="$(gcloud secrets versions describe latest \
  --secret=prefabricados-hcaptcha --format='value(name)' | awk -F/ '{print $NF}')"
```

Para rotar una clave, agrega una versión, vuelve a obtener los números y
despliega una revisión nueva. No deshabilites versiones que utilice una
revisión a la que todavía quieras poder regresar.

### 4. Variables de correo y despliegue desde la raíz

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

En Cloud Shell define los valores reales **no secretos**:

```bash
export QUOTE_RECIPIENT_EMAIL="ventas@tu-dominio.mx"
export QUOTE_SENDER_EMAIL="cotizaciones@tu-dominio.mx"
export CORS_ALLOWED_ORIGINS="https://TU-SITIO.web.app,https://TU-SITIO.firebaseapp.com"
bash scripts/deploy-api-cloud-run.sh
```

El remitente debe estar verificado en SendGrid. Ajusta los orígenes al sitio
real y agrega su dominio a hCaptcha. No uses `*` ni barras finales. El script
exige los valores, selecciona `EMAIL_PROVIDER=sendgrid` y conecta las
versiones de Secret Manager; nunca lee sus valores. `--set-env-vars` y
`--set-secrets` reemplazan la configuración de este servicio dedicado:
no lo reutilices para un servicio con otras variables que quieras conservar.

`gcloud run deploy --source=.` envía la raíz y usa el `Dockerfile` para
compilar en Cloud Build; no requiere Docker ni Node en Cloud Shell. La
imagen usa Node 24 y pnpm 10.26.1, instala con el lockfile congelado y
compila únicamente la API, con sus paquetes compartidos de `lib/`.
No se compila el frontend. `.gcloudignore` y `.dockerignore` excluyen el
sitio, dependencias locales, configuración de Replit y archivos secretos.
No guardes credenciales bajo otros nombres dentro de `lib/` o la API.
Puedes revisar lo que se enviaría con `gcloud meta list-files-for-upload`.

El paso final copia **todo** `dist/`, incluidos los workers de Pino, a una
imagen sin dependencias de compilación y ejecuta Node como usuario no root.
`build.mjs` ya agrupa Express, SendGrid/Replit SDK y las bibliotecas de
validación; no necesita cambios ni `pnpm start` en producción. Si en el
futuro se importa una dependencia externa de la lista `external` del
compilador, deberá instalarse también en la imagen final.
El servidor escucha en `0.0.0.0:$PORT` y atiende SIGTERM para terminar
solicitudes en curso. Estas rutas de cotización y salud no usan PostgreSQL:
no se requiere `DATABASE_URL`, `SESSION_SECRET` ni credenciales de Replit.

El servicio es público porque recibe formularios de visitantes; hCaptcha
continúa validándose en el servidor. El límite inicial es de tres instancias,
512 MiB y veinte solicitudes simultáneas por instancia; ajústalo según uso
y presupuesto.

### 5. Verificar después del despliegue

El script obtiene la URL real de Cloud Run y verifica automáticamente que
`GET /api/healthz` responda HTTP 200 con `{"status":"ok"}`. Para repetirlo:

```bash
API_URL="$(gcloud run services describe prefabricados-api \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
bash scripts/check-api-health.sh "$API_URL"
```

Comparte esa URL después de desplegar si quieres que también comprobemos
el endpoint desde fuera de Cloud Shell. No podemos verificar una URL de
Cloud Run hasta que exista un despliegue.

La salud solo confirma que la API arrancó: **no prueba** SendGrid, hCaptcha
ni entrega de correo. La conexión del formulario de Firebase y la prueba de
una cotización real corresponden al siguiente paso; no retires el sitio
actual hasta que el correo haya llegado.

Si la compilación falla, revisa el enlace a Cloud Build que imprime `gcloud`.
Si la revisión no arranca o devuelve 503, consulta:

```bash
gcloud run services logs read prefabricados-api \
  --project="$PROJECT_ID" --region="$REGION" --limit=50
```

Revisa errores de permisos de la cuenta de compilación, acceso de la cuenta
de ejecución a los secretos y versiones habilitadas. Si salud devuelve 404,
usa `/api/healthz`, no `/healthz`; un 403 puede indicar que la política del
proyecto impide la invocación pública. No imprimas ni compartas secretos
durante el diagnóstico.

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
