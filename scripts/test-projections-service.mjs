import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PROJECTIONS_ERROR_CODES,
  projectionsService,
  getProjectionsErrorMessage,
} from "../src/services/projectionsService.js";
const aiServiceFile = new URL(
  "../src/services/aiService.js",
  import.meta.url
);
const aiServiceSource = await readFile(aiServiceFile, "utf8");
const testableAiServiceSource = aiServiceSource.replace(
  "import.meta.env.VITE_N8N_AI_WEBHOOK_URL",
  '"https://example.test/onair-ai-editor"'
);
const { aiService } = await import(
  `data:text/javascript,${encodeURIComponent(
    testableAiServiceSource
  )}`
);

const request = {
  task: "monthly-editorial-projection",
  language: "en",
  forecast: { horizonMonths: 6, asOfMonth: "2026-10", targetMonth: "2027-04" },
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
    limitedEvidence: false,
  },
  news: [
    {
      id: "news-001",
      title: "Original story",
      summary: "Original summary",
      categoryId: null,
      editorialStatus: "approved",
      createdAt: "2026-09-25T14:30:00.000Z",
    },
  ],
  instructions: "Analyze supplied records only.",
};

const response = {
  language: "en",
  title: "Monthly projection",
  summary: "The available record supports a limited editorial analysis.",
  trends: [
    {
      title: "One observed signal",
      evidence: "The supplied record is approved.",
      newsIds: ["news-001"],
    },
  ],
  recommendations: [
    {
      title: "Verify scope",
      reason: "One record is not a complete monthly sample.",
    },
  ],
  outlook: ["baseline", "opportunity", "risk"].map((scenario) => ({
    scenario, horizonMonths: 6, title: "Conditional future scenario",
    rationale: "Coverage may develop if the stated conditions hold.",
    uncertainty: "High: only a limited sample is available.",
    assumptions: ["The supplied topics remain relevant."],
    signals: ["Additional reports on these topics."], newsIds: ["news-001"],
  })),
  forecast: request.forecast,
  limitations: ["Only one supplied record is available."],
};

const editorInput = {
  sourceName: "Editorial source",
  sourceText: "Original editorial information.",
  tone: "informative",
  targetDurationSeconds: 30,
};
const editorResponse = {
  title: "Generated editorial title",
  summary: "Generated editorial summary.",
};

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/projections");
    return new Response(JSON.stringify({
      code: "unconfigured", message: "GEMINI_API_KEY is not configured locally.",
    }), { status: 503 });
  };
  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) => error.code === PROJECTIONS_ERROR_CODES.UNCONFIGURED &&
      getProjectionsErrorMessage(error, "es").includes("reinicia Vite") &&
      getProjectionsErrorMessage(error, "en").includes("restart Vite")
  );

  let receivedEditorBody;

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.test/onair-ai-editor");
    assert.equal(options.method, "POST");
    receivedEditorBody = JSON.parse(options.body);

    return new Response(JSON.stringify(editorResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const editorResult =
    await aiService.generateEditorialContent(editorInput);

  assert.deepEqual(receivedEditorBody, editorInput);
  assert.equal(editorResult.title, editorResponse.title);

  let receivedBody;

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/projections");
    assert.equal(options.method, "POST");
    receivedBody = JSON.parse(options.body);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const result = await projectionsService.generateAnalysis(request);

  assert.deepEqual(receivedBody, request);
  assert.deepEqual(result, response);

  await assert.rejects(() => projectionsService.generateAnalysis({ ...request, forecast: { ...request.forecast, horizonMonths: 3 } }), TypeError);
  await assert.rejects(() => projectionsService.generateAnalysis({ ...request, forecast: { ...request.forecast, targetMonth: "2027-05" } }), TypeError);

  await assert.rejects(
    () =>
      projectionsService.generateAnalysis({
        ...request,
        coverage: {
          ...request.coverage,
          includedNews: 0,
          omittedNews: 1,
        },
      }),
    (error) =>
      error instanceof TypeError &&
      error.message.includes("coverage.includedNews")
  );

  await assert.rejects(
    () =>
      projectionsService.generateAnalysis({
        ...request,
        statistics: {
          ...request.statistics,
          totalNews: 2,
        },
      }),
    (error) =>
      error instanceof TypeError &&
      error.message.includes("statistics.totalNews")
  );

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Gemini failed" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
      },
    });

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.HTTP &&
      error.status === 502 &&
      error.detail === "Gemini failed"
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ...response,
        language: "es",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ...response,
        trends: [
          {
            ...response.trends[0],
            newsIds: ["news-unknown"],
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ...response,
        trends: [
          {
            ...response.trends[0],
            newsIds: [],
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ...response,
        trends: [
          {
            ...response.trends[0],
            evidence: " ",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () =>
    new Response("not valid json", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  await assert.rejects(
    () => projectionsService.generateAnalysis(request),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ...response,
        outlook: response.outlook.map((item, index) => index === 0 ? { ...item, assumptions: [] } : item),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  await assert.rejects(
    () =>
      projectionsService.generateAnalysis({
        ...request,
        coverage: {
          ...request.coverage,
          limitedEvidence: true,
        },
      }),
    (error) =>
      error.code === PROJECTIONS_ERROR_CODES.INVALID_RESPONSE
  );

  globalThis.fetch = async () => new Response(JSON.stringify(response), { status: 200 });
  const limitedResult = await projectionsService.generateAnalysis({ ...request, coverage: { ...request.coverage, limitedEvidence: true } });
  assert.equal(limitedResult.outlook.length, 3);
  assert.deepEqual(limitedResult.forecast, request.forecast);

  globalThis.fetch = (ignoredUrl, options) =>
    new Promise((ignoredResolve, reject) => {
      if (options.signal.aborted) {
        reject(options.signal.reason);
        return;
      }

      options.signal.addEventListener(
        "abort",
        () =>
          reject(
            new DOMException(
              "The request was aborted.",
              "AbortError"
            )
          ),
        { once: true }
      );
    });

  const controller = new AbortController();
  const pendingRequest = projectionsService.generateAnalysis(
    request,
    controller.signal
  );

  controller.abort();

  await assert.rejects(
    () => pendingRequest,
    (error) => error.name === "AbortError"
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Local projections client and unchanged AI editor mocked-fetch checks passed.");
