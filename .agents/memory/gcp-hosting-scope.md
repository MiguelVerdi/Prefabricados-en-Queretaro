---
name: Alojamiento en GCP
description: Alcance de alojamiento solicitado y corrección explícita sobre Firebase.
---

El usuario pidió alojar la aplicación en GCP y rechazó expresamente Firebase Hosting. La dirección acordada es servir el frontend y la API juntos en un servicio de Cloud Run, con Cloud Build, Artifact Registry y Secret Manager.

**Why:** Una guía anterior propuso Firebase Hosting; el usuario corrigió que quería todo en GCP, sin Firebase. No tratar Firebase como equivalente aceptable aunque pertenezca a Google.

**How to apply:** Las guías y futuras implementaciones deben usar Cloud Run para ambas partes. Aclarar si los archivos actuales solo despliegan la API y distinguir cambios sugeridos, cambios realizados y recursos realmente desplegados. SendGrid, hCaptcha y las fotos de Drive son dependencias externas existentes; no afirmar que se migraron a GCP sin hacerlo.

Para conectar prefabricadosqro.com, el usuario eligió un balanceador de aplicaciones de GCP, después de conocer que tiene cargos recurrentes incluso con poco tráfico.

**Why:** Prefirió la opción recomendada para producción frente al mapeo directo de dominios de Cloud Run en vista previa.

**How to apply:** Guiar la conexión del dominio mediante el balanceador y HTTPS administrado por Google, con Cloudflare como DNS. Esta elección no confirma que los recursos ya se hayan creado.
