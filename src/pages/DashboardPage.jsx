import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import EditorialStatusChart from "../components/dashboard/EditorialStatusChart.jsx";
import WeatherCard from "../components/dashboard/WeatherCard.jsx";
import CategoryDistributionChart from "../components/dashboard/CategoryDistributionChart.jsx";
import ContentVolumeChart from "../components/dashboard/ContentVolumeChart.jsx";
import RundownCoverageChart from "../components/dashboard/RundownCoverageChart.jsx";

import { newsService } from "../services/newsService.js";
import { userService } from "../services/userService.js";
import { rundownService } from "../services/rundownService.js";
import { weatherService } from "../services/weatherService.js";
import { categoryService } from "../services/categoryService.js";

import useAccessibility from "../hooks/useAccessibility.js";

function DashboardPage() {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [rundowns, setRundowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [weatherReloadKey, setWeatherReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [newsData, usersData, rundownsData, categoriesData] =
          await Promise.all([
            newsService.getAll(controller.signal),
            userService.getAll(controller.signal),
            rundownService.getAll(controller.signal),
            categoryService.getAll(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setNews(Array.isArray(newsData) ? newsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setRundowns(
          Array.isArray(rundownsData) ? rundownsData : []
        );
        setCategories(
          Array.isArray(categoriesData) ? categoriesData : []
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              (isEnglish
                ? "Could not load the dashboard."
                : "No fue posible cargar el panel.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [reloadKey, isEnglish]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");

      try {
        const weatherData = await weatherService.getCurrent(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setWeather(weatherData);
        }
      } catch (loadError) {
        if (
          !controller.signal.aborted &&
          loadError.name !== "AbortError"
        ) {
          setWeatherError(
            loadError.message ||
              (isEnglish
                ? "Could not load the weather."
                : "No fue posible consultar el clima.")
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => controller.abort();
  }, [weatherReloadKey, isEnglish]);

  const approvedNews = news.filter(
    (newsItem) => newsItem.editorialStatus === "approved"
  ).length;

  const reviewNews = news.filter(
    (newsItem) => newsItem.editorialStatus === "review"
  ).length;

  const activeUsers = users.filter(
    (user) => user.active
  ).length;

  const metrics = isEnglish
    ? [
        {
          id: "news",
          label: "Registered news",
          value: news.length,
          detail: "Editorial content",
          color: "cyan",
        },
        {
          id: "review",
          label: "Under review",
          value: reviewNews,
          detail: "Waiting for approval",
          color: "amber",
        },
        {
          id: "approved",
          label: "Approved",
          value: approvedNews,
          detail: "Ready for a rundown",
          color: "green",
        },
      ]
    : [
        {
          id: "news",
          label: "Noticias registradas",
          value: news.length,
          detail: "Contenido editorial",
          color: "cyan",
        },
        {
          id: "review",
          label: "En revisión",
          value: reviewNews,
          detail: "Pendientes de aprobación",
          color: "amber",
        },
        {
          id: "approved",
          label: "Aprobadas",
          value: approvedNews,
          detail: "Preparadas para escaleta",
          color: "green",
        },
      ];

  return (
    <main className="dashboard-page">
      <div className="dashboard-newsroom-backdrop" aria-hidden="true">
        <svg className="dashboard-newsroom-icon dashboard-newsroom-mic" viewBox="0 0 96 120" fill="none">
          <rect x="34" y="10" width="28" height="58" rx="14" />
          <path d="M23 48v7a25 25 0 0 0 50 0v-7M48 80v20m-17 0h34" />
          <path d="M40 24h16M40 34h16M40 44h16" />
        </svg>
        <svg className="dashboard-newsroom-icon dashboard-newsroom-camera" viewBox="0 0 140 100" fill="none">
          <path d="M15 28h70a10 10 0 0 1 10 10v44a10 10 0 0 1-10 10H15A10 10 0 0 1 5 82V38a10 10 0 0 1 10-10Z" />
          <path d="m95 47 38-20v66L95 72zM26 28l10-16h28l10 16" />
          <circle cx="53" cy="60" r="17" />
        </svg>
        <svg className="dashboard-newsroom-icon dashboard-newsroom-mic-alt" viewBox="0 0 96 120" fill="none">
          <rect x="34" y="10" width="28" height="58" rx="14" />
          <path d="M23 48v7a25 25 0 0 0 50 0v-7M48 80v20m-17 0h34" />
          <path d="M40 24h16M40 34h16M40 44h16" />
        </svg>
        <span className="dashboard-newsroom-orbit dashboard-newsroom-orbit-one" />
        <span className="dashboard-newsroom-orbit dashboard-newsroom-orbit-two" />
      </div>
      <PageHeader
        eyebrow={isEnglish ? "OVERVIEW" : "VISTA GENERAL"}
        title={
          isEnglish
            ? "Every story starts here."
            : "Cada historia empieza aquí."
        }
        description={
          isEnglish
            ? "Monitor content preparation and the overall status of the newsroom."
            : "Supervisa la preparación del contenido y el estado general de la sala de redacción."
        }
      >
        <Link className="button button-primary" to="/news">
          {isEnglish ? "Open news" : "Abrir noticias"}
          <span aria-hidden="true">→</span>
        </Link>
      </PageHeader>

      {loading && (
        <LoadingState
          message={
            isEnglish
              ? "Loading system information..."
              : "Consultando la información del sistema..."
          }
        />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && !error && (
        <>
          <section
            className="metrics-grid"
            aria-label={
              isEnglish ? "System summary" : "Resumen del sistema"
            }
          >
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className={`metric-card metric-${metric.color}`}
              >
                <h2>{metric.label}</h2>

                <p className="metric-value">
                  {String(metric.value).padStart(2, "0")}
                </p>

                <span>{metric.detail}</span>
              </article>
            ))}
          </section>

          <WeatherCard
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            language={language}
            onRetry={() =>
              setWeatherReloadKey(
                (currentValue) => currentValue + 1
              )
            }
          />

          <EditorialStatusChart
            news={news}
            language={language}
          />

          <section
            className="dashboard-chart-grid"
            aria-label={isEnglish ? "Editorial analysis" : "AnÃ¡lisis editorial"}
          >
            <CategoryDistributionChart
              news={news}
              categories={categories}
            />

            <ContentVolumeChart news={news} />
          </section>

          <RundownCoverageChart rundowns={rundowns} />

          <section className="workflow-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {isEnglish ? "EDITORIAL WORKFLOW" : "FLUJO EDITORIAL"}
                </p>

                <h2>
                  {isEnglish
                    ? "Preparing a news story"
                    : "Preparación de una noticia"}
                </h2>
              </div>

              <span className="section-reference">
                {isEnglish ? "PROCESS / 01" : "PROCESO / 01"}
              </span>
            </div>

            <div className="workflow-grid">
              <article className="workflow-card">
                <span className="workflow-number">01</span>
                <h3>{isEnglish ? "Intake" : "Ingreso"}</h3>
                <p>
                  {isEnglish
                    ? "The moderator enters the original information."
                    : "El moderador registra la información original."}
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">02</span>
                <h3>{isEnglish ? "AI writing" : "Redacción IA"}</h3>
                <p>
                  {isEnglish
                    ? "The information is turned into structured content."
                    : "La información se convierte en contenido estructurado."}
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">03</span>
                <h3>{isEnglish ? "Review" : "Revisión"}</h3>
                <p>
                  {isEnglish
                    ? "The generated content is reviewed and edited."
                    : "El contenido generado se revisa y corrige."}
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">04</span>
                <h3>{isEnglish ? "On air" : "Al aire"}</h3>
                <p>
                  {isEnglish
                    ? "Approved news is sent to the teleprompter."
                    : "La noticia aprobada se envía al teleprompter."}
                </p>
              </article>
            </div>
          </section>

          <section className="system-summary">
            <article>
              <span>
                {isEnglish ? "ACTIVE USERS" : "USUARIOS ACTIVOS"}
              </span>
              <strong>{activeUsers}</strong>
            </article>

            <article>
              <span>{isEnglish ? "RUNDOWNS" : "ESCALETAS"}</span>
              <strong>{rundowns.length}</strong>
            </article>

            <article>
              <span>
                {isEnglish ? "APPROVED CONTENT" : "CONTENIDO APROBADO"}
              </span>
              <strong>{approvedNews}</strong>
            </article>
          </section>

          <section className="information-panel">
            <div>
              <p className="eyebrow">
                {isEnglish ? "ACTIVE CONNECTIONS" : "CONEXIONES ACTIVAS"}
              </p>

              <h2>
                {isEnglish
                  ? "Local and external services"
                  : "Servicios locales y externos"}
              </h2>

              <p>
                {isEnglish
                  ? "Metrics are calculated with JSON Server, and weather data comes from a live external endpoint."
                  : "Las métricas se calculan con JSON Server y el clima se obtiene desde un endpoint externo real."}
              </p>
            </div>

            <span className="information-code">
              API / ONLINE
            </span>
          </section>
        </>
      )}
    </main>
  );
}

export default DashboardPage;
