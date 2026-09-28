import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import RundownForm from "../components/rundowns/RundownForm.jsx";
import RundownCard from "../components/rundowns/RundownCard.jsx";
import RundownConsole from "../components/rundowns/RundownConsole.jsx";
import RundownEditDialog from "../components/rundowns/RundownEditDialog.jsx";

import { rundownService } from "../services/rundownService.js";
import { newsService } from "../services/newsService.js";
import { categoryService } from "../services/categoryService.js";

import useAuth from "../hooks/useAuth.js";

function createRundownId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `rundown-${crypto.randomUUID()}`;
  }

  return `rundown-${Date.now()}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es");
}

function sortRundowns(rundowns) {
  return [...rundowns].sort(
    (firstRundown, secondRundown) =>
      new Date(
        secondRundown.broadcastDate
      ).getTime() -
      new Date(
        firstRundown.broadcastDate
      ).getTime()
  );
}

function RundownsPage() {
  const { user } = useAuth();

  const closeModalButtonRef = useRef(null);

  const [rundowns, setRundowns] = useState([]);
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [
    selectedRundownId,
    setSelectedRundownId,
  ] = useState("");

  const [consoleOpen, setConsoleOpen] =
    useState(false);

  const [
    rundownToEdit,
    setRundownToEdit,
  ] = useState(null);

  const [
    rundownToDelete,
    setRundownToDelete,
  ] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] =
    useState("");

  const [loadError, setLoadError] = useState("");
  const [createError, setCreateError] =
    useState("");
  const [editError, setEditError] = useState("");
  const [workspaceError, setWorkspaceError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRundownsModule() {
      setLoading(true);
      setLoadError("");

      try {
        const [
          rundownsData,
          newsData,
          categoriesData,
        ] = await Promise.all([
          rundownService.getAll(controller.signal),
          newsService.getAll(controller.signal),
          categoryService.getAll(controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const safeRundowns = Array.isArray(
          rundownsData
        )
          ? rundownsData
          : [];

        const orderedRundowns =
          sortRundowns(safeRundowns);

        setRundowns(orderedRundowns);

        setNews(
          Array.isArray(newsData) ? newsData : []
        );

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : []
        );

        setSelectedRundownId(
          (currentSelectedId) => {
            const selectionExists =
              orderedRundowns.some(
                (rundown) =>
                  rundown.id ===
                  currentSelectedId
              );

            if (selectionExists) {
              return currentSelectedId;
            }

            return orderedRundowns[0]?.id || "";
          }
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRundownsModule();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (!consoleOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeModalButtonRef.current?.focus();

    function closeWithEscape(event) {
      if (
        event.key === "Escape" &&
        !updating
      ) {
        setConsoleOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [consoleOpen, updating]);

  const selectedRundown = useMemo(
    () =>
      rundowns.find(
        (rundown) =>
          rundown.id === selectedRundownId
      ) || null,
    [rundowns, selectedRundownId]
  );

  function handleOpenRundown(rundownId) {
    setSelectedRundownId(rundownId);
    setWorkspaceError("");
    setSuccessMessage("");
    setConsoleOpen(true);
  }

  function handleCloseConsole() {
    if (!updating) {
      setConsoleOpen(false);
      setWorkspaceError("");
    }
  }

  async function handleCreateRundown(values) {
    setCreateError("");
    setWorkspaceError("");
    setSuccessMessage("");

    const duplicateRundown = rundowns.some(
      (rundown) =>
        normalizeText(rundown.name) ===
          normalizeText(values.name) &&
        rundown.broadcastDate ===
          values.broadcastDate
    );

    if (duplicateRundown) {
      setCreateError(
        "Ya existe una escaleta con ese nombre y fecha."
      );

      return false;
    }

    setCreating(true);

    try {
      const currentDate = new Date().toISOString();

      const newRundown = {
        id: createRundownId(),
        name: values.name,
        broadcastDate: values.broadcastDate,
        newsIds: [],
        createdBy: user.id,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      const createdRundown =
        await rundownService.create(newRundown);

      setRundowns((currentRundowns) =>
        sortRundowns([
          createdRundown,
          ...currentRundowns,
        ])
      );

      setSelectedRundownId(createdRundown.id);

      setSuccessMessage(
        "La escaleta fue creada correctamente."
      );

      return true;
    } catch (error) {
      setCreateError(
        error.message ||
          "No fue posible crear la escaleta."
      );

      return false;
    } finally {
      setCreating(false);
    }
  }

  function requestEditRundown(rundown) {
    setEditError("");
    setWorkspaceError("");
    setSuccessMessage("");
    setRundownToEdit(rundown);
  }

  async function handleEditRundown(values) {
    if (!rundownToEdit) {
      return false;
    }

    setEditError("");
    setSuccessMessage("");

    const duplicateRundown = rundowns.some(
      (rundown) =>
        rundown.id !== rundownToEdit.id &&
        normalizeText(rundown.name) ===
          normalizeText(values.name) &&
        rundown.broadcastDate ===
          values.broadcastDate
    );

    if (duplicateRundown) {
      setEditError(
        "Ya existe otra escaleta con ese nombre y fecha."
      );

      return false;
    }

    setEditing(true);

    try {
      const changes = {
        name: values.name,
        broadcastDate: values.broadcastDate,
        updatedAt: new Date().toISOString(),
      };

      const updatedRundown =
        await rundownService.partialUpdate(
          rundownToEdit.id,
          changes
        );

      setRundowns((currentRundowns) =>
        sortRundowns(
          currentRundowns.map((rundown) =>
            rundown.id === updatedRundown.id
              ? updatedRundown
              : rundown
          )
        )
      );

      setRundownToEdit(null);

      setSuccessMessage(
        "La escaleta fue actualizada correctamente."
      );

      return true;
    } catch (error) {
      setEditError(
        error.message ||
          "No fue posible editar la escaleta."
      );

      return false;
    } finally {
      setEditing(false);
    }
  }

  async function handleUpdateNewsIds(newsIds) {
    if (!selectedRundown) {
      return false;
    }

    setUpdating(true);
    setWorkspaceError("");
    setSuccessMessage("");

    try {
      const changes = {
        newsIds,
        updatedAt: new Date().toISOString(),
      };

      const updatedRundown =
        await rundownService.partialUpdate(
          selectedRundown.id,
          changes
        );

      setRundowns((currentRundowns) =>
        currentRundowns.map((rundown) =>
          rundown.id === updatedRundown.id
            ? updatedRundown
            : rundown
        )
      );

      setSuccessMessage(
        "La escaleta fue actualizada correctamente."
      );

      return true;
    } catch (error) {
      setWorkspaceError(
        error.message ||
          "No fue posible actualizar la escaleta."
      );

      return false;
    } finally {
      setUpdating(false);
    }
  }

  function requestDeleteRundown(rundown) {
    setWorkspaceError("");
    setSuccessMessage("");
    setRundownToDelete(rundown);
  }

  async function confirmDeleteRundown() {
    if (!rundownToDelete) {
      return;
    }

    setDeletingId(rundownToDelete.id);
    setWorkspaceError("");
    setSuccessMessage("");

    try {
      await rundownService.remove(
        rundownToDelete.id
      );

      const remainingRundowns =
        rundowns.filter(
          (rundown) =>
            rundown.id !== rundownToDelete.id
        );

      setRundowns(remainingRundowns);

      if (
        selectedRundownId ===
        rundownToDelete.id
      ) {
        setSelectedRundownId(
          remainingRundowns[0]?.id || ""
        );

        setConsoleOpen(false);
      }

      setRundownToDelete(null);

      setSuccessMessage(
        "La escaleta fue eliminada correctamente."
      );
    } catch (error) {
      setWorkspaceError(
        error.message ||
          "No fue posible eliminar la escaleta."
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ORGANIZACIÓN EDITORIAL"
        title="Escaletas"
        description="Organiza el orden de las noticias y prepara la programación que será presentada."
      />

      {loading && (
        <LoadingState message="Cargando las escaletas y noticias disponibles..." />
      )}

      {!loading && loadError && (
        <ErrorState
          message={loadError}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loading && !loadError && (
        <>
          {successMessage && (
            <div
              className="success-alert"
              role="status"
            >
              {successMessage}
            </div>
          )}

          {workspaceError && !consoleOpen && (
            <div
              className="form-alert"
              role="alert"
            >
              {workspaceError}
            </div>
          )}

          <div className="rundowns-overview">
            <RundownForm
              saving={creating}
              error={createError}
              onSubmit={handleCreateRundown}
            />

            <section
              className="rundowns-list-panel"
              aria-labelledby="rundowns-list-title"
            >
              <header className="rundowns-list-heading">
                <div>
                  <span>EDICIONES REGISTRADAS</span>

                  <h2 id="rundowns-list-title">
                    Escaletas disponibles
                  </h2>
                </div>

                <strong>{rundowns.length}</strong>
              </header>

              {rundowns.length > 0 ? (
                <div className="rundowns-list">
                  {rundowns.map((rundown) => (
                    <RundownCard
                      key={rundown.id}
                      rundown={rundown}
                      news={news}
                      selected={
                        rundown.id ===
                        selectedRundownId
                      }
                      deleting={
                        deletingId === rundown.id
                      }
                      onSelect={
                        handleOpenRundown
                      }
                      onEdit={
                        requestEditRundown
                      }
                      onDelete={
                        requestDeleteRundown
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No hay escaletas registradas"
                  description="Crea la primera edición informativa utilizando el formulario."
                />
              )}
            </section>
          </div>
        </>
      )}

      {consoleOpen && selectedRundown && (
        <div
          className="rundown-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updating
            ) {
              handleCloseConsole();
            }
          }}
        >
          <section
            className="rundown-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rundown-modal-title"
          >
            <header className="rundown-modal-header">
              <div>
                <span>CONSOLA EDITORIAL</span>

                <h2 id="rundown-modal-title">
                  Edición de escaleta
                </h2>
              </div>

              <button
                ref={closeModalButtonRef}
                className="rundown-modal-close"
                type="button"
                disabled={updating}
                aria-label="Cerrar edición"
                title="Cerrar edición"
                onClick={handleCloseConsole}
              >
                ×
              </button>
            </header>

            <div className="rundown-modal-content">
              {workspaceError && (
                <div
                  className="form-alert"
                  role="alert"
                >
                  {workspaceError}
                </div>
              )}

              <RundownConsole
                rundown={selectedRundown}
                news={news}
                categories={categories}
                updating={updating}
                onUpdateNewsIds={
                  handleUpdateNewsIds
                }
              />
            </div>
          </section>
        </div>
      )}

      <RundownEditDialog
        open={Boolean(rundownToEdit)}
        rundown={rundownToEdit}
        saving={editing}
        error={editError}
        onSubmit={handleEditRundown}
        onCancel={() => {
          if (!editing) {
            setRundownToEdit(null);
            setEditError("");
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(rundownToDelete)}
        title="Eliminar escaleta"
        message={
          rundownToDelete
            ? `¿Deseas eliminar “${rundownToDelete.name}”? Esta acción no eliminará las noticias asociadas.`
            : ""
        }
        confirmText="Eliminar escaleta"
        danger
        loading={Boolean(deletingId)}
        onConfirm={confirmDeleteRundown}
        onCancel={() => {
          if (!deletingId) {
            setRundownToDelete(null);
          }
        }}
      />
    </>
  );
}

export default RundownsPage;