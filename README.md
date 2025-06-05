# Doctor Capybara

## Configuración de Credenciales

1. Copia el archivo `key.example.json` a `key.json`:

```bash
cp key.example.json key.json
```

2. Reemplaza los valores en `key.json` con tus credenciales de Google Cloud.

3. Las credenciales reales se mantienen en `~/.gcloud/doctor-capybara-key.json` para desarrollo local.

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar el entorno de desarrollo
docker-compose up
```

## Despliegue

El proyecto está configurado para desplegar automáticamente a Google Cloud Platform cuando se hace push a la rama main.

### Backend

- Se despliega a Cloud Run
- Usa la cuenta de servicio configurada en GitHub Secrets

### Frontend

- Se despliega a Firebase Hosting
- Usa la configuración de Firebase en GitHub Secrets
