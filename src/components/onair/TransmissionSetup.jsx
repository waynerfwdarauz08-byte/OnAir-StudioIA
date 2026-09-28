import {
  useEffect,
  useMemo,
  useState,
} from "react";

function formatDuration(totalSeconds) {
  const safeSeconds = Number(totalSeconds) || 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function formatBroadcastDate(dateValue) {
  if (!dateValue) {
    return "Fecha no definida";
  }

  return new Intl.DateTimeFormat("es-CR", {
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
        <span>CONTROL EN ESPERA</span>

        <h2 id="transmission-setup-title">
          Preparar transmisión
        </h2>

        <p>
          Selecciona una escaleta para cargar sus noticias
          en la consola de transmisión.
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
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
                      ESCALETA DISPONIBLE
                    </span>

                    <strong>{rundown.name}</strong>

                    <small>
                      {formatBroadcastDate(
                        rundown.broadcastDate
                      )}
                    </small>
                  </span>

                  <span className="transmission-option-metrics">
                    <span>
                      <strong>
                        {rundownNews.length}
                      </strong>
                      noticias
                    </span>

                    <span>
                      <strong>
                        {formatDuration(
                          totalDuration
                        )}
                      </strong>
                      duración
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="transmission-setup-actions">
            <div>
              <span>SEÑAL</span>
              <strong>LISTA PARA INICIAR</strong>
            </div>

            <button
              className="button button-danger"
              type="submit"
              disabled={
                starting || !selectedRundownId
              }
            >
              {starting
                ? "Iniciando transmisión..."
                : "Iniciar transmisión"}
            </button>
          </div>
        </form>
      ) : (
        <div className="transmission-setup-empty">
          <span>OFF AIR</span>

          <h3>No hay escaletas disponibles</h3>

          <p>
            Crea una escaleta y agrega al menos una noticia
            aprobada antes de iniciar la transmisión.
          </p>
        </div>
      )}
    </section>
  );
}

export default TransmissionSetup;