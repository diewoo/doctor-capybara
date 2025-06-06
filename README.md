# Doctor Capybara

## Configuración de Credenciales

1. Copia el archivo `key.example.json` a `key.json`:

```bash
cp key.example.json key.json
```

2. Reemplaza los valores en `key.json` con tus credenciales de Google Cloud.

3. Las credenciales reales se mantienen en `~/.gcloud/doctor-capybara-key.json` para desarrollo local.

## Configuración del Backend en Google Cloud Platform (GCP)

### 1. Configuración Inicial de GCP

1. Crear un nuevo proyecto en GCP:

   ```bash
   gcloud projects create [PROJECT_ID] --name="Doctor Capybara"
   ```

2. Habilitar las APIs necesarias:

   ```bash
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     containerregistry.googleapis.com
   ```

3. Crear una cuenta de servicio para CI/CD:

   ```bash
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Service Account"
   ```

4. Asignar roles necesarios a la cuenta de servicio:

   ```bash
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/cloudbuild.builds.builder"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

5. Crear y descargar la clave de la cuenta de servicio:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@[PROJECT_ID].iam.gserviceaccount.com
   ```

### 2. Configuración de GitHub Secrets

Agregar los siguientes secrets en tu repositorio de GitHub:

- `GCP_PROJECT_ID`: ID de tu proyecto en GCP
- `GCP_SA_KEY`: Contenido del archivo key.json generado en el paso anterior
- `GEMINI_API_KEY`: Tu API key de Gemini

### 3. Configuración del Backend

1. Estructura del proyecto:

   ```
   backend-ai/
   ├── Dockerfile
   ├── package.json
   └── src/
   ```

2. Configuración de Cloud Run:

   - Memoria: 1GB
   - CPU: 1
   - Timeout: 300s
   - Máximo de instancias: 10
   - CPU Boost habilitado
   - Entorno de ejecución: Gen2

3. Variables de entorno en Cloud Run:
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=[tu-api-key]`

### 4. CI/CD Pipeline

El pipeline está configurado en `.github/workflows/backend-deploy.yml` y se activa cuando:

- Se hace push a la rama main
- Se crea un pull request a la rama main
- Se modifican archivos en el directorio `backend-ai/`

### 5. Desarrollo Local

1. Configurar credenciales locales:

   ```bash
   cp key.example.json key.json
   # Editar key.json con tus credenciales
   ```

2. Iniciar el entorno de desarrollo:
   ```bash
   cd backend-ai
   npm install
   npm run dev
   ```

### 6. URLs y Endpoints

- Backend API: https://backend-ai-[PROJECT_ID].us-central1.run.app
- Documentación de la API: [URL de la documentación]

### 7. Monitoreo y Logs

1. Ver logs en tiempo real:

   ```bash
   gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=backend-ai"
   ```

2. Monitorear métricas en Google Cloud Console:
   - Ir a Cloud Run > backend-ai > Métricas

### 8. Troubleshooting

1. Si el despliegue falla:

   - Revisar los logs en GitHub Actions
   - Verificar que las credenciales sean correctas
   - Confirmar que las APIs estén habilitadas

2. Si la aplicación no responde:
   - Verificar los logs en Cloud Run
   - Comprobar que las variables de entorno estén configuradas
   - Revisar los límites de recursos

## Frontend

- Se despliega a Firebase Hosting
- Usa la configuración de Firebase en GitHub Secrets

## Configuración del Frontend

### 1. Configuración Inicial de Firebase

1. Autenticación y selección de proyecto en GCP:

   ```bash
   # Iniciar sesión en GCP
   gcloud auth login

   # Listar proyectos disponibles
   gcloud projects list

   # Seleccionar el proyecto
   gcloud config set project [PROJECT_ID]

   # Verificar la configuración actual
   gcloud config list
   ```

2. Obtener credenciales de Firebase:

   ```bash
   # Generar token de autenticación de Firebase
   firebase login:ci

   # Guardar el token generado como secret en GitHub:
   # FIREBASE_TOKEN=[token_generado]
   ```

3. Instalar Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

4. Iniciar sesión en Firebase:

   ```bash
   firebase login
   ```

5. Inicializar Firebase en el proyecto:
   ```bash
   cd frontend
   firebase init hosting
   ```
   - Seleccionar el proyecto de GCP
   - Directorio público: `dist`
   - Configurar como SPA: Yes
   - No sobrescribir index.html: No

### 2. Configuración de GCP para Frontend

1. Verificar la cuenta de servicio de GitHub Actions:

   ```bash
   # Verificar que la cuenta de servicio existe
   gcloud iam service-accounts list \
     --filter="email:github-actions@[PROJECT_ID].iam.gserviceaccount.com"

   # Si no existe, crearla (aunque ya debería estar creada del backend)
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Service Account"
   ```

2. Descargar la clave JSON de la cuenta de servicio:

   ```bash
   # Crear y descargar la clave JSON
   gcloud iam service-accounts keys create github-actions-key.json \
     --iam-account=github-actions@[PROJECT_ID].iam.gserviceaccount.com

   # El archivo se guardará como github-actions-key.json
   # Este archivo debe ser guardado como secret en GitHub:
   # GCP_SA_KEY=[contenido_del_archivo_json]
   ```

3. Habilitar las APIs necesarias para el frontend:

   ```bash
   gcloud services enable \
     firebase.googleapis.com \
     firebasehosting.googleapis.com \
     cloudresourcemanager.googleapis.com \
     iam.googleapis.com
   ```

4. Configurar el proyecto de Firebase en GCP:

   ```bash
   firebase projects:addfirebase [PROJECT_ID]
   ```

5. Configurar el hosting de Firebase:

   ```bash
   firebase target:apply hosting default [PROJECT_ID]
   ```
   ```bash
    firebase hosting:sites:create doctor-capybara --project=doctor-capybara
   ```
6. Asignar roles necesarios para el despliegue:

   ```bash
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/firebasehosting.admin"
   ```

### 3. Configuración del Proyecto Frontend

1. Estructura del proyecto:

   ```
   frontend/
   ├── src/
   ├── public/
   ├── vite.config.js
   ├── package.json
   └── .env
   ```

2. Configurar variables de entorno:
   Crear archivo `.env` en el directorio frontend:

   ```
   VITE_API_URL=https://backend-ai-[PROJECT_ID].us-central1.run.app
   ```

3. Para desarrollo local, crear `.env.development`:
   ```
   VITE_API_URL=http://localhost:8080
   ```

### 4. Configuración de GitHub Secrets para Frontend

Agregar los siguientes secrets en tu repositorio de GitHub:

- `FIREBASE_SERVICE_ACCOUNT`: Contenido del archivo de credenciales de Firebase
- `GCP_PROJECT_ID`: ID de tu proyecto en GCP (el mismo que usamos para el backend)

### 5. CI/CD Pipeline Frontend

El pipeline está configurado en `.github/workflows/frontend-deploy.yml`:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
  pull_request:
    branches: [main]
    paths:
      - "frontend/**"
```

