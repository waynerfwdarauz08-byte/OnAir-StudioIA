# Registro y reporte de sesiones con n8n

Este workflow registra inicios y cierres de sesión en la colección `activityLogs` de JSON Server y envía por Gmail un reporte con los datos del evento. No crea ni sustituye el backend simulado del proyecto.

El flujo tiene cuatro nodos: **Webhook → Validar y preparar datos → Guardar evento en JSON Server → Enviar resumen por Gmail**. El frontend envía un evento al iniciar o cerrar sesión. El reporte incluye nombre, correo, rol, ID de usuario, ID de sesión, fecha de inicio y cierre, duración cuando se cierra, navegador/dispositivo, idioma, zona horaria y fecha del registro. Nunca envía la contraseña.

## Importar y configurar

1. Inicia JSON Server, Vite y n8n en sus terminales:

   ```bash
   npm run server
   npm run dev
   n8n start
   ```

2. Abre n8n en `http://localhost:5678` y crea un workflow importando `docs/activity-n8n.workflow.json`.
3. Abre **Guardar evento en JSON Server** y conserva `http://localhost:3001/activityLogs` para n8n instalado localmente en la misma computadora.
4. Abre **Enviar resumen por Gmail**. Crea o selecciona una credencial de Gmail y reemplaza `DESTINATARIO@EJEMPLO.COM` por el correo que recibirá los reportes. La credencial de Gmail se configura dentro de n8n; no pongas contraseñas ni tokens en el código del proyecto.
5. Guarda y activa el workflow. El endpoint de producción que utiliza la aplicación es `/webhook/onair-activity-log`; la URL de prueba de n8n solo funciona mientras se ejecuta una prueba manual.

La documentación de n8n describe el envío de mensajes desde Gmail y los campos de destinatario, asunto, tipo y cuerpo del mensaje: [Gmail Message Operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/).

La aplicación conserva su configuración actual:

```env
VITE_N8N_ACTIVITY_WEBHOOK_URL=/n8n/webhook/onair-activity-log
```

Vite resuelve el prefijo `/n8n` mediante el proxy local. No cambies `VITE_N8N_AI_WEBHOOK_URL`, que pertenece a Redacción con IA.

## Comprobar el flujo

1. Inicia sesión en OnAir Studio y confirma en **Executions** que corrieron Webhook, validación, guardado y Gmail.
2. Confirma que se agregó `login_success` en Historial de actividad y que llegó el correo de inicio.
3. Cierra sesión. Debe registrarse `logout`, con la duración calculada, y llegar el correo de cierre con el resumen de la sesión.

Si n8n o Gmail falla, la autenticación simulada no bloquea el acceso ni el cierre de sesión; revisa **Executions** para diagnosticar el evento. El registro en JSON Server se realiza antes del envío del correo.

## n8n en Docker

Si n8n corre en Docker en Windows, cambia la URL del nodo de guardado a `http://host.docker.internal:3001/activityLogs`. JSON Server debe aceptar conexiones desde el contenedor; puede iniciarse con `npm run server -- --host 0.0.0.0`.

El workflow está preparado para ejecución local. n8n Cloud no puede acceder a `localhost:3001` de tu computadora.
