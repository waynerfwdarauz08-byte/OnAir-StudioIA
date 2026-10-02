import { addMonthsToMonth, PROJECTION_HORIZONS } from "../utils/projections.js";

const PROJECTIONS_API_URL = "/api/projections";

const REQUEST_TIMEOUT_MS = 45_000;

export const PROJECTIONS_ERROR_CODES = Object.freeze({
  UNCONFIGURED: "unconfigured",
  NETWORK: "network",
  HTTP: "http",
  INVALID_RESPONSE: "invalid-response",
});

const ERROR_MESSAGES = {
  es: {
    [PROJECTIONS_ERROR_CODES.UNCONFIGURED]:
      "Configura GEMINI_API_KEY en .env.local y reinicia Vite para habilitar el análisis de proyecciones.",
    [PROJECTIONS_ERROR_CODES.NETWORK]:
      "No fue posible conectar con el servicio de proyecciones.",
    timeout:
      "El servicio de proyecciones tardó demasiado en responder.",
    [PROJECTIONS_ERROR_CODES.HTTP]:
      "El servicio de proyecciones no pudo procesar la solicitud.",
    [PROJECTIONS_ERROR_CODES.INVALID_RESPONSE]:
      "El servicio de proyecciones devolvió una respuesta no válida.",
  },
  en: {
    [PROJECTIONS_ERROR_CODES.UNCONFIGURED]:
      "Set GEMINI_API_KEY in .env.local and restart Vite to enable projections analysis.",
    [PROJECTIONS_ERROR_CODES.NETWORK]:
      "Unable to connect to the projections service.",
    timeout:
      "The projections service took too long to respond.",
    [PROJECTIONS_ERROR_CODES.HTTP]:
      "The projections service could not process the request.",
    [PROJECTIONS_ERROR_CODES.INVALID_RESPONSE]:
      "The projections service returned an invalid response.",
  },
};

export class ProjectionsServiceError extends Error {
  constructor(
    code,
    {
      detail = "",
      status = 0,
      cause,
      isTimeout = false,
    } = {}
  ) {
    super(detail || code, { cause });

    this.name = "ProjectionsServiceError";
    this.code = code;
    this.detail = detail;
    this.status = status;
    this.isTimeout = isTimeout;
  }
}

export function getProjectionsErrorMessage(
  error,
  language = "es"
) {
  const messages = ERROR_MESSAGES[
    language === "en" ? "en" : "es"
  ];

  if (
    error?.code === PROJECTIONS_ERROR_CODES.NETWORK &&
    error.isTimeout
  ) {
    return messages.timeout;
  }

  return (
    messages[error?.code] ||
    (language === "en"
      ? "Unable to generate the projections analysis."
      : "No fue posible generar el análisis de proyecciones.")
  );
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return false;
  }

  return true;
}

function isJsonValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isPlainObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function assertRequest(condition, field) {
  if (!condition) {
    throw new TypeError(
      `Invalid projections analysis request: ${field}.`
    );
  }
}

function validateNewsItem(newsItem, index) {
  const field = `news[${index}]`;

  assertRequest(isPlainObject(newsItem), field);
  assertRequest(isNonEmptyString(newsItem.id), `${field}.id`);
  assertRequest(
    typeof newsItem.title === "string",
    `${field}.title`
  );
  assertRequest(
    typeof newsItem.summary === "string",
    `${field}.summary`
  );
  assertRequest(
    newsItem.categoryId === null ||
      typeof newsItem.categoryId === "string",
    `${field}.categoryId`
  );
  assertRequest(
    typeof newsItem.editorialStatus === "string",
    `${field}.editorialStatus`
  );
  assertRequest(
    isNonEmptyString(newsItem.createdAt),
    `${field}.createdAt`
  );
}

function validateCoverage(coverage) {
  assertRequest(isPlainObject(coverage), "coverage");

  [
    "totalNews",
    "includedNews",
    "omittedNews",
  ].forEach((key) => {
    assertRequest(
      Number.isInteger(coverage[key]) && coverage[key] >= 0,
      `coverage.${key}`
    );
  });

  assertRequest(
    coverage.includedNews + coverage.omittedNews ===
      coverage.totalNews,
    "coverage totals"
  );
  assertRequest(
    isJsonValue(coverage.truncatedFields),
    "coverage.truncatedFields"
  );

  if ("limitedEvidence" in coverage) {
    assertRequest(
      typeof coverage.limitedEvidence === "boolean",
      "coverage.limitedEvidence"
    );
  }
}

