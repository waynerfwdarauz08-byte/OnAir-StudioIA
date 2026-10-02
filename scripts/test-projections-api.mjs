import assert from "node:assert/strict";
import { createServer, request as createRequest } from "node:http";
import { once } from "node:events";
import { Buffer } from "node:buffer";
import { projectionsApiPlugin } from "../dev/projectionsApi.js";

const API_KEY = "test-gemini-api-key-not-for-production";
const MODEL = "gemini-3.1-flash-lite";
const MAX_BODY_BYTES = 256 * 1024;

const analysis = {
  language: "en",
  title: "Monthly editorial projection",
  summary: "The supplied newsroom records support a limited analysis.",
  trends: [
    {
      title: "Observed editorial signal",
      evidence: "The supplied record is approved.",
      newsIds: ["news-001"],
    },
  ],
  recommendations: [
    {
      title: "Review the available sample",
      reason: "The sample is limited to the supplied records.",
    },
  ],
  outlook: ["baseline", "opportunity", "risk"].map((scenario) => ({
    scenario, horizonMonths: 6, title: "Conditional future scenario",
    rationale: "Coverage may develop if the stated conditions hold.",
    uncertainty: "High: only a limited sample is available.",
    assumptions: ["The supplied topics remain relevant."],
    signals: ["Additional reports on these topics."], newsIds: ["news-001"],
  })),
  forecast: { horizonMonths: 6, asOfMonth: "2026-10", targetMonth: "2027-04" },
  limitations: ["Only the supplied records were analyzed."],
};

function makeProjectionRequest({ limitedEvidence = false } = {}) {
  return {
    task: "monthly-editorial-projection",
    language: "en",
    forecast: analysis.forecast,
    period: {
      month: "2026-09",
      dateBasis: "createdAt",
    },
    statistics: {
      totalNews: 1,
    },
    previousPeriod: null,
    coverage: {
      totalNews: 1,
      includedNews: 1,
      omittedNews: 0,
      truncatedFields: 0,
      limitedEvidence,
    },
    news: [
      {
        id: "news-001",
        title: "Original editorial story",
        summary: "Original editorial summary.",
        categoryId: null,
        editorialStatus: "approved",
        createdAt: "2026-09-25T14:30:00.000Z",
      },
    ],
    instructions: "Analyze supplied records only.",
  };
}

function geminiResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
  };
}

function geminiCandidate(value) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(value) }],
        },
      },
    ],
  };
}

