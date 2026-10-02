# Proyecciones mensuales con Gemini mediante la API local de Vite

El módulo de Proyecciones usa `POST /api/projections` durante el desarrollo
local. La ruta vive en el proceso de Vite y llama a Gemini desde ese proceso;
la aplicación React no recibe ni envía la clave de Gemini desde el navegador.

Esta integración no crea un backend adicional, no modifica JSON Server ni
escribe en `db.json`, noticias, escaletas u otro almacenamiento. Gemini recibe
solo el contexto editorial de noticias que la aplicación prepara para el mes
seleccionado y devuelve un análisis para mostrarlo en la interfaz.

## Configuración local

1. Crea `.env.local` en la raíz del proyecto. El patrón `*.local` ya está
   incluido en `.gitignore`.
2. Crea una clave en Google AI Studio y asígnala **solo** al entorno del
   proceso que ejecuta Vite. No uses el prefijo `VITE_` y no copies la clave a
   código de React, al navegador, al repositorio ni a `.env.example`.

```env
GEMINI_API_KEY=
GEMINI_PROJECTIONS_MODEL=gemini-3.1-flash-lite
```

`GEMINI_PROJECTIONS_MODEL` es opcional: si no se define, la aplicación usa
`gemini-3.1-flash-lite`. Puedes cambiarlo por otro modelo disponible para tu
cuenta. Reinicia Vite después de crear o modificar `.env.local`.

## Ejecución en desarrollo

JSON Server continúa siendo la simulación local de datos y se ejecuta por
separado de Vite. Abre dos terminales en la raíz del proyecto:

```bash
npm run server
```

```bash
npm run dev
```

Con ambos procesos activos, la interfaz consulta las noticias en JSON Server y
solicita el análisis a `POST /api/projections` en el servidor local de Vite.
La ruta valida el request y la respuesta antes de devolver el resultado a la
interfaz; no realiza escrituras de datos.

Si `GEMINI_API_KEY` falta o está vacía, Proyecciones muestra un error de
configuración claro. No usa n8n ni una clave expuesta en el cliente como
alternativa.

## Vista previa y despliegue

La ruta local también está disponible al comprobar una compilación con:

```bash
npm run build
npm run preview
```

Un alojamiento puramente estático no puede ejecutar `/api/projections`. En ese
caso, la generación con Gemini no estará disponible a menos que exista un
entorno de servidor que implemente de forma segura la misma ruta y mantenga la
clave fuera del cliente. Este proyecto no crea ese entorno de producción.

## Límites del análisis

Puedes elegir horizontes de 6, 12, 18, 24 o 36 meses desde el mes actual.
El mes seleccionado sigue siendo la fuente histórica de los datos. Gemini
genera tres escenarios futuros: continuidad, oportunidad y riesgo, con
supuestos, señales para observar y referencias a noticias de esa muestra.
Son posibilidades condicionadas, no acontecimientos futuros conocidos ni
promesas de resultados. Con pocos datos se presentan como exploraciones de
alta incertidumbre; no se inventan cifras o probabilidades.

El texto editorial se trata como datos no confiables. Gemini se usa solo para
analizar el conjunto mensual que recibe la ruta: no debe seguir instrucciones
incrustadas en noticias, usar herramientas, crear registros ni afirmar hechos
que no estén respaldados por el contexto entregado. El resultado es apoyo
editorial y requiere revisión humana antes de cualquier uso público.

## Referencia anterior

La integración previa basada en n8n se conserva únicamente como
[referencia legado archivada](./projections-n8n.md). No es necesaria para la
API local actual.
