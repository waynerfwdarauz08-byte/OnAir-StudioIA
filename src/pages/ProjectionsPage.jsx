import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import { aiService } from "../services/aiService.js";
import { newsService } from "../services/newsService.js";

import useAccessibility from "../hooks/useAccessibility.js";

const MAX_NEWS_CONTEXT = 25;

function getMonthKey(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey, language) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "es-CR",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function getProjectionError(error, isEnglish) {
  const detail = String(error?.message || "").trim();

  return {
    title: isEnglish
      ? "The AI projection could not be generated."
      : "No fue posible generar la proyección con IA.",
    detail,
  };
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getFactors(result) {
  const source =
    result.keyFactors ||
    result.factors ||
    result.signals ||
    result.keySignals;

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      return getText(
        item?.label || item?.title || item?.description
      );
    })
    .filter(Boolean);
}

function normalizeProjection(result) {
  return {
    title: getText(result.title),
    summary: getText(
      result.summary ||
        result.projection ||
        result.overview
    ),
    analysis: getText(
      result.script ||
        result.analysis ||
        result.recommendations
    ),
    factors: getFactors(result),
  };
}

function buildProjectionRequest(
  monthlyNews,
  monthLabel,
  language
) {
  const languageName = language === "en" ? "English" : "Spanish";
  const context = monthlyNews
    .slice(0, MAX_NEWS_CONTEXT)
    .map((newsItem, index) => {
      const title = getText(newsItem.title);
      const summary = getText(newsItem.summary);
      const source = getText(newsItem.sourceText);

      return [
        `${index + 1}. ${title || "Untitled story"}`,
        summary && `Summary: ${summary}`,
        source && `Source information: ${source}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return {
    task: "monthly-editorial-projection",
    sourceName: `Monthly editorial data: ${monthLabel}`,
    sourceUrl: "",
    sourceText: context,
    tone: "informative",
    targetDurationSeconds: 60,
    outputLanguage: language,
    instructions:
      `Analyze the following newsroom stories from ${monthLabel}. ` +
      `Prepare an editorial projection in ${languageName}. ` +
      "Use only the supplied information, clearly distinguish inference from fact, and do not invent events or statistics. " +
      "Return JSON with title, summary, script, and keyFactors (an array of concise signals).",
  };
}

function ProjectionsPage() {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const requestControllerRef = useRef(null);

  const [news, setNews] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [generationError, setGenerationError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await newsService.getAll(controller.signal);

        if (!controller.signal.aborted) {
          setNews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            String(error?.message || "").trim()
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  const availableMonths = useMemo(() => {
    const monthKeys = new Set();

    news.forEach((newsItem) => {
      const monthKey = getMonthKey(
        newsItem.createdAt || newsItem.updatedAt
      );

      if (monthKey) {
        monthKeys.add(monthKey);
      }
    });

    return [...monthKeys].sort((first, second) =>
      second.localeCompare(first)
    );
  }, [news]);

  useEffect(() => {
    setSelectedMonth((currentMonth) => {
      if (!availableMonths.length) {
        return "";
      }

      return availableMonths.includes(currentMonth)
        ? currentMonth
        : availableMonths[0];
    });
  }, [availableMonths]);

  const monthlyNews = useMemo(
    () =>
      news.filter(
        (newsItem) =>
          getMonthKey(
            newsItem.createdAt || newsItem.updatedAt
          ) === selectedMonth
      ),
    [news, selectedMonth]
  );

  const selectedMonthLabel = selectedMonth
    ? formatMonthLabel(selectedMonth, language)
    : "";

  const visibleNews = monthlyNews.slice(
    0,
    MAX_NEWS_CONTEXT
  );
  const hiddenNewsCount = Math.max(
    monthlyNews.length - visibleNews.length,
    0
  );

  async function handleGenerate() {
    if (!selectedMonth || monthlyNews.length === 0) {
      return;
    }

    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setGenerating(true);
    setGenerationError(null);
    setProjection(null);

    try {
      const result =
        await aiService.generateEditorialContent(
          buildProjectionRequest(
            monthlyNews,
            selectedMonthLabel,
            language
          ),
          controller.signal
        );

      if (!controller.signal.aborted) {
        setProjection(normalizeProjection(result));
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setGenerationError(
          getProjectionError(error, isEnglish)
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setGenerating(false);
      }
    }
  }

  function handleMonthChange(event) {
    setSelectedMonth(event.target.value);
    setProjection(null);
    setGenerationError(null);
  }

  const loadErrorMessage = loadError
    ? isEnglish
      ? `Unable to load the monthly news. Details: ${loadError}`
      : `No fue posible cargar las noticias mensuales. Detalle: ${loadError}`
    : "";

  return (
    <>
      <PageHeader
        eyebrow={
          isEnglish
            ? "ADMINISTRATOR TOOLS"
            : "HERRAMIENTAS DE ADMINISTRACIÓN"
        }
        title={
          isEnglish
            ? "Monthly projections"
            : "Proyecciones mensuales"
        }
        description={
          isEnglish
            ? "Use the news registered each month as context for an AI-assisted editorial projection."
            : "Usa las noticias registradas cada mes como contexto para una proyección editorial asistida por IA."
        }
      />

      {loading && (
        <LoadingState
          message={
            isEnglish
              ? "Loading monthly editorial data..."
              : "Cargando los datos editoriales mensuales..."
          }
        />
      )}

      {!loading && loadError && (
        <ErrorState
          message={loadErrorMessage}
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && !loadError && (
        <div className="projections-workspace">
          <section
            className="projections-source-card"
            aria-labelledby="projections-source-title"
          >
            <header className="projections-source-heading">
              <div>
                <p className="eyebrow">
                  {isEnglish
                    ? "MONTHLY NEWS INPUT"
                    : "ENTRADA DE NOTICIAS MENSUALES"}
                </p>

                <h2 id="projections-source-title">
                  {isEnglish
                    ? "Choose the analysis period"
                    : "Selecciona el periodo de análisis"}
                </h2>

                <p>
                  {isEnglish
                    ? "The projection uses the stories registered during the selected month. Original stories are never edited or translated."
                    : "La proyección utiliza las noticias registradas durante el mes seleccionado. Las noticias originales no se editan ni se traducen."}
                </p>
              </div>

              <span className="projections-source-badge">
                {isEnglish ? "AI CONTEXT" : "CONTEXTO IA"}
              </span>
            </header>

            <div className="projections-controls">
              <div className="form-field">
                <label htmlFor="projections-month">
                  {isEnglish ? "Month" : "Mes"}
                </label>

                <select
                  id="projections-month"
                  value={selectedMonth}
                  disabled={!availableMonths.length || generating}
                  aria-describedby="projections-month-help"
                  onChange={handleMonthChange}
                >
                  {!availableMonths.length && (
                    <option value="">
                      {isEnglish
                        ? "No months available"
                        : "No hay meses disponibles"}
                    </option>
                  )}

                  {availableMonths.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {formatMonthLabel(monthKey, language)}
                    </option>
                  ))}
                </select>

                <small id="projections-month-help">
                  {isEnglish
                    ? "Only records with a valid creation date are included."
                    : "Solo se incluyen registros con una fecha de creación válida."}
                </small>
              </div>

              <div className="projections-source-stat">
                <span>
                  {isEnglish ? "STORIES INCLUDED" : "NOTICIAS INCLUIDAS"}
                </span>
                <strong>{monthlyNews.length}</strong>
              </div>

              <button
                className="button button-primary"
                type="button"
                disabled={generating || monthlyNews.length === 0}
                aria-busy={generating}
                onClick={handleGenerate}
              >
                {generating
                  ? isEnglish
                    ? "Generating projection..."
                    : "Generando proyección..."
                  : isEnglish
                    ? "Generate with AI"
                    : "Generar con IA"}
              </button>
            </div>

            {monthlyNews.length === 0 ? (
              <div className="projections-empty-month" role="status">
                <strong>
                  {isEnglish
                    ? "There are no news stories for this month."
                    : "No hay noticias registradas para este mes."}
                </strong>
                <p>
                  {isEnglish
                    ? "Select another period or register news before creating a projection."
                    : "Selecciona otro periodo o registra noticias antes de crear una proyección."}
                </p>
              </div>
            ) : (
              <div
                className="projections-news-context"
                aria-label={
                  isEnglish
                    ? "News stories used as AI context"
                    : "Noticias utilizadas como contexto para la IA"
                }
              >
                <h3>
                  {isEnglish
                    ? "News used as context"
                    : "Noticias usadas como contexto"}
                </h3>

                <ol>
                  {visibleNews.map((newsItem) => (
                    <li key={newsItem.id}>
                      {newsItem.title ||
                        (isEnglish
                          ? "Untitled story"
                          : "Noticia sin título")}
                    </li>
                  ))}
                </ol>

                {hiddenNewsCount > 0 && (
                  <p>
                    {isEnglish
                      ? `${hiddenNewsCount} additional stories will also be considered.`
                      : `También se considerarán ${hiddenNewsCount} noticias adicionales.`}
                  </p>
                )}
              </div>
            )}
          </section>

          {generating && (
            <section
              className="projections-generating-state"
              role="status"
              aria-live="polite"
            >
              <span
                className="projections-generating-mark"
                aria-hidden="true"
              >
                IA
              </span>

              <div>
                <h2>
                  {isEnglish
                    ? "Building the monthly projection"
                    : "Construyendo la proyección mensual"}
                </h2>
                <p>
                  {isEnglish
                    ? "The configured AI service is identifying editorial signals in the selected stories."
                    : "El servicio de IA configurado está identificando señales editoriales en las noticias seleccionadas."}
                </p>
              </div>
            </section>
          )}

          {generationError && (
            <section
              className="projections-generation-error"
              role="alert"
            >
              <strong>{generationError.title}</strong>
              {generationError.detail && (
                <p>{generationError.detail}</p>
              )}
            </section>
          )}

          {projection && !generating && (
            <section
              className="projection-result-card"
              aria-labelledby="projection-result-title"
            >
              <header className="projection-result-heading">
                <div>
                  <p className="eyebrow">
                    {isEnglish
                      ? "AI-ASSISTED PROJECTION"
                      : "PROYECCIÓN ASISTIDA POR IA"}
                  </p>
                  <h2 id="projection-result-title">
                    {projection.title}
                  </h2>
                </div>

                <span className="projection-result-period">
                  {selectedMonthLabel}
                </span>
              </header>

              {projection.summary && (
                <div className="projection-summary">
                  <h3>
                    {isEnglish ? "Overview" : "Panorama"}
                  </h3>
                  <p>{projection.summary}</p>
                </div>
              )}

              {projection.analysis && (
                <div className="projection-analysis">
                  <h3>
                    {isEnglish
                      ? "Editorial projection"
                      : "Proyección editorial"}
                  </h3>
                  <p>{projection.analysis}</p>
                </div>
              )}

              {projection.factors.length > 0 && (
                <div className="projection-factors">
                  <h3>
                    {isEnglish
                      ? "Signals identified by AI"
                      : "Señales identificadas por IA"}
                  </h3>
                  <ul>
                    {projection.factors.map((factor, index) => (
                      <li key={`${factor}-${index}`}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="projection-disclaimer">
                {isEnglish
                  ? "This is an editorial aid based on the selected records. Verify conclusions before using them in programming or coverage decisions."
                  : "Esta es una ayuda editorial basada en los registros seleccionados. Verifica las conclusiones antes de utilizarlas en decisiones de programación o cobertura."}
              </p>
            </section>
          )}
        </div>
      )}
    </>
  );
}

export default ProjectionsPage;
