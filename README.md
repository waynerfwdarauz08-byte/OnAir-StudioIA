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
GEMINI_API_KEY=
GEMINI_PROJECTIONS_MODEL=gemini-3.1-flash-lite
```

Crea un archivo `.env.local` a partir de esos valores cuando necesites personalizarlos. El patrón `*.local` está excluido del control de versiones. `GEMINI_API_KEY` no usa el prefijo `VITE_`: solo la lee el proceso local de Vite para la ruta de Proyecciones y nunca debe estar en código de React, en el navegador ni en el repositorio.

Para habilitar Proyecciones, crea una clave en Google AI Studio y asígnala únicamente en `.env.local` o en las variables del proceso que ejecuta Vite:

```env
GEMINI_API_KEY=tu_clave_local_de_google_ai_studio
GEMINI_PROJECTIONS_MODEL=gemini-3.1-flash-lite
```

Reinicia Vite después de crear o cambiar `.env.local`.

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

## Integraciones n8n activas

La redacción asistida por IA y el registro de actividad usan webhooks de n8n mediante el proxy `/n8n` configurado por Vite hacia `http://localhost:5678`.

Si vas a utilizar esas integraciones, inicia n8n por separado con el comando que usa la aplicación en sus mensajes de conexión:

```bash
n8n start
```

El resto de la aplicación continúa usando JSON Server y `db.json` como simulación local de datos.

### Proyecciones mensuales con Gemini

Las Proyecciones no usan n8n. En desarrollo, la aplicación llama a la ruta local `POST /api/projections` de Vite; esa ruta utiliza Gemini desde el proceso de Vite y no expone la clave al navegador. JSON Server sigue siendo una simulación separada para leer `db.json`, por lo que deben ejecutarse ambos procesos:

```bash
npm run server
npm run dev
```

La ruta envía a Gemini solo el contexto editorial de noticias seleccionado para el mes y no crea, actualiza ni elimina datos en JSON Server, `db.json`, noticias, escaletas ni otro almacenamiento. Si falta `GEMINI_API_KEY`, el módulo informa honestamente que la generación no está configurada; no usa un webhook n8n como alternativa.

Después de compilar, `npm run preview` también permite comprobar `/api/projections` localmente. Un despliegue estático no puede ejecutar esta API local: la generación de Proyecciones no estará disponible allí sin un entorno de servidor que implemente la misma ruta. Consulta la [guía de la API local de Proyecciones](docs/projections-ai.md). La documentación y el workflow anteriores de n8n se conservan solo como [referencia legado archivada](docs/projections-n8n.md).

## Comandos disponibles

```bash
npm run dev      # Inicia Vite en desarrollo
npm run server   # Inicia JSON Server con db.json en el puerto 3001
npm run build    # Genera la compilación de producción
npm run preview  # Previsualiza la compilación de producción
npm run lint     # Ejecuta ESLint
```
