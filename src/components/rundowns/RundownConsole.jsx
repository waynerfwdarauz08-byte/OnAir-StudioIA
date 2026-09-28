import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ConfirmDialog from "../common/ConfirmDialog.jsx";

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
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(
    new Date(`${dateValue}T12:00:00`)
  );
}

function RundownConsole({
  rundown,
  news = [],
  categories = [],
  updating = false,
  onUpdateNewsIds,
}) {
  const [selectedNewsId, setSelectedNewsId] =
    useState("");

  const [newsToAdd, setNewsToAdd] = useState("");

  const [newsToRemove, setNewsToRemove] =
    useState(null);

  const newsIds = useMemo(
    () =>
      Array.isArray(rundown?.newsIds)
        ? rundown.newsIds
        : [],
    [rundown]
  );

  const assignedNews = useMemo(
    () =>
      newsIds
        .map((newsId) =>
          news.find(
            (newsItem) => newsItem.id === newsId
          )
        )
        .filter(Boolean),
    [newsIds, news]
  );

  const availableNews = useMemo(
    () =>
      news
        .filter(
          (newsItem) =>
            newsItem.editorialStatus === "approved" &&
            !newsIds.includes(newsItem.id)
        )
        .sort(
          (firstNews, secondNews) =>
            new Date(
              secondNews.updatedAt
            ).getTime() -
            new Date(
              firstNews.updatedAt
            ).getTime()
        ),
    [news, newsIds]
  );

  const selectedNews =
    assignedNews.find(
      (newsItem) =>
        newsItem.id === selectedNewsId
    ) ||
    assignedNews[0] ||
    null;

  const totalDuration = assignedNews.reduce(
    (total, newsItem) =>
      total +
      (Number(
        newsItem.estimatedDurationSeconds
      ) || 0),
    0
  );

  useEffect(() => {
    if (
      assignedNews.length > 0 &&
      !assignedNews.some(
        (newsItem) =>
          newsItem.id === selectedNewsId
      )
    ) {
      setSelectedNewsId(assignedNews[0].id);
    }

    if (assignedNews.length === 0) {
      setSelectedNewsId("");
    }
  }, [assignedNews, selectedNewsId]);

  function getCategoryName(categoryId) {
    const category = categories.find(
      (categoryItem) =>
        categoryItem.id === categoryId
    );

    return category?.name || "Sin categoría";
  }

  async function handleAddNews() {
    if (!newsToAdd || updating) {
      return;
    }

    const updatedNewsIds = [
      ...newsIds,
      newsToAdd,
    ];

    const updated = await onUpdateNewsIds(
      updatedNewsIds
    );

    if (updated) {
      setSelectedNewsId(newsToAdd);
      setNewsToAdd("");
    }
  }

  function requestRemoveNews(newsItem) {
    if (updating) {
      return;
    }

    setNewsToRemove(newsItem);
  }

  async function confirmRemoveNews() {
    if (!newsToRemove || updating) {
      return;
    }

    const updatedNewsIds = newsIds.filter(
      (currentNewsId) =>
        currentNewsId !== newsToRemove.id
    );

    const updated = await onUpdateNewsIds(
      updatedNewsIds
    );

    if (updated) {
      setNewsToRemove(null);
    }
  }

  async function handleMoveNews(index, direction) {
    const destinationIndex = index + direction;

    if (
      updating ||
      destinationIndex < 0 ||
      destinationIndex >= newsIds.length
    ) {
      return;
    }

    const updatedNewsIds = [...newsIds];

    [
      updatedNewsIds[index],
      updatedNewsIds[destinationIndex],
    ] = [
      updatedNewsIds[destinationIndex],
      updatedNewsIds[index],
    ];

    await onUpdateNewsIds(updatedNewsIds);
  }

  function handleRowKeyDown(event, newsId) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setSelectedNewsId(newsId);
    }
  }

  return (
    <section
      className="rundown-console"
      aria-labelledby="rundown-console-title"
    >
      <header className="rundown-console-header">
        <div>
          <span className="rundown-console-label">
            CONTROL DE ESCALETA
          </span>

          <h2 id="rundown-console-title">
            {rundown.name}
          </h2>

          <p>
            {formatBroadcastDate(
              rundown.broadcastDate
            )}
          </p>
        </div>

        <div className="rundown-console-metrics">
          <div>
            <span>NOTICIAS</span>
            <strong>{assignedNews.length}</strong>
          </div>

          <div>
            <span>DURACIÓN TOTAL</span>
            <strong>
              {formatDuration(totalDuration)}
            </strong>
          </div>

          <div>
            <span>ESTADO</span>

            <strong
              className={
                assignedNews.length > 0
                  ? "metric-ready"
                  : "metric-warning"
              }
            >
              {assignedNews.length > 0
                ? "EN PREPARACIÓN"
                : "VACÍA"}
            </strong>
          </div>
        </div>
      </header>

      <div className="rundown-add-news">
        <div>
          <span>CONTENIDO DISPONIBLE</span>

          <h3>Agregar noticia aprobada</h3>
        </div>

        <div className="rundown-add-controls">
          <select
            value={newsToAdd}
            disabled={
              updating ||
              availableNews.length === 0
            }
            aria-label="Noticia aprobada para agregar"
            onChange={(event) =>
              setNewsToAdd(event.target.value)
            }
          >
            <option value="">
              {availableNews.length > 0
                ? "Selecciona una noticia"
                : "No hay noticias aprobadas disponibles"}
            </option>

            {availableNews.map((newsItem) => (
              <option
                key={newsItem.id}
                value={newsItem.id}
              >
                {newsItem.title}
              </option>
            ))}
          </select>

          <button
            className="button button-primary"
            type="button"
            disabled={updating || !newsToAdd}
            onClick={handleAddNews}
          >
            {updating
              ? "Actualizando..."
              : "Agregar al lineup"}
          </button>
        </div>
      </div>

      <div className="rundown-workspace">
        <div className="rundown-lineup-panel">
          <div className="rundown-panel-heading">
            <strong>LINEUP GRID</strong>

            <span>
              Selecciona una fila para revisar el guion
            </span>
          </div>

          {assignedNews.length > 0 ? (
            <div className="rundown-table-wrapper">
              <table className="rundown-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NOTICIA</th>
                    <th>CATEGORÍA</th>
                    <th>DURACIÓN</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedNews.map(
                    (newsItem, index) => {
                      const isSelected =
                        selectedNews?.id ===
                        newsItem.id;

                      return (
                        <tr
                          key={newsItem.id}
                          className={
                            isSelected
                              ? "is-selected"
                              : ""
                          }
                          role="button"
                          tabIndex="0"
                          onClick={() =>
                            setSelectedNewsId(
                              newsItem.id
                            )
                          }
                          onKeyDown={(event) =>
                            handleRowKeyDown(
                              event,
                              newsItem.id
                            )
                          }
                        >
                          <td>
                            <strong>
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </strong>
                          </td>

                          <td>
                            <span className="rundown-story-title">
                              {newsItem.title}
                            </span>

                            <small>
                              {newsItem.sourceName ||
                                "Fuente no indicada"}
                            </small>
                          </td>

                          <td>
                            <span className="rundown-category">
                              {getCategoryName(
                                newsItem.categoryId
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="rundown-timecode">
                              {formatDuration(
                                newsItem.estimatedDurationSeconds
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="rundown-ready-badge">
                              LISTA
                            </span>
                          </td>

                          <td>
                            <div
                              className="rundown-row-actions"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <button
                                type="button"
                                disabled={
                                  updating ||
                                  index === 0
                                }
                                title="Subir noticia"
                                aria-label={`Subir ${newsItem.title}`}
                                onClick={() =>
                                  handleMoveNews(
                                    index,
                                    -1
                                  )
                                }
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                disabled={
                                  updating ||
                                  index ===
                                    assignedNews.length -
                                      1
                                }
                                title="Bajar noticia"
                                aria-label={`Bajar ${newsItem.title}`}
                                onClick={() =>
                                  handleMoveNews(
                                    index,
                                    1
                                  )
                                }
                              >
                                ↓
                              </button>

                              <button
                                className="remove-action"
                                type="button"
                                disabled={updating}
                                title="Quitar de la escaleta"
                                aria-label={`Quitar ${newsItem.title}`}
                                onClick={() =>
                                  requestRemoveNews(
                                    newsItem
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rundown-empty-lineup">
              <span>00</span>

              <h3>
                La escaleta todavía está vacía
              </h3>

              <p>
                Selecciona una noticia aprobada para comenzar
                a organizar la edición.
              </p>
            </div>
          )}
        </div>

        <aside className="rundown-script-panel">
          <div className="rundown-panel-heading">
            <strong>VISTA DE GUION</strong>

            <span>Previsualización editorial</span>
          </div>

          {selectedNews ? (
            <div className="rundown-script-content">
              <div className="rundown-script-meta">
                <span>
                  POSICIÓN{" "}
                  {String(
                    assignedNews.findIndex(
                      (newsItem) =>
                        newsItem.id ===
                        selectedNews.id
                    ) + 1
                  ).padStart(2, "0")}
                </span>

                <span>
                  {formatDuration(
                    selectedNews.estimatedDurationSeconds
                  )}
                </span>
              </div>

              <h3>{selectedNews.title}</h3>

              <p className="rundown-script-summary">
                {selectedNews.summary ||
                  "Esta noticia no tiene resumen."}
              </p>

              {selectedNews.selectedLowerThird && (
                <div className="rundown-lower-third">
                  <span>CINTILLO</span>

                  <strong>
                    {
                      selectedNews.selectedLowerThird
                    }
                  </strong>
                </div>
              )}

              <div className="rundown-script-reader">
                <span>GUION DE PRESENTACIÓN</span>

                <p>
                  {selectedNews.script ||
                    "Esta noticia todavía no tiene un guion disponible."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rundown-script-empty">
              <p>
                Agrega o selecciona una noticia para revisar
                su guion.
              </p>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(newsToRemove)}
        title="Quitar noticia"
        message={
          newsToRemove
            ? `¿Deseas quitar “${newsToRemove.title}” de esta escaleta? La noticia seguirá disponible en la bandeja editorial.`
            : ""
        }
        confirmText="Quitar noticia"
        danger
        loading={updating}
        onConfirm={confirmRemoveNews}
        onCancel={() => {
          if (!updating) {
            setNewsToRemove(null);
          }
        }}
      />
    </section>
  );
}

export default RundownConsole;