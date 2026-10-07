import useTranslation from "../hooks/useTranslation.js";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import TransmissionSetup from "../components/onair/TransmissionSetup.jsx";
import OnAirConsole from "../components/onair/OnAirConsole.jsx";

import { transmissionService } from "../services/transmissionService.js";
import { rundownService } from "../services/rundownService.js";
import { newsService } from "../services/newsService.js";
import { categoryService } from "../services/categoryService.js";

import useAuth from "../hooks/useAuth.js";

function createEventId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `event-${crypto.randomUUID()}`;
  }

  return `event-${Date.now()}`;
}

function OnAirPage() {
  const { translate } = useTranslation();
  const { user } = useAuth();

  const [transmission, setTransmission] =
    useState(null);

  const [rundowns, setRundowns] = useState([]);
  const [news, setNews] = useState([]);
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [changing, setChanging] =
    useState(false);

  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOnAirModule() {
      setLoading(true);
      setLoadError("");

      try {
        const [
          transmissionData,
          rundownsData,
          newsData,
          categoriesData,
        ] = await Promise.all([
          transmissionService.getCurrent(
            controller.signal
          ),
          rundownService.getAll(
            controller.signal
          ),
          newsService.getAll(controller.signal),
          categoryService.getAll(
            controller.signal
          ),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setTransmission(transmissionData);

        setRundowns(
          Array.isArray(rundownsData)
            ? rundownsData
            : []
        );

        setNews(
          Array.isArray(newsData) ? newsData : []
        );

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : []
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

    loadOnAirModule();

    return () => controller.abort();
  }, [reloadKey]);

  const activeRundown = useMemo(
    () =>
      rundowns.find(
        (rundown) =>
          rundown.id ===
          transmission?.rundownId
      ) || null,
    [rundowns, transmission]
  );

  const activeNewsIds = useMemo(() => {
    if (
      !activeRundown ||
      !Array.isArray(activeRundown.newsIds)
    ) {
      return [];
    }

    return activeRundown.newsIds.filter(
      (newsId) =>
        news.some(
          (newsItem) => newsItem.id === newsId
        )
    );
  }, [activeRundown, news]);

  const currentNewsIndex =
    activeNewsIds.findIndex(
      (newsId) =>
        newsId === transmission?.newsId
    );

  const transmissionIsActive = Boolean(
    transmission?.onAir &&
      activeRundown &&
      activeNewsIds.length > 0
  );

  async function handleStart(rundownId) {
    const selectedRundown = rundowns.find(
      (rundown) => rundown.id === rundownId
    );

    if (!selectedRundown) {
      setActionError(
        "No encontramos la escaleta seleccionada."
      );

      return;
    }

    const firstNewsId =
      selectedRundown.newsIds?.find(
        (newsId) =>
          news.some(
            (newsItem) =>
              newsItem.id === newsId
          )
      );

    if (!firstNewsId) {
      setActionError(
        "La escaleta no contiene noticias disponibles."
      );

      return;
    }

    setChanging(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const currentDate =
        new Date().toISOString();

      const updatedTransmission =
        await transmissionService.partialUpdateCurrent(
          {
            rundownId: selectedRundown.id,
            newsId: firstNewsId,
            onAir: true,
            startedAt: currentDate,
            updatedAt: currentDate,
            updatedBy: user.id,
            eventId: createEventId(),
          }
        );

      setTransmission(updatedTransmission);
    } catch (error) {
      setActionError(
        error.message ||
          "No fue posible iniciar la transmisión."
      );
    } finally {
      setChanging(false);
    }
  }

  async function updateCurrentNews(newsId) {
    if (
      !transmissionIsActive ||
      !activeNewsIds.includes(newsId)
    ) {
      return false;
    }

    setChanging(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const updatedTransmission =
        await transmissionService.partialUpdateCurrent(
          {
            newsId,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id,
          }
        );

      setTransmission(updatedTransmission);

      return true;
    } catch (error) {
      setActionError(
        error.message ||
          "No fue posible cambiar la noticia al aire."
      );

      return false;
    } finally {
      setChanging(false);
    }
  }

  async function handlePrevious() {
    if (currentNewsIndex <= 0) {
      return;
    }

    await updateCurrentNews(
      activeNewsIds[currentNewsIndex - 1]
    );
  }

  async function handleNext() {
    if (
      currentNewsIndex < 0 ||
      currentNewsIndex >=
        activeNewsIds.length - 1
    ) {
      return;
    }

    await updateCurrentNews(
      activeNewsIds[currentNewsIndex + 1]
    );
  }

  async function handleStop() {
    setChanging(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const updatedTransmission =
        await transmissionService.partialUpdateCurrent(
          {
            newsId: null,
            rundownId: null,
            onAir: false,
            startedAt: null,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id,
            eventId: null,
          }
        );

      setTransmission(updatedTransmission);

      setSuccessMessage(
        "La transmisión fue finalizada correctamente."
      );

      return true;
    } catch (error) {
      setActionError(
        error.message ||
          "No fue posible finalizar la transmisión."
      );

      return false;
    } finally {
      setChanging(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={translate("CONTROL DE TRANSMISIÓN")}
        title={translate("Contenido al aire")}
        description={translate("Selecciona y controla el contenido que se mostrará en la interfaz del presentador.")}
      />

      {loading && (
        <LoadingState message={translate("Preparando la consola de transmisión...")} />
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
              {translate(successMessage)}
            </div>
          )}

          {transmissionIsActive ? (
            <OnAirConsole
              transmission={transmission}
              rundown={activeRundown}
              news={news}
              categories={categories}
              changing={changing}
              error={actionError}
              onSelectNews={
                updateCurrentNews
              }
              onPrevious={handlePrevious}
              onNext={handleNext}
              onStop={handleStop}
            />
          ) : (
            <TransmissionSetup
              rundowns={rundowns}
              news={news}
              starting={changing}
              error={actionError}
              onStart={handleStart}
            />
          )}
        </>
      )}
    </>
  );
}

export default OnAirPage;
