import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ConfirmDialog from "../common/ConfirmDialog.jsx";

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60
  );
  const seconds = Math.floor(safeSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function OnAirConsole({
  transmission,
  rundown,
  news = [],
  categories = [],
  changing = false,
  error = "",
  onSelectNews,
  onPrevious,
  onNext,
  onStop,
}) {
  const [currentTime, setCurrentTime] = useState(
    Date.now()
  );

  const [stopDialogOpen, setStopDialogOpen] =
    useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const rundownNews = useMemo(() => {
    const newsIds = Array.isArray(rundown.newsIds)
      ? rundown.newsIds
      : [];

    return newsIds
      .map((newsId) =>
        news.find(
          (newsItem) => newsItem.id === newsId
        )
      )
      .filter(Boolean);
  }, [rundown, news]);

  const currentNewsIndex = Math.max(
    0,
    rundownNews.findIndex(
      (newsItem) =>
        newsItem.id === transmission.newsId
    )
  );

  const currentNews =
    rundownNews[currentNewsIndex] || null;

  const nextNews =
    rundownNews[currentNewsIndex + 1] || null;

  const previousNews =
    rundownNews[currentNewsIndex - 1] || null;

  const startedAtTime = transmission.startedAt
    ? new Date(transmission.startedAt).getTime()
    : currentTime;

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (currentTime - startedAtTime) / 1000
    )
  );

  const progress =
    rundownNews.length > 0
      ? ((currentNewsIndex + 1) /
          rundownNews.length) *
        100
      : 0;

  function getCategoryName(categoryId) {
    const category = categories.find(
      (categoryItem) =>
        categoryItem.id === categoryId
    );

    return category?.name || "Sin categoría";
  }

  function getItemStatus(index) {
    if (index < currentNewsIndex) {
      return {
        label: "EMITIDA",
        className: "is-aired",
      };
    }

    if (index === currentNewsIndex) {
      return {
        label: "AL AIRE",
        className: "is-live",
      };
    }

    if (index === currentNewsIndex + 1) {
      return {
        label: "SIGUIENTE",
        className: "is-next",
      };
    }

    return {
      label: "EN ESPERA",
      className: "is-standby",
    };
  }

  async function confirmStop() {
    const stopped = await onStop();
    if (stopped !== false) {
      setStopDialogOpen(false);
    }
  }

  return (
    <section
      className="onair-console"
      aria-labelledby="onair-console-title"
    >
      <header className="onair-console-header">
        <div className="onair-live-identity">
          <span className="onair-live-indicator">
            <i />
            AL AIRE
          </span>

          <div>
            <h2 id="onair-console-title">
              {rundown.name}
            </h2>

            <p>
              Transmisión editorial activa
            </p>
          </div>
        </div>

        <div className="onair-master-clocks">
          <div>
            <span>HORA LOCAL</span>

            <strong>
              {new Intl.DateTimeFormat("es-CR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).format(currentTime)}
            </strong>
          </div>

          <div>
            <span>TIEMPO AL AIRE</span>

            <strong>
              {formatDuration(elapsedSeconds)}
            </strong>
          </div>

          <button
            className="button button-danger"
            type="button"
            disabled={changing}
            onClick={() =>
              setStopDialogOpen(true)
            }
          >
            Finalizar transmisión
          </button>
        </div>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="onair-progress">
        <div>
          <span>
            PROGRESO DE ESCALETA
          </span>

          <strong>
            {currentNewsIndex + 1} /{" "}
            {rundownNews.length}
          </strong>
        </div>

        <div className="onair-progress-track">
          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progress)
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="onair-workspace">
        <aside className="onair-lineup">
          <div className="onair-panel-heading">
            <strong>ORDEN DE TRANSMISIÓN</strong>

            <span>
              {rundownNews.length} noticias
            </span>
          </div>

          <div className="onair-lineup-list">
            {rundownNews.map(
              (newsItem, index) => {
                const status =
                  getItemStatus(index);

                return (
                  <button
                    key={newsItem.id}
                    className={`onair-lineup-item ${
                      status.className
                    }`}
                    type="button"
                    disabled={changing}
                    aria-current={
                      index === currentNewsIndex
                        ? "true"
                        : undefined
                    }
                    onClick={() =>
                      onSelectNews(newsItem.id)
                    }
                  >
                    <span className="onair-item-position">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="onair-item-information">
                      <strong>
                        {newsItem.title}
                      </strong>

                      <small>
                        {getCategoryName(
                          newsItem.categoryId
                        )}{" "}
                        ·{" "}
                        {formatDuration(
                          newsItem.estimatedDurationSeconds
                        )}
                      </small>
                    </span>

                    <span
                      className={`onair-item-status ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </aside>

        <main className="onair-current-story">
          <div className="onair-panel-heading">
            <strong>CONTENIDO ACTUAL</strong>

            <span>
              POSICIÓN{" "}
              {String(
                currentNewsIndex + 1
              ).padStart(2, "0")}
            </span>
          </div>

          {currentNews ? (
            <div className="onair-story-content">
              <div className="onair-story-meta">
                <span>
                  {getCategoryName(
                    currentNews.categoryId
                  )}
                </span>

                <span>
                  DURACIÓN{" "}
                  {formatDuration(
                    currentNews.estimatedDurationSeconds
                  )}
                </span>
              </div>

              <h3>{currentNews.title}</h3>

              <p className="onair-story-summary">
                {currentNews.summary ||
                  "Esta noticia no tiene resumen."}
              </p>

              {currentNews.selectedLowerThird && (
                <div className="onair-lower-third">
                  <span>CINTILLO AL AIRE</span>

                  <strong>
                    {
                      currentNews.selectedLowerThird
                    }
                  </strong>
                </div>
              )}

              <div className="onair-script">
                <span>GUION DEL PRESENTADOR</span>

                <p>
                  {currentNews.script ||
                    "Esta noticia no tiene un guion disponible."}
                </p>
              </div>

              <div className="onair-story-controls">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={
                    changing || !previousNews
                  }
                  onClick={onPrevious}
                >
                  ← Noticia anterior
                </button>

                <button
                  className="button button-primary"
                  type="button"
                  disabled={
                    changing || !nextNews
                  }
                  onClick={onNext}
                >
                  {changing
                    ? "Actualizando..."
                    : "Siguiente noticia →"}
                </button>
              </div>
            </div>
          ) : (
            <div className="onair-story-empty">
              No hay una noticia seleccionada.
            </div>
          )}
        </main>

        <aside className="onair-next-story">
          <div className="onair-panel-heading">
            <strong>SIGUIENTE</strong>

            <span>PREVISUALIZACIÓN</span>
          </div>

          {nextNews ? (
            <div className="onair-next-content">
              <span className="onair-next-position">
                POSICIÓN{" "}
                {String(
                  currentNewsIndex + 2
                ).padStart(2, "0")}
              </span>

              <h3>{nextNews.title}</h3>

              <p>
                {nextNews.summary ||
                  "Esta noticia no tiene resumen."}
              </p>

              <div>
                <span>
                  {getCategoryName(
                    nextNews.categoryId
                  )}
                </span>

                <strong>
                  {formatDuration(
                    nextNews.estimatedDurationSeconds
                  )}
                </strong>
              </div>
            </div>
          ) : (
            <div className="onair-next-empty">
              <span>FIN</span>

              <p>
                Esta es la última noticia de la escaleta.
              </p>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={stopDialogOpen}
        title="Finalizar transmisión"
        message="¿Deseas finalizar la transmisión actual? El contenido dejará de mostrarse en la interfaz del presentador."
        confirmText="Finalizar transmisión"
        danger
        loading={changing}
        onConfirm={confirmStop}
        onCancel={() => {
          if (!changing) {
            setStopDialogOpen(false);
          }
        }}
      />
    </section>
  );
}

export default OnAirConsole;
