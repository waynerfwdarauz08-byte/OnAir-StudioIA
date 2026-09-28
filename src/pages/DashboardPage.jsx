import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";

import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import EditorialStatusChart from "../components/dashboard/EditorialStatusChart.jsx";

import WeatherCard from "../components/dashboard/WeatherCard.jsx";

import { newsService } from "../services/newsService.js";
import { userService } from "../services/userService.js";
import { rundownService } from "../services/rundownService.js";
import { weatherService } from "../services/weatherService.js";

function DashboardPage() {
  const [news, setNews] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [rundowns, setRundowns] =
    useState([]);

  const [weather, setWeather] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [weatherError, setWeatherError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [
    weatherReloadKey,
    setWeatherReloadKey,
  ] = useState(0);

  /*
   * Carga la información local
   * almacenada en JSON Server.
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [
          newsData,
          usersData,
          rundownsData,
        ] = await Promise.all([
          newsService.getAll(
            controller.signal
          ),

          userService.getAll(
            controller.signal
          ),

          rundownService.getAll(
            controller.signal
          ),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setNews(
          Array.isArray(newsData)
            ? newsData
            : []
        );

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : []
        );

        setRundowns(
          Array.isArray(rundownsData)
            ? rundownsData
            : []
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              "No fue posible cargar el panel."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  /*
   * Carga el clima desde una API externa.
   * Este error no bloquea el resto del Dashboard.
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");

      try {
        const weatherData =
          await weatherService.getCurrent(
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
              "No fue posible consultar el clima."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      controller.abort();
    };
  }, [weatherReloadKey]);

  const approvedNews =
    news.filter(
      (newsItem) =>
        newsItem.editorialStatus ===
        "approved"
    ).length;

  const reviewNews =
    news.filter(
      (newsItem) =>
        newsItem.editorialStatus ===
        "review"
    ).length;

  const activeUsers =
    users.filter(
      (user) => user.active
    ).length;

  const metrics = [
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
    <>
      <PageHeader
        eyebrow="VISTA GENERAL"
        title="Cada historia empieza aquí."
        description="Supervisa la preparación del contenido y el estado general de la sala de redacción."
      >
        <Link
          className="button button-primary"
          to="/news"
        >
          Abrir noticias

          <span aria-hidden="true">
            →
          </span>
        </Link>
      </PageHeader>

      {loading && (
        <LoadingState message="Consultando la información del sistema..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey(
              (currentValue) =>
                currentValue + 1
            )
          }
        />
      )}

      {!loading && !error && (
        <>
          <section
            className="metrics-grid"
            aria-label="Resumen del sistema"
          >
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className={`metric-card metric-${metric.color}`}
              >
                <h2>{metric.label}</h2>

                <p className="metric-value">
                  {String(
                    metric.value
                  ).padStart(2, "0")}
                </p>

                <span>
                  {metric.detail}
                </span>
              </article>
            ))}
          </section>

          <WeatherCard
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onRetry={() =>
              setWeatherReloadKey(
                (currentValue) =>
                  currentValue + 1
              )
            }
          />

          <EditorialStatusChart
            news={news}
          />

          <section className="workflow-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  FLUJO EDITORIAL
                </p>

                <h2>
                  Preparación de una noticia
                </h2>
              </div>

              <span className="section-reference">
                PROCESO / 01
              </span>
            </div>

            <div className="workflow-grid">
              <article className="workflow-card">
                <span className="workflow-number">
                  01
                </span>

                <h3>Ingreso</h3>

                <p>
                  El moderador registra la
                  información original.
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">
                  02
                </span>

                <h3>Redacción IA</h3>

                <p>
                  La información se convierte
                  en contenido estructurado.
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">
                  03
                </span>

                <h3>Revisión</h3>

                <p>
                  El contenido generado se
                  revisa y corrige.
                </p>
              </article>

              <article className="workflow-card">
                <span className="workflow-number">
                  04
                </span>

                <h3>Al Aire</h3>

                <p>
                  La noticia aprobada se envía
                  al teleprompter.
                </p>
              </article>
            </div>
          </section>

          <section className="system-summary">
            <article>
              <span>
                USUARIOS ACTIVOS
              </span>

              <strong>
                {activeUsers}
              </strong>
            </article>

            <article>
              <span>
                ESCALETAS
              </span>

              <strong>
                {rundowns.length}
              </strong>
            </article>

            <article>
              <span>
                CONTENIDO APROBADO
              </span>

              <strong>
                {approvedNews}
              </strong>
            </article>
          </section>

          <section className="information-panel">
            <div>
              <p className="eyebrow">
                CONEXIONES ACTIVAS
              </p>

              <h2>
                Servicios locales y externos
              </h2>

              <p>
                Las métricas se calculan con
                JSON Server y el clima se
                obtiene desde un endpoint
                externo real.
              </p>
            </div>

            <span className="information-code">
              API / ONLINE
            </span>
          </section>
        </>
      )}
    </>
  );
}

export default DashboardPage;