async function createApiServer(options, hook = "configureServer") {
  const plugin = projectionsApiPlugin(options);
  let middleware;

  plugin[hook]({
    middlewares: {
      use(handler) {
        middleware = handler;
      },
    },
  });

  assert.equal(typeof middleware, "function", `${hook} must register middleware`);

  const server = createServer((request, response) => {
    Promise.resolve(
      middleware(request, response, () => {
        response.statusCode = 404;
        response.end();
      })
    ).catch((error) => {
      if (!response.writableEnded) {
        response.statusCode = 500;
        response.end(JSON.stringify({ message: error.message }));
      }
    });
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  assert.ok(address && typeof address === "object");

  return {
    server,
    port: address.port,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

function sendRequest(
  { port },
  {
    method = "POST",
    path = "/api/projections",
    body,
    headers = {},
  } = {}
) {
  const requestBody =
    typeof body === "string" || Buffer.isBuffer(body)
      ? body
      : body === undefined
        ? undefined
        : JSON.stringify(body);
  const requestHeaders = {
    Host: `localhost:${port}`,
    ...headers,
  };

  if (
    requestBody !== undefined &&
    !Object.keys(requestHeaders).some(
      (name) => name.toLowerCase() === "content-length"
    )
  ) {
    requestHeaders["Content-Length"] = Buffer.byteLength(requestBody);
  }

  return new Promise((resolve, reject) => {
    const request = createRequest(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        headers: requestHeaders,
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.once("error", reject);
        response.once("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;

          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            // Las comprobaciones siguientes pueden inspeccionar el texto crudo.
          }

          resolve({
            status: response.statusCode,
            headers: response.headers,
            text,
            json,
          });
        });
      }
    );

    request.once("error", reject);
    if (requestBody !== undefined) {
      request.write(requestBody);
    }
    request.end();
  });
}

function localJsonRequest(server, body) {
  return sendRequest(server, {
    body,
    headers: {
      Origin: `http://localhost:${server.port}`,
      "Content-Type": "application/json",
    },
  });
}

const originalFetch = globalThis.fetch;
let upstreamFetch = async () => {
  throw new Error("Gemini must not be queried for this request.");
};
const servers = [];

globalThis.fetch = async (...arguments_) => upstreamFetch(...arguments_);

try {
  const configuredServer = await createApiServer({
    apiKey: API_KEY,
    model: MODEL,
  });
  servers.push(configuredServer);

  const unconfiguredServer = await createApiServer({
    apiKey: "",
    model: MODEL,
  });
  servers.push(unconfiguredServer);

  const noKey = await localJsonRequest(
    unconfiguredServer,
    makeProjectionRequest()
  );
  assert.equal(noKey.status, 503);
  assert.equal(noKey.json?.code, "unconfigured");

  const getResponse = await sendRequest(configuredServer, {
    method: "GET",
  });
  assert.equal(getResponse.status, 405);
  assert.equal(getResponse.json?.code, "method-not-allowed");
  assert.equal(getResponse.headers.allow, "POST, OPTIONS");

  const foreignOrigin = await sendRequest(configuredServer, {
    body: makeProjectionRequest(),
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
  });
  assert.equal(foreignOrigin.status, 403);
  assert.equal(foreignOrigin.json?.code, "forbidden");

  const foreignHost = await sendRequest(configuredServer, {
    body: makeProjectionRequest(),
    headers: { Host: "untrusted.example", "Content-Type": "application/json" },
  });
  assert.equal(foreignHost.status, 403);

  const invalidJson = await sendRequest(configuredServer, {
    body: "{not valid JSON",
    headers: {
      Origin: `http://localhost:${configuredServer.port}`,
      "Content-Type": "application/json",
    },
  });
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJson.json?.code, "invalid-request");

  const tooLarge = Buffer.alloc(MAX_BODY_BYTES + 1, "x");
  const oversized = await sendRequest(configuredServer, {
    body: tooLarge,
    headers: {
      Origin: `http://localhost:${configuredServer.port}`,
      "Content-Type": "application/json",
    },
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.json?.code, "payload-too-large");

  const noNewsRequest = makeProjectionRequest();
  noNewsRequest.news = [];
  noNewsRequest.statistics.totalNews = 0;
  noNewsRequest.coverage = {
    ...noNewsRequest.coverage,
    totalNews: 0,
    includedNews: 0,
  };
  const missingNews = await localJsonRequest(configuredServer, noNewsRequest);
  assert.equal(missingNews.status, 400);
  assert.equal(missingNews.json?.code, "invalid-request");

  let upstreamRequest;
  upstreamFetch = async (url, options) => {
    upstreamRequest = { url: String(url), options };
    return geminiResponse(geminiCandidate(analysis));
  };

  const success = await localJsonRequest(
    configuredServer,
    makeProjectionRequest()
  );
  assert.equal(success.status, 200);
  assert.deepEqual(success.json, analysis);
  assert.equal(success.json?.language, "en");
  assert.deepEqual(success.json?.trends?.[0]?.newsIds, ["news-001"]);
  assert.equal(
    upstreamRequest.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"
  );
  assert.equal(upstreamRequest.options.headers["x-goog-api-key"], API_KEY);
  assert.equal(success.text.includes(API_KEY), false);
  assert.equal(success.headers["x-goog-api-key"], undefined);
  assert.deepEqual(success.json.forecast, analysis.forecast);
  assert.equal(success.json.outlook.length, 3);
  const limitedSuccess = await localJsonRequest(configuredServer, makeProjectionRequest({ limitedEvidence: true }));
  assert.equal(limitedSuccess.status, 200);
  assert.equal(limitedSuccess.json.outlook.length, 3);

  upstreamFetch = async () =>
    geminiResponse(
      {
        error: {
          message: `Provider diagnostic with ${API_KEY}.`,
        },
      },
      429
    );
  const providerRateLimit = await localJsonRequest(
    configuredServer,
    makeProjectionRequest()
  );
  assert.equal(providerRateLimit.status, 502);
  assert.equal(providerRateLimit.json?.code, "http");
  assert.ok(providerRateLimit.json.message.includes("429"));
  assert.ok(providerRateLimit.text.includes("Provider diagnostic"));
  assert.ok(providerRateLimit.text.includes("[redacted]"));
  assert.equal(providerRateLimit.text.includes(API_KEY), false);

  upstreamFetch = async () =>
    geminiResponse(
      geminiCandidate({
        ...analysis,
        trends: [
          {
            ...analysis.trends[0],
            newsIds: ["unknown-news-id"],
          },
        ],
      })
    );
  const invalidOutput = await localJsonRequest(
    configuredServer,
    makeProjectionRequest()
  );
  assert.equal(invalidOutput.status, 502);
  assert.equal(invalidOutput.json?.code, "invalid-response");

  upstreamFetch = async () =>
    geminiResponse(
      geminiCandidate({
        ...analysis,
        outlook: analysis.outlook.map((item, index) => index === 0 ? { ...item, horizonMonths: 3 } : item),
      })
    );
  const limitedEvidence = await localJsonRequest(
    configuredServer,
    makeProjectionRequest({ limitedEvidence: true })
  );
  assert.equal(limitedEvidence.status, 502);
  assert.equal(limitedEvidence.json?.code, "invalid-response");

  const previewServer = await createApiServer(
    { apiKey: API_KEY, model: MODEL },
    "configurePreviewServer"
  );
  servers.push(previewServer);
  const previewGet = await sendRequest(previewServer, { method: "GET" });
  assert.equal(previewGet.status, 405);
  assert.equal(previewGet.json?.code, "method-not-allowed");
} finally {
  globalThis.fetch = originalFetch;
  await Promise.all(servers.map((server) => server.close()));
}

console.log(
  "PASS: local projections API middleware validates requests, keeps Gemini credentials server-side, redacts provider errors, and mounts for dev and preview."
);