export function validateRequest(request) {
  assertRequest(isPlainObject(request), "request");
  assertRequest(
    request.task === "monthly-editorial-projection",
    "task"
  );
  assertRequest(
    request.language === "es" || request.language === "en",
    "language"
  );
  assertRequest(isPlainObject(request.period), "period");
  assertRequest(
    isNonEmptyString(request.period.month) &&
      isValidMonth(request.period.month),
    "period.month"
  );
  assertRequest(
    request.period.dateBasis === "createdAt",
    "period.dateBasis"
  );
  assertRequest(isPlainObject(request.forecast), "forecast");
  assertRequest(PROJECTION_HORIZONS.includes(request.forecast.horizonMonths), "forecast.horizonMonths");
  assertRequest(isValidMonth(request.forecast.asOfMonth), "forecast.asOfMonth");
  assertRequest(request.forecast.targetMonth === addMonthsToMonth(request.forecast.asOfMonth, request.forecast.horizonMonths), "forecast.targetMonth");
  assertRequest(
    isPlainObject(request.statistics) &&
      isJsonValue(request.statistics),
    "statistics"
  );
  assertRequest(
    request.previousPeriod === null ||
      (isPlainObject(request.previousPeriod) &&
        isJsonValue(request.previousPeriod)),
    "previousPeriod"
  );
  validateCoverage(request.coverage);
  assertRequest(Array.isArray(request.news), "news");
  assertRequest(
    request.coverage.includedNews === request.news.length,
    "coverage.includedNews"
  );
  assertRequest(
    request.statistics.totalNews === request.coverage.totalNews,
    "statistics.totalNews"
  );
  request.news.forEach(validateNewsItem);
  assertRequest(isNonEmptyString(request.instructions), "instructions");
}

function getDetail(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (isPlainObject(value)) {
    if (isNonEmptyString(value.message)) {
      return value.message.trim();
    }

    if (isNonEmptyString(value.error)) {
      return value.error.trim();
    }

    if (isPlainObject(value.error)) {
      return getDetail(value.error);
    }
  }

  return "";
}

function getResponsePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.length === 1 ? payload[0] : payload;
  }

  return payload;
}

function unwrapResponse(payload) {
  const response = getResponsePayload(payload);

  if (!isPlainObject(response)) {
    return response;
  }

  if (isPlainObject(response.data)) {
    return response.data;
  }

  if (isPlainObject(response.result)) {
    return response.result;
  }

  if (isPlainObject(response.json)) {
    return response.json;
  }

  return response;
}

function assertResponse(condition, detail) {
  if (!condition) {
    throw new ProjectionsServiceError(
      PROJECTIONS_ERROR_CODES.INVALID_RESPONSE,
      { detail }
    );
  }
}

function requiredText(value, field) {
  assertResponse(
    isNonEmptyString(value),
    `Missing or invalid ${field} in the projections response.`
  );

  return value.trim();
}

function validateTrend(trend, index, knownNewsIds) {
  const field = `trends[${index}]`;

  assertResponse(
    isPlainObject(trend),
    `Missing or invalid ${field} in the projections response.`
  );

  assertResponse(
    Array.isArray(trend.newsIds) &&
      trend.newsIds.length > 0 &&
      trend.newsIds.every(
        (newsId) =>
          isNonEmptyString(newsId) &&
          knownNewsIds.has(newsId)
      ),
    `Missing, invalid, or unknown newsIds in ${field}.`
  );

  return {
    title: requiredText(trend.title, `${field}.title`),
    evidence: requiredText(
      trend.evidence,
      `${field}.evidence`
    ),
    newsIds: trend.newsIds.map((newsId) => newsId.trim()),
  };
}

function validateRecommendation(recommendation, index) {
  const field = `recommendations[${index}]`;

  assertResponse(
    isPlainObject(recommendation),
    `Missing or invalid ${field} in the projections response.`
  );

  return {
    title: requiredText(
      recommendation.title,
      `${field}.title`
    ),
    reason: requiredText(
      recommendation.reason,
      `${field}.reason`
    ),
  };
}

function validateOutlook(outlookItem, index, knownNewsIds, forecast) {
  const field = `outlook[${index}]`;

  assertResponse(
    isPlainObject(outlookItem),
    `Missing or invalid ${field} in the projections response.`
  );
  assertResponse(["baseline", "opportunity", "risk"].includes(outlookItem.scenario), `Invalid scenario in ${field}.`);
  assertResponse(outlookItem.horizonMonths === forecast.horizonMonths, `Invalid horizon in ${field}.`);
  for (const name of ["assumptions", "signals"]) {
    assertResponse(Array.isArray(outlookItem[name]) && outlookItem[name].length > 0 && outlookItem[name].every(isNonEmptyString), `Missing or invalid ${field}.${name}.`);
  }
  assertResponse(Array.isArray(outlookItem.newsIds) && outlookItem.newsIds.length > 0 && outlookItem.newsIds.every((id) => knownNewsIds.has(id)), `Invalid supporting newsIds in ${field}.`);

  return {
    scenario: outlookItem.scenario,
    horizonMonths: outlookItem.horizonMonths,
    assumptions: outlookItem.assumptions.map((text) => text.trim()),
    signals: outlookItem.signals.map((text) => text.trim()),
    newsIds: [...new Set(outlookItem.newsIds)],
    title: requiredText(outlookItem.title, `${field}.title`),
    rationale: requiredText(
      outlookItem.rationale,
      `${field}.rationale`
    ),
    uncertainty: requiredText(
      outlookItem.uncertainty,
      `${field}.uncertainty`
    ),
  };
}

