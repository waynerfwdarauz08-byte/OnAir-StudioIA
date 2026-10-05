# Segundo workflow: registrar inicios de sesión

Solo tiene dos nodos: **Webhook → HTTP Request**. Cada inicio de sesión correcto envía el nombre, identificador y descripción de la actividad a n8n. El workflow agrega la fecha y guarda el registro en la colección `activityLogs` de JSON Server. No usa IA, claves adicionales ni un backend nuevo.

## Instalación

1. Abre n8n en `http://localhost:5678`.
2. Crea un workflow nuevo y, desde el menú de tres puntos, selecciona **Import from File**.
3. Importa `docs/activity-n8n.workflow.json`.
4. Abre **Guardar en JSON Server**. La URL viene configurada como `http://localhost:3001/activityLogs` para n8n ejecutado localmente con `n8n start`.
5. Publica o activa el workflow, según la versión de n8n. La aplicación usa la URL de producción `/webhook/onair-activity-log`; ejecutar una prueba manual del workflow no activa esa URL.

Mantén ejecutados estos tres procesos, cada uno en su terminal:

```bash
npm run server
npm run dev
n8n start
```

La variable de la aplicación es:

```env
VITE_N8N_ACTIVITY_WEBHOOK_URL=/n8n/webhook/onair-activity-log
```

El prefijo `/n8n` lo resuelve el proxy de Vite. Si cambias una variable de entorno, reinicia Vite. No modifiques `VITE_N8N_AI_WEBHOOK_URL`: pertenece al workflow de Redacción con IA.

## Comprobación

1. Cierra sesión e inicia sesión en OnAir Studio.
2. Revisa **Executions** en el nuevo workflow: ambos nodos deben terminar correctamente.
3. Como administrador, abre **Historial de actividad** (`/admin/activity`). Verás un nuevo registro de inicio de sesión con nombre y fecha. Si ya tenías esa página abierta en otra ventana, recárgala.

Si n8n está detenido, el usuario puede iniciar sesión igualmente; ese intento no se registra ni se reenvía automáticamente.

## Si n8n se ejecuta en Docker o en la nube

En Docker para Windows, cambia la URL del nodo HTTP Request a `http://host.docker.internal:3001/activityLogs`. JSON Server debe aceptar conexiones desde el contenedor; si hace falta, inicia `npm run server -- --host 0.0.0.0`. La aplicación sigue apuntando a n8n local en el puerto 5678.

Este archivo está preparado para un entorno local. En n8n Cloud, `localhost:3001` no corresponde a tu computadora y no funcionará con JSON Server local.

Referencias: [importar workflows](https://docs.n8n.io/workflows/export-import/), [Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) y [HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).
