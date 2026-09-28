import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import BroadcastSwitcher from "../components/broadcast/BroadcastSwitcher.jsx";
import BroadcastMultiViewer from "../components/broadcast/BroadcastMultiViewer.jsx";

import { transmissionService } from "../services/transmissionService.js";
import { newsService } from "../services/newsService.js";

import studioImage from "../assets/images/broadcast/studio.jpg";
import reporterImage from "../assets/images/broadcast/reporter.jpg";
import stadiumImage from "../assets/images/broadcast/stadium.jpg";
import pressConferenceImage from "../assets/images/broadcast/press-conference.jpg";

const BROADCAST_SOURCES = [
  {
    id: "cam-1",
    code: "CAM 1",
    shortName: "CAM1",
    name: "Estudio principal",
    image: studioImage,
    format: "126-SDI · 1080p",
    latency: "1.2 ms",
  },
  {
    id: "cam-2",
    code: "CAM 2",
    shortName: "CAM2",
    name: "Reportero en exteriores",
    image: reporterImage,
    format: "SRT · H.265",
    latency: "142 ms",
  },
  {
    id: "cam-3",
    code: "CAM 3",
    shortName: "CAM3",
    name: "Cobertura deportiva",
    image: stadiumImage,
    format: "HDR · 1080p",
    latency: "2.1 ms",
  },
  {
    id: "cam-4",
    code: "CAM 4",
    shortName: "CAM4",
    name: "Conferencia de prensa",
    image: pressConferenceImage,
    format: "HD-SDI · 1080p",
    latency: "3.4 ms",
  },
];

function BroadcastStudioPage() {
  const transitionTimerRef = useRef(null);

  const [programSourceId, setProgramSourceId] =
    useState("cam-1");

  const [previewSourceId, setPreviewSourceId] =
    useState("cam-2");

  const [transmission, setTransmission] =
    useState(null);

  const [news, setNews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] =
    useState(false);

  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBroadcastData(
      showLoading = false
    ) {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const [transmissionData, newsData] =
          await Promise.all([
            transmissionService.getCurrent(
              controller.signal
            ),
            newsService.getAll(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setTransmission(transmissionData);

        setNews(
          Array.isArray(newsData) ? newsData : []
        );

        setError("");
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message);
        }
      } finally {
        if (
          showLoading &&
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadBroadcastData(true);

    const synchronizationInterval =
      window.setInterval(() => {
        loadBroadcastData(false);
      }, 5000);

    return () => {
      controller.abort();

      window.clearInterval(
        synchronizationInterval
      );
    };
  }, [reloadKey]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(
          transitionTimerRef.current
        );
      }
    };
  }, []);

  const currentNews = useMemo(
    () =>
      news.find(
        (newsItem) =>
          newsItem.id === transmission?.newsId
      ) || null,
    [news, transmission]
  );

  const lowerThird =
    currentNews?.selectedLowerThird ||
    (transmission?.onAir
      ? "Transmisión informativa en vivo"
      : "Control de estudio preparado");

  const currentTitle =
    currentNews?.title ||
    (transmission?.onAir
      ? "Contenido editorial al aire"
      : "OnAir Studio AI");

  function handlePreview(sourceId) {
    if (
      transitioning ||
      sourceId === previewSourceId
    ) {
      return;
    }

    setPreviewSourceId(sourceId);
  }

  function handleDirectTake(sourceId) {
    if (
      transitioning ||
      sourceId === programSourceId
    ) {
      return;
    }

    const previousProgramSourceId =
      programSourceId;

    setProgramSourceId(sourceId);

    if (sourceId === previewSourceId) {
      setPreviewSourceId(
        previousProgramSourceId
      );
    }
  }

  function handleCut() {
    if (transitioning) {
      return;
    }

    const previousProgramSourceId =
      programSourceId;

    setProgramSourceId(previewSourceId);

    setPreviewSourceId(
      previousProgramSourceId
    );
  }

  function handleAutoTransition({
    duration = 1000,
  }) {
    if (transitioning) {
      return;
    }

    setTransitioning(true);

    transitionTimerRef.current =
      window.setTimeout(() => {
        const previousProgramSourceId =
          programSourceId;

        setProgramSourceId(
          previewSourceId
        );

        setPreviewSourceId(
          previousProgramSourceId
        );

        setTransitioning(false);
        transitionTimerRef.current = null;
      }, duration);
  }

  return (
    <>
      <PageHeader
        eyebrow="OPERACIONES DE ESTUDIO"
        title="Control de estudio"
        description="Supervisa las señales, prepara cámaras y controla el contenido visual enviado al aire."
      />

      {loading && (
        <LoadingState message="Inicializando las señales del estudio..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loading && !error && (
        <div className="broadcast-studio-page">
          <section className="broadcast-master-status">
            <div>
              <span
                className={
                  transmission?.onAir
                    ? "is-live"
                    : "is-standby"
                }
              >
                <i />

                {transmission?.onAir
                  ? "TRANSMISIÓN ACTIVA"
                  : "ESTUDIO EN ESPERA"}
              </span>

              <div>
                <strong>{currentTitle}</strong>

                <small>
                  {transmission?.onAir
                    ? "Sincronizado con Contenido al aire"
                    : "Inicia una transmisión desde el módulo Contenido al aire"}
                </small>
              </div>
            </div>

            <div className="broadcast-master-technical">
              <span>
                RES
                <strong>1920×1080</strong>
              </span>

              <span>
                FPS
                <strong>59.94</strong>
              </span>

              <span>
                SYNC
                <strong>0.0 μs</strong>
              </span>
            </div>
          </section>

          <BroadcastSwitcher
            sources={BROADCAST_SOURCES}
            programSourceId={programSourceId}
            previewSourceId={previewSourceId}
            lowerThird={lowerThird}
            title={currentTitle}
            transitioning={transitioning}
            onPreview={handlePreview}
            onTake={handleDirectTake}
            onCut={handleCut}
            onAuto={handleAutoTransition}
          />

          <BroadcastMultiViewer
            sources={BROADCAST_SOURCES}
            programSourceId={programSourceId}
            previewSourceId={previewSourceId}
            lowerThird={lowerThird}
            title={currentTitle}
            onPreview={handlePreview}
            onTake={handleDirectTake}
          />
        </div>
      )}
    </>
  );
}

export default BroadcastStudioPage;