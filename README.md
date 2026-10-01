# OnAir Studio AI

Aplicación académica para la gestión editorial, escaletas, control al aire, teleprompter y mensajería interna. La interfaz está construida con React y Vite. Los datos se simulan localmente con JSON Server y `db.json`.

## Instalación

Instala las dependencias del proyecto:

```bash
npm install
```

## Configuración local

El archivo `.env.example` incluye las variables que usa la aplicación:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_N8N_AI_WEBHOOK_URL=/n8n/webhook/onair-ai-editor
VITE_N8N_ACTIVITY_WEBHOOK_URL=/n8n/webhook/onair-activity-log
```

Crea un archivo `.env` local a partir de esos valores cuando necesites personalizarlos. El archivo `.env` está excluido del control de versiones.

## Iniciar la aplicación

Abre dos terminales en la raíz del proyecto.

En la primera, inicia el backend simulado de JSON Server:

```bash
npm run server
```

Este comando sirve `db.json` en `http://localhost:3001`.

En la segunda, inicia Vite:

```bash
npm run dev
```

Vite mostrará en la terminal la URL local de la aplicación.

## Integración con n8n

La redacción asistida por IA y el registro de actividad usan webhooks de n8n mediante el proxy `/n8n` configurado por Vite hacia `http://localhost:5678`.

Si vas a utilizar esas integraciones, inicia n8n por separado con el comando que usa la aplicación en sus mensajes de conexión:

```bash
n8n start
```

El resto de la aplicación continúa usando JSON Server y `db.json` como simulación local de datos.

## Comandos disponibles

```bash
npm run dev      # Inicia Vite en desarrollo
npm run server   # Inicia JSON Server con db.json en el puerto 3001
npm run build    # Genera la compilación de producción
npm run preview  # Previsualiza la compilación de producción
npm run lint     # Ejecuta ESLint
```
