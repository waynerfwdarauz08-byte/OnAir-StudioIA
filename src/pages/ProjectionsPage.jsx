import useTranslation from "../hooks/useTranslation.js";
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

import { projectionsService, getProjectionsErrorMessage } from "../services/projectionsService.js";
import { newsService } from "../services/newsService.js";
import { categoryService } from "../services/categoryService.js";
import { rundownService } from "../services/rundownService.js";
import { transmissionService } from "../services/transmissionService.js";
import { buildMonthlySnapshot, buildProjectionRequest, formatMonthLabel, getMonthKey, PROJECTION_HORIZONS } from "../utils/projections.js";

import useAccessibility from "../hooks/useAccessibility.js";
import useAuth from "../hooks/useAuth.js";
import { savedContentService } from "../services/savedContentService.js";
import "../styles/saved-content.css";

function ProjectionsPage() {
  const { translate } = useTranslation();
  const { user } = useAuth();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const asOfMonth = getMonthKey(new Date().toISOString());

  const requestControllerRef = useRef(null);

  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rundowns, setRundowns] = useState([]);
  const [transmission, setTransmission] = useState(null);
  const [sourceWarnings, setSourceWarnings] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [forecastHorizon, setForecastHorizon] = useState(6);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [generationError, setGenerationError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [unsaved, setUnsaved] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError("");
    savedContentService.projections(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setHistory(sorted);
      const pending = sorted.find((item) => item.pending);
      if (pending) {
        setUnsaved(pending);
        setHistoryError("Hay un resultado guardado en este navegador pendiente de registrar en JSON Server. Reintenta el guardado.");
      }
      const restored = {};
      sorted.forEach((item) => { if (!restored[item.analysisKey]) restored[item.analysisKey] = item.result; });
      setAnalyses((previous) => ({ ...restored, ...previous }));
    }).catch((error) => {
      if (!controller.signal.aborted) setHistoryError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setLoadError("");

      try {
        const sources = await Promise.allSettled([
          newsService.getAll(controller.signal),
          categoryService.getAll(controller.signal),
          rundownService.getAll(controller.signal),
          transmissionService.getCurrent(controller.signal),
        ]);
        if (sources[0].status === "rejected") throw sources[0].reason;

        if (!controller.signal.aborted) {
          const data = sources[0].value;
          setNews(Array.isArray(data) ? data : []);
          setCategories(sources[1].status === "fulfilled" && Array.isArray(sources[1].value) ? sources[1].value : []);
          setRundowns(sources[2].status === "fulfilled" && Array.isArray(sources[2].value) ? sources[2].value : []);
          setTransmission(sources[3].status === "fulfilled" ? sources[3].value : null);
          setSourceWarnings(["categories", "rundowns", "transmission"].filter((ignored, index) => sources[index + 1].status === "rejected"));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            String(error?.message || "Local data request failed").trim()
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
    requestControllerRef.current?.abort();
    setGenerating(false);
    setGenerationError(null);
    return () => requestControllerRef.current?.abort();
  }, [selectedMonth, language, forecastHorizon, asOfMonth, reloadKey]);

  const availableMonths = useMemo(() => {
    const monthKeys = new Set([getMonthKey(new Date().toISOString())]);
    history.forEach((item) => monthKeys.add(item.month));

    news.forEach((newsItem) => {
      const monthKey = getMonthKey(
        newsItem.createdAt
      );

      if (monthKey) {
        monthKeys.add(monthKey);
      }
    });

    rundowns.forEach((item) => {
      const month = getMonthKey(item.broadcastDate);
      if (month) monthKeys.add(month);
    });
    return [...monthKeys].sort((first, second) =>
      second.localeCompare(first)
    );
  }, [news, rundowns, history]);

  useEffect(() => {
    if (loading) return;
    setSelectedMonth((currentMonth) => {
      if (!availableMonths.length) {
        return "";
      }

      return availableMonths.includes(currentMonth)
        ? currentMonth
        : availableMonths.find((month) => news.some((item) => getMonthKey(item.createdAt) === month)) || availableMonths[0];
    });
  }, [availableMonths, news, loading]);

  const snapshot = useMemo(() => buildMonthlySnapshot({ news, categories, rundowns, transmission }, selectedMonth), [news, categories, rundowns, transmission, selectedMonth]);
  const monthlyNews = snapshot.news;
  const request = buildProjectionRequest(snapshot, language, forecastHorizon, asOfMonth);
  if (sourceWarnings.includes("rundowns")) {
    request.statistics = { ...request.statistics, totalRundowns: null, scheduledNews: null };
  }
  const analysisKey = `${selectedMonth}:${language}:${forecastHorizon}:${asOfMonth}`;
  const projection = selectedHistory?.result || analyses[analysisKey] || null;
  const otherLanguageAnalysis = analyses[`${selectedMonth}:${isEnglish ? "es" : "en"}:${forecastHorizon}:${asOfMonth}`];
  const statusLabels = isEnglish
    ? { draft: "Draft", review: "Under review", correction: "Needs correction", approved: "Approved", unknown: "Unspecified" }
    : { draft: "Borrador", review: "En revisión", correction: "En corrección", approved: "Aprobadas", unknown: "Sin especificar" };

  const selectedMonthLabel = selectedMonth
    ? formatMonthLabel(selectedMonth, language)
    : "";

  const visibleNews = monthlyNews.slice(0, request.coverage.includedNews);
  const hiddenNewsCount = request.coverage.omittedNews;

  async function handleGenerate() {
    if (generating || !selectedMonth || monthlyNews.length === 0) {
      return;
    }

    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setGenerating(true);
    setGenerationError(null);
    setSelectedHistory(null);

    try {
      const result =
        await projectionsService.generateAnalysis(
          { ...request, coverage: { ...request.coverage, unavailableSources: sourceWarnings } },
          controller.signal
        );

      if (!controller.signal.aborted) {
        const savedResult = { ...result, generatedAt: new Date().toISOString(), coverage: request.coverage };
        setAnalyses((previous) => ({ ...previous, [analysisKey]: savedResult }));
        const entry = { id: crypto.randomUUID(), userId: user.id, analysisKey,
          month: selectedMonth, language, horizonMonths: forecastHorizon, asOfMonth,
          createdAt: savedResult.generatedAt, result: savedResult };
        setUnsaved(entry);
        try {
          // El guardado continúa aunque se cierre este módulo una vez obtenido el resultado.
          await savedContentService.saveProjection(entry);
          setHistory((items) => [entry, ...items]);
          setUnsaved(null);
          setHistoryError("");
        } catch (error) {
          setHistoryError(`El resultado se generó, pero no se pudo guardar: ${error.message}`);
        }
      }
    } catch (error) {
      if (!controller.signal.aborted && error.name !== "AbortError") {
        setGenerationError(error);
      }
    } finally {
      if (!controller.signal.aborted && requestControllerRef.current === controller) {
        setGenerating(false);
      }
    }
  }

  function handleMonthChange(event) {
    setSelectedHistory(null);
    setSelectedMonth(event.target.value);
    setGenerationError(null);
  }

  const loadErrorMessage = loadError
    ? isEnglish
      ? "Unable to load the monthly news. Check the local data connection and try again."
      : "No fue posible cargar las noticias mensuales. Revisa la conexión a los datos locales e inténtalo de nuevo."
    : "";

  return (
    <>
      <PageHeader
        eyebrow={isEnglish ? "ADMINISTRATOR TOOLS" : "HERRAMIENTAS DE ADMINISTRACIÓN"}
        title={isEnglish ? "Monthly projections" : "Proyecciones mensuales"}
        description={isEnglish ? "Analyze monthly records and explore possible developments six months ahead and beyond." : "Analiza los registros mensuales y explora posibles desarrollos a partir de seis meses hacia el futuro."}
      >
        <button className="button button-secondary" type="button" disabled={loading || generating} onClick={() => setReloadKey((value) => value + 1)}>
          {isEnglish ? "Refresh data" : "Actualizar datos"}
        </button>
      </PageHeader>
      <section className="saved-content" aria-labelledby="projection-history-title">
        <div className="saved-content-heading"><div>
          <h2 id="projection-history-title">{isEnglish ? "Projection history" : "Historial de proyecciones"}</h2>
          <p>{isEnglish ? "Generated results are saved automatically. Open an earlier result without querying AI again." : "Los resultados se guardan automáticamente. Abre una proyección anterior sin consultar otra vez a la IA."}</p>
        </div></div>
        {historyLoading && <p role="status">{isEnglish ? "Loading history..." : "Cargando historial..."}</p>}
        {historyError && <p className="form-alert" role="alert">{translate(historyError)}</p>}
        {unsaved && <button className="button button-secondary" disabled={generating} onClick={async () => {
          try {
            await savedContentService.saveProjection(unsaved);
            setHistory((items) => [unsaved, ...items.filter((item) => item.id !== unsaved.id)]);
            setUnsaved(null); setHistoryError("");
          } catch (error) { setHistoryError(error.message); }
        }}>{isEnglish ? "Retry saving result" : "Reintentar guardado del resultado"}</button>}
        {!historyLoading && !history.length && !historyError && <p>{isEnglish ? "Your generated projections will appear here." : "Tus proyecciones generadas aparecerán aquí."}</p>}
        <div className="saved-content-history">{history.map((item) => <button key={item.id} className="button button-secondary" disabled={generating} onClick={() => {
          setSelectedMonth(item.month); setForecastHorizon(item.horizonMonths); setSelectedHistory(item);
        }}>{formatMonthLabel(item.month, language)} · {item.horizonMonths} {isEnglish ? "months" : "meses"} · {item.language.toUpperCase()} · {new Date(item.createdAt).toLocaleString(isEnglish ? "en-US" : "es-CR")}</button>)}</div>
        {selectedHistory && <p role="status">{isEnglish ? "Viewing a saved result; it reflects the data available when it was generated." : "Estás viendo un resultado guardado; refleja los datos disponibles cuando se generó."} <button className="button button-secondary" onClick={() => setSelectedHistory(null)}>{isEnglish ? "Return to current analysis" : "Volver al análisis actual"}</button></p>}
      </section>
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

      {!loading && loadError && (
        <details className="projections-technical-detail"><summary>{isEnglish ? "Technical details" : "Detalles técnicos"}</summary><p>{loadError}</p></details>
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
                    ? "01 / PERIOD & SOURCES"
                    : "01 / PERIODO Y FUENTES"}
                </p>

                <h2 id="projections-source-title">
                  {isEnglish
                    ? "Choose the analysis period"
                    : "Selecciona el periodo de análisis"}
                </h2>

                <p>
                  {isEnglish
                    ? "News is grouped by its creation date in Costa Rica. Rundowns use their scheduled broadcast date; editorial statuses reflect their current state."
                    : "Las noticias se agrupan por su fecha de creación en Costa Rica. Las escaletas usan su fecha programada de transmisión; los estados editoriales reflejan su situación actual."}
                </p>
              </div>

              <span className="projections-source-badge">
                {isEnglish ? "LOCAL RECORDS" : "REGISTROS LOCALES"}
              </span>
            </header>

            <div className="projections-controls">
              <div className="form-field">
                <label htmlFor="projections-month">
                  {isEnglish ? "Source month" : "Mes de los datos"}
                </label>

                <select
                  id="projections-month"
                  value={selectedMonth}
                  disabled={!availableMonths.length}
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
                    ? "The period is the registration month, not necessarily the date of the event."
                    : "El periodo corresponde al mes de registro, no necesariamente a la fecha del suceso."}
                </small>
              </div>

              <div className="form-field">
                <label htmlFor="projections-horizon">{isEnglish ? "Future horizon" : "Horizonte futuro"}</label>
                <select id="projections-horizon" value={forecastHorizon} aria-describedby="projections-horizon-help" onChange={(event) => { setSelectedHistory(null); setForecastHorizon(Number(event.target.value)); }}>
                  {PROJECTION_HORIZONS.map((months) => <option value={months} key={months}>{isEnglish ? `${months} months ahead` : `${months} meses adelante`}</option>)}
                </select>
                <small id="projections-horizon-help">{isEnglish ? "Counted from the current month, independently of the source month." : "Se cuenta desde el mes actual, independientemente del mes de los datos."}</small>
              </div>

              <div className="projections-source-stat">
                <span>{isEnglish ? "PREVIOUS MONTH" : "MES ANTERIOR"}</span>
                <strong>{snapshot.previousPeriod ? snapshot.previousPeriod.totalNews : "—"}</strong>
                <small>{snapshot.previousPeriod ? formatMonthLabel(snapshot.previousPeriod.month, language) : isEnglish ? "No comparative records" : "Sin registros comparables"}</small>
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
                    ? projection ? "Update AI analysis" : "Generate AI analysis"
                    : projection ? "Actualizar análisis IA" : "Generar análisis IA"}
              </button>
            </div>

            <p className="projections-source-note">{isEnglish ? `Future scenarios: ${formatMonthLabel(request.forecast.asOfMonth, language)} to ${formatMonthLabel(request.forecast.targetMonth, language)}. Possibilities depend on the stated assumptions; longer horizons increase uncertainty.` : `Escenarios futuros: de ${formatMonthLabel(request.forecast.asOfMonth, language)} a ${formatMonthLabel(request.forecast.targetMonth, language)}. Las posibilidades dependen de los supuestos indicados; a mayor plazo, mayor incertidumbre.`}</p>

            <div className="projections-metrics" aria-label={isEnglish ? "Monthly indicators" : "Indicadores mensuales"}>
              {[
                { label: isEnglish ? "News registered" : "Noticias registradas", value: monthlyNews.length, detail: isEnglish ? `${snapshot.statistics.activeDays} registration days` : `${snapshot.statistics.activeDays} días con registros` },
                { label: isEnglish ? "Approved now" : "Aprobadas actualmente", value: snapshot.statistics.editorialStatuses.approved, detail: isEnglish ? "Current editorial status" : "Estado editorial actual" },
                { label: isEnglish ? "Categories covered" : "Categorías cubiertas", value: snapshot.categoryDistribution.filter((item) => item.id !== "unassigned").length, detail: isEnglish ? "From this month's records" : "En los registros de este mes" },
                { label: isEnglish ? "Scheduled rundowns" : "Escaletas programadas", value: sourceWarnings.includes("rundowns") ? "—" : snapshot.rundowns.length, detail: sourceWarnings.includes("rundowns") ? isEnglish ? "Source unavailable" : "Fuente no disponible" : isEnglish ? `${snapshot.statistics.scheduledNews} monthly stories included` : `${snapshot.statistics.scheduledNews} noticias del mes incluidas` },
              ].map((metric) => (
                <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>
              ))}
            </div>

            {sourceWarnings.length > 0 && (
              <div className="projections-data-notice" role="status">
                <strong>{isEnglish ? "Some sources could not be loaded" : "Algunas fuentes no se pudieron cargar"}</strong>
                <p>{isEnglish ? "The analysis will use the available sources only: missing data is not counted as zero." : "El análisis usará únicamente las fuentes disponibles: los datos faltantes no se cuentan como cero."} {sourceWarnings.map((source) => ({ categories: isEnglish ? "Categories" : "Categorías", rundowns: isEnglish ? "Rundowns" : "Escaletas", transmission: isEnglish ? "Current transmission" : "Transmisión actual" }[source])).join(" · ")}</p>
              </div>
            )}

            {monthlyNews.length > 0 && (
              <>
                <div className="projections-breakdowns">
                  <section aria-labelledby="projection-status-title">
                    <h3 id="projection-status-title">{isEnglish ? "Editorial readiness" : "Preparación editorial"}</h3>
                    <p>{isEnglish ? "Status of the stories registered this month." : "Estado de las noticias registradas este mes."}</p>
                    {Object.entries(snapshot.statistics.editorialStatuses).filter(([status, count]) => status !== "unknown" || count > 0).map(([status, count]) => (
                      <div className={`projection-distribution-row projection-distribution-${status}`} key={status}>
                        <span>{statusLabels[status]}</span><strong>{count}</strong>
                        <progress value={count} max={monthlyNews.length} aria-label={statusLabels[status]} />
                      </div>
                    ))}
                  </section>
                  <section aria-labelledby="projection-categories-title">
                    <h3 id="projection-categories-title">{isEnglish ? "Coverage by category" : "Cobertura por categoría"}</h3>
                    <p>{isEnglish ? "Category names come from the local records." : "Los nombres de categorías provienen de los registros locales."}</p>
                    {snapshot.categoryDistribution.map((category) => (
                      <div className="projection-distribution-row" key={category.id}>
                        <span>{category.name || (category.id === "unassigned" ? isEnglish ? "Unassigned" : "Sin categoría" : isEnglish ? "Category unavailable" : "Categoría no disponible")}</span><strong>{category.count}</strong>
                        <progress value={category.count} max={monthlyNews.length} aria-label={category.name || (isEnglish ? "Category count" : "Cantidad por categoría")} />
                      </div>
                    ))}
                  </section>
                </div>

                {snapshot.limitedEvidence && (
                  <div className="projections-data-notice" role="status">
                    <strong>{isEnglish ? "Limited evidence for projections" : "Evidencia limitada para proyectar"}</strong>
                    <p>{isEnglish ? "The sample is limited. Future scenarios are exploratory possibilities with high uncertainty, based on explicit assumptions; they are not verified forecasts or numerical predictions." : "La muestra es limitada. Los escenarios futuros son posibilidades exploratorias de alta incertidumbre, basadas en supuestos explícitos; no son pronósticos verificados ni predicciones numéricas."}</p>
                  </div>
                )}
              </>
            )}

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
              <details
                className="projections-news-context"
                aria-label={
                  isEnglish
                    ? "News stories used as AI context"
                    : "Noticias utilizadas como contexto para la IA"
                }
              >
                <summary>
                  {isEnglish
                    ? "News used as context"
                    : "Noticias usadas como contexto"}
                  {" "}<span>{request.coverage.includedNews} / {monthlyNews.length}</span>
                </summary>

                <p>{isEnglish ? `Statistics cover all ${monthlyNews.length} records. AI receives the first ${request.coverage.includedNews} stories ordered by creation date, with titles and summaries or source excerpts.` : `Los indicadores cubren los ${monthlyNews.length} registros. La IA recibe las primeras ${request.coverage.includedNews} noticias ordenadas por fecha de creación, con títulos y resúmenes o extractos de fuente.`}</p>

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
                      ? `${hiddenNewsCount} stories are represented in the statistics only; their text is not sent to AI.`
                      : `${hiddenNewsCount} noticias están representadas solo en los indicadores; su texto no se envía a la IA.`}
                  </p>
                )}
                {request.coverage.truncatedFields > 0 && <p>{isEnglish ? `${request.coverage.truncatedFields} text fields were shortened for the analysis.` : `${request.coverage.truncatedFields} campos de texto se acortaron para el análisis.`}</p>}
                {snapshot.excludedUndatedNews > 0 && <p>{isEnglish ? `${snapshot.excludedUndatedNews} records without a valid creation date were excluded from monthly totals.` : `${snapshot.excludedUndatedNews} registros sin fecha de creación válida se excluyeron de los totales mensuales.`}</p>}
              </details>
            )}

            {snapshot.transmission && (
              <p className="projections-source-note">{snapshot.transmission.onAir ? isEnglish ? "Current transmission: on air." : "Transmisión actual: al aire." : isEnglish ? "Current transmission: off air." : "Transmisión actual: fuera del aire."} {isEnglish ? "Only the current state is available; it is not a monthly broadcast history and is excluded from projection statistics." : "Solo está disponible el estado actual; no es un historial mensual de transmisiones y se excluye de los indicadores de proyección."}</p>
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
                {isEnglish ? "AI" : "IA"}
              </span>

              <div>
                <h2>
                  {isEnglish
                    ? "Analyzing the monthly records"
                    : "Analizando los registros mensuales"}
                </h2>
                <p>
                  {isEnglish
                    ? "Gemini is analyzing the selected records to identify editorial signals and recommendations."
                    : "Gemini está analizando los registros seleccionados para identificar señales y recomendaciones editoriales."}
                </p>
                <button type="button" className="button button-secondary" onClick={() => {
                  requestControllerRef.current?.abort();
                  setGenerating(false);
                }}>{isEnglish ? "Cancel analysis" : "Cancelar análisis"}</button>
              </div>
            </section>
          )}

          {generationError && (
            <section
              className="projections-generation-error"
              role="alert"
            >
              <strong>{isEnglish ? "Analysis could not be completed" : "No se pudo completar el análisis"}</strong>
              <p>{getProjectionsErrorMessage(generationError, language)}</p>
              {generationError.detail && <details className="projections-technical-detail"><summary>{isEnglish ? "Technical details" : "Detalles técnicos"}</summary><p>{generationError.detail}</p></details>}
              <button type="button" className="button button-secondary" disabled={generating || monthlyNews.length === 0} onClick={handleGenerate}>{isEnglish ? "Try again" : "Intentar nuevamente"}</button>
            </section>
          )}

          {!projection && !generating && monthlyNews.length > 0 && !generationError && (
            <section className="projection-analysis-ready" aria-labelledby="projection-ready-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 18V6m0 12h16M8 14l4-4 4 2 4-6"/><path d="M16 6h4v4"/></svg>
              <div><p className="eyebrow">{isEnglish ? "02 / AI ANALYSIS" : "02 / ANÁLISIS IA"}</p><h2 id="projection-ready-title">{isEnglish ? "From records to editorial decisions" : "De los registros a las decisiones editoriales"}</h2><p>{otherLanguageAnalysis ? isEnglish ? "An analysis exists in Spanish. Generate the English version to read it in your selected language." : "Existe un análisis en inglés. Genera la versión en español para leerlo en el idioma seleccionado." : isEnglish ? "Generate an overview, evidence-backed signals, and coverage suggestions for the selected month." : "Genera un panorama, señales respaldadas por registros y sugerencias de cobertura para el mes seleccionado."}</p></div>
            </section>
          )}

          {projection && (
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

              <div className="projection-result-status" role="status">
                <span>{isEnglish ? "Analysis ready" : "Análisis disponible"}</span>
                <time dateTime={projection.generatedAt}>{new Intl.DateTimeFormat(isEnglish ? "en-US" : "es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(new Date(projection.generatedAt))}</time>
                <small>{isEnglish ? `${projection.coverage.includedNews} stories sent · ${projection.coverage.totalNews} records in the indicators` : `${projection.coverage.includedNews} noticias enviadas · ${projection.coverage.totalNews} registros en los indicadores`}</small>
              </div>

              {projection.summary && (
                <div className="projection-summary">
                  <h3>
                    {isEnglish ? "Overview" : "Panorama"}
                  </h3>
                  <p>{projection.summary}</p>
                </div>
              )}

              <div className="projection-result-sections">
                <section className="projection-analysis" aria-labelledby="projection-trends-title">
                  <h3 id="projection-trends-title">{isEnglish ? "Observed signals" : "Señales observadas"}</h3>
                  {projection.trends.length === 0 ? <p>{isEnglish ? "No trends could be established from this sample." : "No se pudieron establecer tendencias a partir de esta muestra."}</p> : <ol className="projection-insight-list">{projection.trends.map((trend, index) => <li key={index}><h4>{trend.title}</h4><p>{trend.evidence}</p><details><summary>{isEnglish ? "Supporting records" : "Registros de respaldo"}</summary><ul>{trend.newsIds.map((id) => <li key={id}>{monthlyNews.find((item) => item.id === id)?.title || id}</li>)}</ul></details></li>)}</ol>}
                </section>
                <section className="projection-analysis" aria-labelledby="projection-recommendations-title">
                  <h3 id="projection-recommendations-title">{isEnglish ? "Editorial recommendations" : "Recomendaciones editoriales"}</h3>
                  {projection.recommendations.length === 0 ? <p>{isEnglish ? "No specific recommendations were generated." : "No se generaron recomendaciones específicas."}</p> : <ol className="projection-insight-list">{projection.recommendations.map((item, index) => <li key={index}><h4>{item.title}</h4><p>{item.reason}</p></li>)}</ol>}
                </section>
              </div>

              <section className="projection-analysis" aria-labelledby="projection-outlook-title">
                <h3 id="projection-outlook-title">{isEnglish ? `Future projections · ${projection.forecast.horizonMonths} months` : `Proyecciones futuras · ${projection.forecast.horizonMonths} meses`}</h3>
                <p className="projections-source-note">{formatMonthLabel(projection.forecast.asOfMonth, language)} — {formatMonthLabel(projection.forecast.targetMonth, language)}. {isEnglish ? "Conditional scenarios, not guaranteed outcomes." : "Escenarios condicionados, no resultados garantizados."}</p>
                <ol className="projection-insight-list">
                  {projection.outlook.map((item) => (
                    <li key={item.scenario}>
                      <small>{({ baseline: isEnglish ? "Continuation scenario" : "Escenario de continuidad", opportunity: isEnglish ? "Opportunity scenario" : "Escenario de oportunidad", risk: isEnglish ? "Risk scenario" : "Escenario de riesgo" })[item.scenario]}</small>
                      <h4>{item.title}</h4><p>{item.rationale}</p>
                      <small>{isEnglish ? "Uncertainty: " : "Incertidumbre: "}{item.uncertainty}</small>
                      <details><summary>{isEnglish ? "Assumptions and signals to monitor" : "Supuestos y señales para observar"}</summary>
                        <h4>{isEnglish ? "Assumptions" : "Supuestos"}</h4><ul>{item.assumptions.map((text, index) => <li key={index}>{text}</li>)}</ul>
                        <h4>{isEnglish ? "Signals to monitor" : "Señales para observar"}</h4><ul>{item.signals.map((text, index) => <li key={index}>{text}</li>)}</ul>
                        <h4>{isEnglish ? "Supporting records" : "Registros de respaldo"}</h4><ul>{item.newsIds.map((id) => <li key={id}>{monthlyNews.find((story) => story.id === id)?.title || id}</li>)}</ul>
                      </details>
                    </li>
                  ))}
                </ol>
              </section>

              {projection.limitations.length > 0 && <aside className="projection-limitations"><h3>{isEnglish ? "Limits of this analysis" : "Límites de este análisis"}</h3><ul>{projection.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></aside>}

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