export function validateResponse(
  responseData,
  language,
  news,
  coverage,
  forecast
) {
  const response = unwrapResponse(responseData);

  assertResponse(
    isPlainObject(response),
    "The projections response must be a JSON object."
  );
  assertResponse(
    response.language === language,
    "The projections response language does not match the requested language."
  );
  assertResponse(
    Array.isArray(response.trends),
    "Missing or invalid trends in the projections response."
  );
  assertResponse(
    Array.isArray(response.recommendations),
    "Missing or invalid recommendations in the projections response."
  );
  assertResponse(
    Array.isArray(response.outlook),
    "Missing or invalid outlook in the projections response."
  );
  assertResponse(
    Array.isArray(response.limitations) &&
      response.limitations.every(isNonEmptyString),
    "Missing or invalid limitations in the projections response."
  );
  assertResponse(
    response.outlook.length === 3 && new Set(response.outlook.map((item) => item?.scenario)).size === 3,
    "The response must include baseline, opportunity, and risk scenarios."
  );
  assertResponse(!coverage?.limitedEvidence || response.limitations.length > 0, "Limited evidence must be explained in limitations.");

  const knownNewsIds = new Set(
    news.map((newsItem) => newsItem.id)
  );

  return {
    language: response.language,
    title: requiredText(response.title, "title"),
    summary: requiredText(response.summary, "summary"),
    trends: response.trends.map((trend, index) =>
      validateTrend(trend, index, knownNewsIds)
    ),
    recommendations: response.recommendations.map(
      validateRecommendation
    ),
    outlook: response.outlook.map((item, index) => validateOutlook(item, index, knownNewsIds, forecast)),
    forecast: { ...forecast },
    limitations: response.limitations.map((limitation) =>
      limitation.trim()
    ),
  };
}

function createRequestSignal(callerSignal) {
  const controller = new AbortController();
  let timedOut = false;

  function abortFromCaller() {
    controller.abort(callerSignal?.reason);
  }

  if (callerSignal) {
    if (callerSignal.aborted) {
      abortFromCaller();
    } else {
      callerSignal.addEventListener(
        "abort",
        abortFromCaller,
        { once: true }
      );
    }
  }

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      callerSignal?.removeEventListener(
        "abort",
        abortFromCaller
      );
    },
  };
}

async function readResponse(response) {
  const text = await response.text();

  if (!response.ok) {
    let errorData = text;

    try {
      errorData = text ? JSON.parse(text) : null;
    } catch {
      // La respuesta HTTP no tiene por qué ser JSON cuando falla.
    }

    throw new ProjectionsServiceError(
      Object.values(PROJECTIONS_ERROR_CODES).includes(errorData?.code)
        ? errorData.code
        : PROJECTIONS_ERROR_CODES.HTTP,
      {
        detail:
          getDetail(errorData) ||
          `HTTP ${response.status}`,
        status: response.status,
        isTimeout: errorData?.isTimeout === true,
      }
    );
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new ProjectionsServiceError(
      PROJECTIONS_ERROR_CODES.INVALID_RESPONSE,
      {
        detail:
          "The projections response is not valid JSON.",
        status: response.status,
      }
    );
  }
}

export const projectionsService = {
  async generateAnalysis(request, signal) {
    validateRequest(request);

    const requestSignal = createRequestSignal(signal);

    try {
      const response = await fetch(PROJECTIONS_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: requestSignal.signal,
      });

      const responseData = await readResponse(response);

      return validateResponse(
        responseData,
        request.language,
        request.news,
        request.coverage,
        request.forecast
      );
    } catch (error) {
      if (error instanceof ProjectionsServiceError) {
        throw error;
      }

      if (signal?.aborted && !requestSignal.timedOut()) {
        throw error;
      }

      if (requestSignal.timedOut()) {
        throw new ProjectionsServiceError(
          PROJECTIONS_ERROR_CODES.NETWORK,
          {
            detail:
              `The projections request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
            cause: error,
            isTimeout: true,
          }
        );
      }

      throw new ProjectionsServiceError(
        PROJECTIONS_ERROR_CODES.NETWORK,
        {
          detail: getDetail(error) || "Network request failed.",
          cause: error,
        }
      );
    } finally {
      requestSignal.cleanup();
    }
  },
};
