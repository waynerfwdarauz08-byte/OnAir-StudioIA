import useTranslation from "../../hooks/useTranslation.js";
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

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function formatBroadcastDate(dateValue, language) {
  if (!dateValue) {
    return "Fecha no definida";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function RundownConsole({
  rundown,
  news = [],
  categories = [],
  updating = false,
  onUpdateNewsIds,
}) {
  const { translate, language } = useTranslation();
  const [draftNewsIds, setDraftNewsIds] = useState(
    () =>
      Array.isArray(rundown?.newsIds)
        ? [...rundown.newsIds]
        : []
  );

  const [savedNewsIds, setSavedNewsIds] = useState(
    () =>
      Array.isArray(rundown?.newsIds)
        ? [...rundown.newsIds]
        : []
  );

  const [selectedNewsId, setSelectedNewsId] =
    useState("");

  const [newsToAdd, setNewsToAdd] = useState("");
  const [newsToRemove, setNewsToRemove] = useState(null);

  const savedIdsFromRundown = Array.isArray(rundown?.newsIds)
    ? rundown.newsIds
    : [];

  // Sincroniza el borrador cuando se selecciona otra escaleta
  // o cuando el servidor confirma una actualización guardada.
  useEffect(() => {
    const currentNewsIds = Array.isArray(rundown?.newsIds)
      ? [...rundown.newsIds]
      : [];

    setDraftNewsIds(currentNewsIds);
    setSavedNewsIds(currentNewsIds);
    setSelectedNewsId("");
    setNewsToAdd("");
    setNewsToRemove(null);
  }, [rundown?.id, rundown?.updatedAt]);

  const assignedNews = useMemo(
    () =>
      draftNewsIds
        .map((newsId) =>
          news.find((newsItem) => newsItem.id === newsId)
        )
        .filter(Boolean),
    [draftNewsIds, news]
  );

  const availableNews = useMemo(
    () =>
      news
        .filter(
          (newsItem) =>
            newsItem.editorialStatus === "approved" &&
            !draftNewsIds.includes(newsItem.id)
        )
        .sort(
          (firstNews, secondNews) =>
            new Date(secondNews.updatedAt).getTime() -
            new Date(firstNews.updatedAt).getTime()
        ),
    [news, draftNewsIds]
  );

  const selectedNews =
    assignedNews.find(
      (newsItem) => newsItem.id === selectedNewsId
    ) ||
    assignedNews[0] ||
    null;

  const totalDuration = assignedNews.reduce(
    (total, newsItem) =>
      total +
      (Number(newsItem.estimatedDurationSeconds) || 0),
    0
  );

  const hasUnsavedChanges =
    draftNewsIds.length !== savedIdsFromRundown.length ||
    draftNewsIds.some(
      (newsId, index) =>
        newsId !== savedIdsFromRundown[index]
    );

  useEffect(() => {
    if (
      assignedNews.length > 0 &&
      !assignedNews.some(
        (newsItem) => newsItem.id === selectedNewsId
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
      (categoryItem) => categoryItem.id === categoryId
    );

    return category?.name || translate("Sin categoría");
  }

  function handleAddNews() {
    if (!newsToAdd || updating) {
      return;
    }

    setDraftNewsIds((currentIds) => [
      ...currentIds,
      newsToAdd,
    ]);

    setSelectedNewsId(newsToAdd);
    setNewsToAdd("");
  }

  function requestRemoveNews(newsItem) {
    if (updating) {
      return;
    }

    setNewsToRemove(newsItem);
  }

  function confirmRemoveNews() {
    if (!newsToRemove || updating) {
      return;
    }

    setDraftNewsIds((currentIds) =>
      currentIds.filter(
        (newsId) => newsId !== newsToRemove.id
      )
    );

    setNewsToRemove(null);
  }

  function handleMoveNews(index, direction) {
    const destinationIndex = index + direction;

    if (
      updating ||
      destinationIndex < 0 ||
      destinationIndex >= draftNewsIds.length
    ) {
      return;
    }

    setDraftNewsIds((currentIds) => {
      const updatedIds = [...currentIds];

      [
        updatedIds[index],
        updatedIds[destinationIndex],
      ] = [
        updatedIds[destinationIndex],
        updatedIds[index],
      ];

      return updatedIds;
    });
  }

  async function handleSaveChanges() {
    if (!hasUnsavedChanges || updating) {
      return;
    }

    const idsToSave = [...draftNewsIds];
    const saved = await onUpdateNewsIds(idsToSave);

    if (saved) {
      setSavedNewsIds(idsToSave);
      setDraftNewsIds(idsToSave);
    }
  }

  function handleDiscardChanges() {
    if (updating) {
      return;
    }

    setDraftNewsIds([...savedNewsIds]);
    setNewsToAdd("");
    setNewsToRemove(null);
  }

  function handleRowKeyDown(event, newsId) {
    if (event.key === "Enter" || event.key === " ") {
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
          <span className="rundown-console-label">{translate("CONTROL DE ESCALETA")}</span>

          <h2 id="rundown-console-title">
            {rundown.name}
          </h2>

          <p>
            {translate(formatBroadcastDate(rundown.broadcastDate, language))}
          </p>
        </div>

        <div className="rundown-console-metrics">
          <div>
            <span>{translate("NOTICIAS")}</span>
            <strong>{assignedNews.length}</strong>
          </div>

          <div>
            <span>{translate("DURACIÓN TOTAL")}</span>
            <strong>{formatDuration(totalDuration)}</strong>
          </div>

          <div>
            <span>{translate("ESTADO")}</span>
            <strong
              className={
                assignedNews.length > 0
                  ? "metric-ready"
                  : "metric-warning"
              }
            >
              {assignedNews.length > 0
                ? translate("EN PREPARACIÓN")
                : translate("VACÍA")}
            </strong>
          </div>
        </div>
      </header>

      <div className="rundown-add-news">
        <div>
          <span>{translate("CONTENIDO DISPONIBLE")}</span>
          <h3>{translate("Agregar noticia aprobada")}</h3>
        </div>

        <div className="rundown-add-controls">
          <select
            value={newsToAdd}
            disabled={
              updating || availableNews.length === 0
            }
            aria-label={translate("Noticia aprobada para agregar")}
            onChange={(event) =>
              setNewsToAdd(event.target.value)
            }
          >
            <option value="">
              {availableNews.length > 0
                ? translate("Selecciona una noticia")
                : translate("No hay noticias aprobadas disponibles")}
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
          >{translate("Agregar al lineup")}</button>
        </div>
      </div>

      <div className="rundown-workspace">
        <div className="rundown-lineup-panel">
          <div className="rundown-panel-heading">
            <strong>LINEUP GRID</strong>
            <span>{translate("Selecciona una fila para revisar el guion")}</span>
          </div>

          {assignedNews.length > 0 ? (
            <div className="rundown-table-wrapper">
              <table className="rundown-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{translate("NOTICIA")}</th>
                    <th>{translate("CATEGORÍA")}</th>
                    <th>{translate("DURACIÓN")}</th>
                    <th>{translate("ESTADO")}</th>
                    <th>{translate("ACCIONES")}</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedNews.map((newsItem, index) => {
                    const isSelected =
                      selectedNews?.id === newsItem.id;

                    return (
                      <tr
                        key={newsItem.id}
                        className={
                          isSelected ? "is-selected" : ""
                        }
                        role="button"
                        tabIndex="0"
                        onClick={() =>
                          setSelectedNewsId(newsItem.id)
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
                            {String(index + 1).padStart(2, "0")}
                          </strong>
                        </td>

                        <td>
                          <span className="rundown-story-title">
                            {newsItem.title}
                          </span>

                          <small>
                            {newsItem.sourceName ||
                              translate("Fuente no indicada")}
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
                          <span className="rundown-ready-badge">{translate("LISTA")}</span>
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
                                updating || index === 0
                              }
                              title={translate("Subir noticia")}
                              aria-label={translate("Subir {0}", {0: newsItem.title})}
                              onClick={() =>
                                handleMoveNews(index, -1)
                              }
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={
                                updating ||
                                index === assignedNews.length - 1
                              }
                              title={translate("Bajar noticia")}
                              aria-label={translate("Bajar {0}", {0: newsItem.title})}
                              onClick={() =>
                                handleMoveNews(index, 1)
                              }
                            >
                              ↓
                            </button>

                            <button
                              className="remove-action"
                              type="button"
                              disabled={updating}
                              title={translate("Quitar de la escaleta")}
                              aria-label={translate("Quitar {0}", {0: newsItem.title})}
                              onClick={() =>
                                requestRemoveNews(newsItem)
                              }
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rundown-empty-lineup">
              <span>00</span>
              <h3>{translate("La escaleta todavía está vacía")}</h3>
              <p>{translate("Selecciona una noticia aprobada para comenzar a organizar la edición.")}</p>
            </div>
          )}
        </div>

        <aside className="rundown-script-panel">
          <div className="rundown-panel-heading">
            <strong>{translate("VISTA DE GUION")}</strong>
            <span>{translate("Previsualización editorial")}</span>
          </div>

          {selectedNews ? (
            <div className="rundown-script-content">
              <div className="rundown-script-meta">
                <span>{translate("POSICIÓN")}{" "}
                  {String(
                    assignedNews.findIndex(
                      (newsItem) =>
                        newsItem.id === selectedNews.id
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
                  translate("Esta noticia no tiene resumen.")}
              </p>

              {selectedNews.selectedLowerThird && (
                <div className="rundown-lower-third">
                  <span>{translate("CINTILLO")}</span>
                  <strong>
                    {selectedNews.selectedLowerThird}
                  </strong>
                </div>
              )}

              <div className="rundown-script-reader">
                <span>{translate("GUION DE PRESENTACIÓN")}</span>
                <p>
                  {selectedNews.script ||
                    translate("Esta noticia todavía no tiene un guion disponible.")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rundown-script-empty">
              <p>{translate("Agrega o selecciona una noticia para revisar su guion.")}</p>
            </div>
          )}
        </aside>
      </div>

      <div className="rundown-change-actions">
        {hasUnsavedChanges ? (
          <p role="status">{translate("Tienes cambios sin guardar en esta escaleta.")}</p>
        ) : (
          <p role="status">{translate("Todos los cambios están guardados.")}</p>
        )}

        <div>
          <button
            className="button button-secondary"
            type="button"
            disabled={updating || !hasUnsavedChanges}
            onClick={handleDiscardChanges}
          >{translate("Descartar cambios")}</button>

          <button
            className="button button-primary"
            type="button"
            disabled={updating || !hasUnsavedChanges}
            onClick={handleSaveChanges}
          >
            {updating
              ? translate("Guardando cambios...")
              : translate("Guardar cambios")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(newsToRemove)}
        title={translate("Quitar noticia")}
        message={
          newsToRemove
            ? translate("¿Deseas quitar “{0}” del borrador de esta escaleta? El cambio se aplicará cuando guardes la escaleta.", {0: newsToRemove.title})
            : ""
        }
        confirmText={translate("Quitar del borrador")}
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