Esta configuración:

- Solo se ejecuta cuando hay cambios en el directorio `frontend/`
- Se activa en:
  - Push a la rama `main`
  - Pull requests a la rama `main`
- Ignora todos los demás cambios en el repositorio

Para evitar que se ejecute el pipeline en ciertos commits, puedes usar cualquiera de estas variantes en el mensaje del commit:

```bash
git commit -m "docs: actualizar documentación [skip ci]"
git commit -m "docs: actualizar documentación [ci skip]"
git commit -m "docs: actualizar documentación [skip workflow]"
git commit -m "docs: actualizar documentación [workflow skip]"
```

Todas estas variantes funcionan igual y evitarán que se ejecute el pipeline.

### 6. Desarrollo Local

1. Instalar dependencias:

   ```bash
   cd frontend
   bun install
   ```

2. Iniciar servidor de desarrollo:

   ```bash
   bun run dev
   ```

3. Construir para producción:
   ```bash
   bun run build
   ```

### 7. Despliegue

El frontend se despliega automáticamente a Firebase Hosting cuando:

- Se hace push a la rama main
- El pipeline de CI/CD se ejecuta exitosamente

### 8. URLs y Dominios

- Frontend (Producción): https://[PROJECT_ID].web.app
- Frontend (Alternativa): https://[PROJECT_ID].firebaseapp.com

### 9. Monitoreo y Analytics

1. Ver estadísticas de hosting:

   ```bash
   firebase hosting:sites:list
   ```

2. Ver logs de despliegue:
   - Ir a Firebase Console > Hosting > Logs

### 10. Troubleshooting Frontend

1. Si el build falla:

   - Verificar que todas las dependencias estén instaladas
   - Revisar los logs en GitHub Actions
   - Comprobar que las variables de entorno estén configuradas

2. Si el despliegue falla:

   - Verificar las credenciales de Firebase
   - Comprobar que el proyecto esté correctamente inicializado
   - Revisar los logs en Firebase Console

3. Si la conexión con el backend falla:
   - Verificar que la URL de la API sea correcta
   - Comprobar que CORS esté configurado en el backend
   - Verificar que el backend esté funcionando

### 11. Configuración de CORS en el Backend

Para permitir peticiones desde el frontend, asegúrate de que el backend tenga configurado CORS:

```typescript
app.use(
  cors({
    origin: [
      "https://[PROJECT_ID].web.app",
      "https://[PROJECT_ID].firebaseapp.com",
      "http://localhost:5173", // Para desarrollo local
    ],
  })
);
```

## Contribución

1. Crear una rama para tu feature
2. Hacer commit de tus cambios
3. Crear un pull request a main

## Licencia

[Información de la licencia]
