import useTranslation from "../../hooks/useTranslation.js";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

function formatDuration(totalSeconds) {
  const safeSeconds = Number(totalSeconds) || 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function formatBroadcastDate(dateValue, language) {
  if (!dateValue) {
    return language === "en" ? "Date not set" : "Fecha no definida";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(
    new Date(`${dateValue}T12:00:00`)
  );
}

function TransmissionSetup({
  rundowns = [],
  news = [],
  starting = false,
  error = "",
  onStart,
}) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const [selectedRundownId, setSelectedRundownId] =
    useState("");

  const availableRundowns = useMemo(
    () =>
      rundowns.filter(
        (rundown) =>
          Array.isArray(rundown.newsIds) &&
          rundown.newsIds.length > 0
      ),
    [rundowns]
  );

  useEffect(() => {
    if (
      availableRundowns.length > 0 &&
      !availableRundowns.some(
        (rundown) =>
          rundown.id === selectedRundownId
      )
    ) {
      setSelectedRundownId(
        availableRundowns[0].id
      );
    }

    if (availableRundowns.length === 0) {
      setSelectedRundownId("");
    }
  }, [
    availableRundowns,
    selectedRundownId,
  ]);

  function getRundownNews(rundown) {
    return rundown.newsIds
      .map((newsId) =>
        news.find(
          (newsItem) => newsItem.id === newsId
        )
      )
      .filter(Boolean);
  }

  function getTotalDuration(rundown) {
    return getRundownNews(rundown).reduce(
      (total, newsItem) =>
        total +
        (Number(
          newsItem.estimatedDurationSeconds
        ) || 0),
      0
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedRundownId || starting) {
      return;
    }

    onStart(selectedRundownId);
  }

  return (
    <section
      className="transmission-setup"
      aria-labelledby="transmission-setup-title"
    >
      <header className="transmission-setup-heading">
        <span>{isEnglish ? "STANDBY CONTROL" : "CONTROL EN ESPERA"}</span>

        <h2 id="transmission-setup-title">
          {isEnglish ? "Prepare transmission" : "Preparar transmisión"}
        </h2>

        <p>
          {isEnglish ? "Select a rundown to load its news items into the transmission console." : "Selecciona una escaleta para cargar sus noticias en la consola de transmisión."}
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {translate(error)}
        </div>
      )}

      {availableRundowns.length > 0 ? (
        <form onSubmit={handleSubmit}>
          <div className="transmission-rundown-list">
            {availableRundowns.map((rundown) => {
              const rundownNews =
                getRundownNews(rundown);

              const totalDuration =
                getTotalDuration(rundown);

              const selected =
                selectedRundownId === rundown.id;

              return (
                <label
                  key={rundown.id}
                  className={`transmission-rundown-option ${
                    selected ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="transmissionRundown"
                    value={rundown.id}
                    checked={selected}
                    disabled={starting}
                    onChange={() =>
                      setSelectedRundownId(
                        rundown.id
                      )
                    }
                  />

                  <span className="transmission-option-indicator" />

                  <span className="transmission-option-content">
                    <span className="transmission-option-label">
                      {isEnglish ? "AVAILABLE RUNDOWN" : "ESCALETA DISPONIBLE"}
                    </span>

                    <strong>{rundown.name}</strong>

                    <small>
                      {formatBroadcastDate(
                        rundown.broadcastDate, language
                      )}
                    </small>
                  </span>

                  <span className="transmission-option-metrics">
                    <span>
                      <strong>
                        {rundownNews.length}
                      </strong>
                      {isEnglish ? "news items" : "noticias"}
                    </span>

                    <span>
                      <strong>
                        {formatDuration(
                          totalDuration
                        )}
                      </strong>
                      {isEnglish ? "duration" : "duración"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="transmission-setup-actions">
            <div>
              <span>{isEnglish ? "SIGNAL" : "SEÑAL"}</span>
              <strong>{isEnglish ? "READY TO START" : "LISTA PARA INICIAR"}</strong>
            </div>

            <button
              className="button button-danger"
              type="submit"
              disabled={
                starting || !selectedRundownId
              }
            >
              {starting
                ? isEnglish ? "Starting transmission..." : "Iniciando transmisión..."
                : isEnglish ? "Start transmission" : "Iniciar transmisión"}
            </button>
          </div>
        </form>
      ) : (
        <div className="transmission-setup-empty">
          <span>OFF AIR</span>

          <h3>{isEnglish ? "No rundowns available" : "No hay escaletas disponibles"}</h3>

          <p>
            {isEnglish ? "Create a rundown and add at least one approved news item before starting the transmission." : "Crea una escaleta y agrega al menos una noticia aprobada antes de iniciar la transmisión."}
          </p>
        </div>
      )}
    </section>
  );
}

export default TransmissionSetup;
