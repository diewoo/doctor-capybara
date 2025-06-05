# 🚀 Deploy Frontend a Múltiples Sitios de Firebase Hosting con CI/CD

Este proyecto está configurado para desplegar el mismo frontend a **dos sitios de Firebase Hosting** bajo el mismo proyecto, usando un flujo automatizado con GitHub Actions y autenticación segura con Google Cloud Platform (GCP).

---

## 🛠️ Problemas resueltos

- **Deploy solo actualizaba un sitio:** Ahora ambos sitios se actualizan automáticamente.
- **Sitio secundario mostraba "Site Not Found":** Se corrigió la configuración para que ambos sitios reciban el contenido.
- **Automatización del deploy:** El flujo de CI/CD en GitHub Actions construye y despliega automáticamente tras cada push a `main`.
- **Configuración segura de credenciales:** Se usan secretos de GCP y GitHub para un deploy seguro y sin exponer claves.

---

## 1. Configuración de Firebase Hosting Multi-sitio

### `firebase.json`

```json
{
  "hosting": [
    {
      "target": "crenteria-web-1503077472761",
      "public": "frontend/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "doctor-capybara-d97d2",
      "public": "frontend/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

### `.firebaserc`

```json
{
  "projects": {
    "default": "crenteria-web-1503077472761"
  },
  "targets": {
    "crenteria-web-1503077472761": {
      "hosting": {
        "crenteria-web-1503077472761": ["crenteria-web-1503077472761"],
        "doctor-capybara-d97d2": ["doctor-capybara-d97d2"]
      }
    }
  },
  "etags": {}
}
```

---

## 2. Configuración de Google Cloud Platform (GCP)

### a) Crear cuenta de servicio y descargar clave

1. Ve a [Google Cloud Console > IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. Crea una nueva cuenta de servicio con permisos de **Firebase Admin** y/o **Firebase Hosting Admin**.
3. Descarga la clave JSON.

### b) Comando para crear cuenta de servicio (opcional por CLI)

```sh
gcloud iam service-accounts create github-actions-deployer --display-name="GitHub Actions Deployer"
```

### c) Asignar roles necesarios

```sh
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:github-actions-deployer@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

### d) Descargar la clave JSON

```sh
gcloud iam service-accounts keys create ~/key.json \
  --iam-account=github-actions-deployer@<PROJECT_ID>.iam.gserviceaccount.com
```

---

## 3. Configuración de GitHub

### a) Agregar secretos

1. Ve a tu repositorio en GitHub > Settings > Secrets and variables > Actions.
2. Agrega los siguientes secretos:
   - `FIREBASE_SERVICE_ACCOUNT`: Pega el contenido del archivo JSON de la cuenta de servicio.
   - `GCP_PROJECT_ID`: El ID de tu proyecto de GCP.

---

## 4. Configuración de GitHub Actions

### `.github/workflows/frontend-deploy.yml`

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

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          project_id: ${{ env.PROJECT_ID }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install Bun
        run: |
          curl -fsSL https://bun.sh/install | bash
          echo "$HOME/.bun/bin" >> $GITHUB_PATH

      - name: Install Dependencies
        run: |
          cd frontend
          bun install

      - name: Build
        run: |
          cd frontend
          bun run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          channelId: live
          projectId: ${{ env.PROJECT_ID }}
```

---

## 5. Comandos útiles para el flujo local

### a) Instalar dependencias

```sh
cd frontend
bun install
```

### b) Generar el build del frontend

```sh
cd frontend
bun run build
```

_o si usas npm/yarn:_

```sh
npm run build
# o
yarn build
```

### c) Deploy local a ambos sitios

```sh
firebase deploy --only hosting
```

Esto desplegará el contenido a ambos sitios automáticamente.

### d) Deploy a un solo sitio (opcional)

```sh
firebase deploy --only hosting:doctor-capybara-d97d2
```

### e) Ver los sitios configurados

```sh
firebase hosting:sites:list
```

---

## 6. ¿Cómo replicar este flujo?

1. Configura ambos archivos (`firebase.json` y `.firebaserc`) como arriba.
2. Crea y configura la cuenta de servicio en GCP.
3. Agrega los secretos a GitHub (`FIREBASE_SERVICE_ACCOUNT` y `GCP_PROJECT_ID`).
4. Haz el build del frontend.
5. Haz deploy localmente o deja que GitHub Actions lo haga automáticamente en cada push a `main`.

---

## 📝 Notas

- Puedes ver los sitios en la consola de Firebase Hosting.
- Si agregas más sitios, solo debes añadirlos en ambos archivos y usar el mismo flujo.
- Si solo quieres desplegar a uno, puedes usar:
  ```sh
  firebase deploy --only hosting:<target>
  ```
