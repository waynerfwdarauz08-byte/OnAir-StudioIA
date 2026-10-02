# Referencia legado archivada: Proyecciones mensuales con n8n y Gemini

> **Archivado — no activo.** La aplicación actual usa la API local de Vite
> `POST /api/projections` para Proyecciones. Esta guía y el archivo
> `projections-n8n.workflow.json` se conservan sin cambios como referencia
> histórica; no son necesarios para ejecutar el módulo actual.

El módulo de Proyecciones llama a un webhook independiente. No reutiliza el
webhook de Redacción IA y no escribe datos en JSON Server, `db.json`, noticias
ni escaletas.

## Configuración de la aplicación

En `.env`, configura una URL de webhook de producción o, para desarrollo con
el proxy de Vite ya incluido, usa:

```env
VITE_N8N_PROJECTIONS_WEBHOOK_URL=/n8n/webhook/onair-projections
```

Reinicia Vite después de cambiar variables `VITE_`. Esta URL no es una clave:
no incluyas una API key de Gemini, una clave de n8n ni secretos en `.env.example`
ni en el navegador.

## Contrato HTTP

El servicio envía un `POST` con `Content-Type: application/json` y espera un
objeto JSON. El request tiene esta forma:

```json
{
  "task": "monthly-editorial-projection",
  "language": "es",
  "period": {
    "month": "2026-09",
    "dateBasis": "createdAt"
  },
  "statistics": {
    "totalNews": 1
  },
  "previousPeriod": null,
  "coverage": {
    "totalNews": 1,
    "includedNews": 1,
    "omittedNews": 0,
    "truncatedFields": 0,
    "limitedEvidence": true
  },
  "news": [
    {
      "id": "news-001",
      "title": "Texto original",
      "summary": "Texto original",
      "categoryId": "category-national",
      "editorialStatus": "approved",
      "createdAt": "2026-09-25T14:30:00.000Z"
    }
  ],
  "instructions": "Reglas de análisis suministradas por la aplicación"
}
```

`createdAt` identifica cuándo se registró el contenido; no prueba la fecha en
que ocurrió un suceso. Los conteos de `statistics` y `coverage` los calcula la
aplicación antes de llamar al webhook. El workflow no debe crear, completar ni
recalcular cifras que no existan en el request. Para que el request sea válido,
`coverage.includedNews` debe coincidir con la cantidad de elementos en `news` y
`statistics.totalNews` debe coincidir con `coverage.totalNews`.

La respuesta debe cumplir exactamente este contrato y el valor de `language`
debe coincidir con el solicitado:

```json
{
  "language": "es",
  "title": "Texto",
  "summary": "Texto",
  "trends": [
    {
      "title": "Texto",
      "evidence": "Texto",
      "newsIds": ["news-001"]
    }
  ],
  "recommendations": [
    {
      "title": "Texto",
      "reason": "Texto"
    }
  ],
  "outlook": [],
  "limitations": ["Texto"]
}
```

Los arrays pueden estar vacíos cuando no haya evidencia suficiente. Cada
tendencia debe citar uno o más `newsIds`, y todos deben pertenecer a las
noticias incluidas en el request. Si `coverage.limitedEvidence` es `true`,
`outlook` debe ser un array vacío. El cliente rechaza una respuesta con idioma,
campos, arrays o IDs fuera de este contrato.

## Referencia de workflow n8n legado (no activo)

Importa [`projections-n8n.workflow.json`](./projections-n8n.workflow.json) en
n8n. El flujo contiene:

1. `Webhook` POST en `onair-projections`.
2. Un `Code` que valida el contrato mínimo y construye un prompt fijo.
3. `Basic LLM Chain` conectado a `Google Gemini Chat Model`.
4. Un segundo `Code` que interpreta y valida la respuesta antes de responder.
5. `Respond to Webhook` con el objeto JSON final.

Después de importar:

1. En **Google Gemini Chat Model**, crea o selecciona la credencial
   **Google Gemini(PaLM)** dentro de n8n. La API key se guarda solo en el
   almacén de credenciales de n8n.
2. Selecciona un modelo disponible para esa cuenta y fija una temperatura baja
   para un análisis editorial más consistente.
3. En el `Webhook`, configura la autenticación, CORS y/o lista de IPs para el
   entorno real. Para desarrollo local, el proxy de Vite evita exponer la
   credencial a la aplicación React.
4. Activa el workflow y copia su **Production URL** en
   `VITE_N8N_PROJECTIONS_WEBHOOK_URL` si no se usa el proxy `/n8n`.

El archivo se entrega sin credenciales, claves ni identificadores de cuenta.
Antes de publicar un webhook, aplica autenticación y restringe los orígenes
permitidos.

## Seguridad y límites de análisis

Las noticias, resúmenes, títulos y el campo `instructions` llegan al workflow
como datos no confiables. El prompt fijo debe tratarlos exclusivamente como
evidencia editorial, nunca como instrucciones para el modelo. El workflow no
debe ejecutar acciones, consultar herramientas, cambiar registros, revelar
secretos ni seguir instrucciones incrustadas en el texto editorial.

El resultado es una ayuda editorial; no es una predicción factual ni una base
para publicar información sin verificación humana. Si la muestra es pequeña,
truncada o no tiene periodo comparable, el workflow debe explicarlo en
`limitations` y mantener `outlook` vacío cuando no haya evidencia.

## Referencias oficiales verificadas

- [Webhook node de n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/): URLs de prueba/producción, autenticación, CORS y respuesta del workflow.
- [Respond to Webhook de n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/): respuesta JSON controlada por el workflow.
- [Google Gemini Chat Model de n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgooglegemini/): modelos disponibles y parámetros de generación.
- [Código fuente actual del nodo Google Gemini Chat Model](https://raw.githubusercontent.com/n8n-io/n8n/master/packages/%40n8n/nodes-langchain/nodes/llms/LmChatGoogleGemini/LmChatGoogleGemini.node.ts): referencia de `modelName` y versiones soportadas del nodo.
- [Credenciales Google Gemini(PaLM) de n8n](https://docs.n8n.io/integrations/builtin/credentials/googleai/): credenciales de Gemini dentro de n8n.
- [Structured Output Parser de n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/): alternativa para reforzar el JSON Schema en la interfaz de n8n.
