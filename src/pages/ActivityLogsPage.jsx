import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import ActivityFilters from "../components/activity/ActivityFilters.jsx";
import ActivityLogItem from "../components/activity/ActivityLogItem.jsx";

import { activityService } from "../services/activityService.js";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es");
}

function ActivityLogsPage() {
  const [activities, setActivities] = useState([]);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [module, setModule] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivities() {
      setLoading(true);
      setError("");

      try {
        const data = await activityService.getAll(
          controller.signal
        );

        if (controller.signal.aborted) {
          return;
        }

        setActivities(
          Array.isArray(data) ? data : []
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              "No fue posible cargar el historial."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return activities
      .filter((activity) => {
        const searchableContent = [
          activity.userName,
          activity.userId,
          activity.description,
          activity.action,
          activity.module,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es");

        const matchesSearch =
          normalizedSearch === "" ||
          searchableContent.includes(
            normalizedSearch
          );

        const matchesAction =
          action === "all" ||
          activity.action === action;

        const matchesModule =
          module === "all" ||
          activity.module === module;

        return (
          matchesSearch &&
          matchesAction &&
          matchesModule
        );
      })
      .sort(
        (firstActivity, secondActivity) =>
          new Date(
            secondActivity.createdAt
          ).getTime() -
          new Date(
            firstActivity.createdAt
          ).getTime()
      );
  }, [activities, search, action, module]);

  const statistics = useMemo(() => {
    const today = new Date().toDateString();

    const todayActivities = activities.filter(
      (activity) => {
        const activityDate = new Date(
          activity.createdAt
        );

        return (
          !Number.isNaN(activityDate.getTime()) &&
          activityDate.toDateString() === today
        );
      }
    ).length;

    const successfulLogins = activities.filter(
      (activity) =>
        activity.action === "login_success"
    ).length;

    const identifiedUsers = new Set(
      activities
        .filter(
          (activity) =>
            activity.userId &&
            activity.userId !== "system"
        )
        .map((activity) => activity.userId)
    ).size;

    return {
      total: activities.length,
      today: todayActivities,
      logins: successfulLogins,
      users: identifiedUsers,
    };
  }, [activities]);

  function handleClearFilters() {
    setSearch("");
    setAction("all");
    setModule("all");
  }

  function handleReload() {
    setReloadKey(
      (currentValue) => currentValue + 1
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="CONTROL DEL SISTEMA"
        title="Historial de actividad"
        description="Consulta los accesos y las acciones realizadas dentro de OnAir Studio AI."
      >
        <button
          type="button"
          className="button button-primary"
          disabled={loading}
          onClick={handleReload}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar historial"}
        </button>
      </PageHeader>

      {loading && (
        <LoadingState message="Consultando la actividad del sistema..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={handleReload}
        />
      )}

      {!loading && !error && (
        <>
          <section
            className="activity-statistics"
            aria-label="Resumen del historial"
          >
            <article className="activity-stat-card">
              <span>Total de actividades</span>
              <strong>{statistics.total}</strong>
              <small>Registros almacenados</small>
            </article>

            <article className="activity-stat-card activity-stat-cyan">
              <span>Actividad de hoy</span>
              <strong>{statistics.today}</strong>
              <small>Eventos recientes</small>
            </article>

            <article className="activity-stat-card activity-stat-green">
              <span>Inicios de sesión</span>
              <strong>{statistics.logins}</strong>
              <small>Accesos correctos</small>
            </article>

            <article className="activity-stat-card activity-stat-purple">
              <span>Usuarios identificados</span>
              <strong>{statistics.users}</strong>
              <small>Usuarios con actividad</small>
            </article>
          </section>

          <ActivityFilters
            search={search}
            action={action}
            module={module}
            onSearchChange={setSearch}
            onActionChange={setAction}
            onModuleChange={setModule}
            onClear={handleClearFilters}
          />

          <div className="activity-results-heading">
            <p role="status">
              <strong>
                {filteredActivities.length}
              </strong>{" "}
              {filteredActivities.length === 1
                ? "actividad encontrada"
                : "actividades encontradas"}
            </p>

            <span>
              Ordenadas desde la más reciente
            </span>
          </div>

          {filteredActivities.length > 0 ? (
            <section
              className="activity-log-list"
              aria-label="Actividades registradas"
            >
              {filteredActivities.map(
                (activity) => (
                  <ActivityLogItem
                    key={activity.id}
                    activity={activity}
                  />
                )
              )}
            </section>
          ) : (
            <EmptyState
              title="No encontramos actividades"
              description={
                activities.length === 0
                  ? "Todavía no existen movimientos registrados en el sistema."
                  : "Prueba utilizando otra búsqueda o cambia los filtros seleccionados."
              }
            />
          )}
        </>
      )}
    </>
  );
}

export default ActivityLogsPage;