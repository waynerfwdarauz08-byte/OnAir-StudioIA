import {
  useEffect,
  useRef,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import TeleprompterControls from "../components/teleprompter/TeleprompterControls.jsx";
import TeleprompterDisplay from "../components/teleprompter/TeleprompterDisplay.jsx";
import PresenterRecorder from "../components/teleprompter/PresenterRecorder.jsx";

import { transmissionService } from "../services/transmissionService.js";
import { newsService } from "../services/newsService.js";

function TeleprompterPage() {
  const teleprompterRef = useRef(null);
  const displaySectionRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const currentNewsIdRef = useRef(null);
  const startTimerRef = useRef(null);

  const [transmission, setTransmission] = useState(null);
  const [newsItem, setNewsItem] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);
  const [fontSize, setFontSize] = useState(56);
  const [highContrast, setHighContrast] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let stopped = false;
    let timeoutId;
    let controller;

    async function loadTransmission() {
      controller = new AbortController();

      try {
        const currentTransmission =
          await transmissionService.getCurrent(
            controller.signal
          );

        if (stopped) {
          return;
        }

        setTransmission(currentTransmission);
        setError("");

        const currentNewsId =
          currentTransmission?.newsId || null;

        if (!currentNewsId) {
          if (currentNewsIdRef.current !== null) {
            currentNewsIdRef.current = null;
            setNewsItem(null);
            setPlaying(false);
          }

          return;
        }

        if (currentNewsIdRef.current === currentNewsId) {
          return;
        }

        const currentNews = await newsService.getById(
          currentNewsId,
          controller.signal
        );

        if (stopped) {
          return;
        }

        currentNewsIdRef.current = currentNewsId;
        setNewsItem(currentNews);
        setPlaying(false);

        window.requestAnimationFrame(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0;
          }
        });
      } catch (loadError) {
        if (
          !stopped &&
          loadError.name !== "AbortError"
        ) {
          setError(
            loadError.message ||
              "No fue posible consultar la transmisión."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);

          timeoutId = window.setTimeout(
            loadTransmission,
            2500
          );
        }
      }
    }

    loadTransmission();

    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!playing || !newsItem || !scrollArea) {
      return undefined;
    }

    let animationFrameId;
    let previousTime = null;
    let fractionalPixels = 0;

    // Evita que CSS interpole cada movimiento automático.
    scrollArea.style.scrollBehavior = "auto";

    function moveText(currentTime) {
      const currentScrollArea = scrollAreaRef.current;

      if (!currentScrollArea) {
        return;
      }

      if (previousTime === null) {
        previousTime = currentTime;
      }

      const elapsedTime = Math.min(
        currentTime - previousTime,
        100
      );

      previousTime = currentTime;

      const maximumScroll =
        currentScrollArea.scrollHeight -
        currentScrollArea.clientHeight;

      if (maximumScroll <= 0) {
        setPlaying(false);
        return;
      }

      // La velocidad se expresa en píxeles por segundo.
      fractionalPixels +=
        (speed * elapsedTime) / 1000;

      const wholePixels = Math.floor(fractionalPixels);

      if (wholePixels > 0) {
        const nextPosition = Math.min(
          currentScrollArea.scrollTop + wholePixels,
          maximumScroll
        );

        currentScrollArea.scrollTop = nextPosition;
        fractionalPixels -= wholePixels;
      }

      if (
        currentScrollArea.scrollTop >=
        maximumScroll - 1
      ) {
        setPlaying(false);
        return;
      }

      animationFrameId =
        window.requestAnimationFrame(moveText);
    }

    animationFrameId =
      window.requestAnimationFrame(moveText);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [playing, speed, newsItem?.id]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement ===
          teleprompterRef.current
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(startTimerRef.current);
    };
  }, []);

  function handlePlayPause() {
    window.clearTimeout(startTimerRef.current);

    if (playing) {
      setPlaying(false);
      return;
    }

    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    const maximumScroll =
      scrollArea.scrollHeight - scrollArea.clientHeight;

    const reachedEnd =
      maximumScroll > 0 &&
      scrollArea.scrollTop >= maximumScroll - 2;

    if (reachedEnd) {
      scrollArea.scrollTop = 0;
    }

    displaySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    startTimerRef.current = window.setTimeout(() => {
      setPlaying(true);

      scrollAreaRef.current?.focus({
        preventScroll: true,
      });
    }, 450);
  }

  function handleRestart() {
    window.clearTimeout(startTimerRef.current);
    setPlaying(false);

    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }

    displaySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleFullscreenToggle() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await teleprompterRef.current?.requestFullscreen();
      }
    } catch {
      setError(
        "El navegador no permitió activar la pantalla completa."
      );
    }
  }

  function handleRetry() {
    setLoading(true);
    setError("");
    currentNewsIdRef.current = null;

    setReloadKey((currentValue) => currentValue + 1);
  }

  const isOnAir = Boolean(transmission?.onAir);

  return (
    <>
      <PageHeader
        eyebrow="PRESENTACIÓN"
        title="Teleprompter"
        description="Visualiza el guion activo, controla su desplazamiento y graba la presentación."
      />

      {loading && !newsItem && (
        <LoadingState message="Consultando el contenido de la transmisión..." />
      )}

      {!loading && error && !newsItem && (
        <ErrorState
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && (
        <div
          ref={teleprompterRef}
          className={`teleprompter-workspace ${
            highContrast ? "high-contrast" : ""
          } ${fullscreen ? "is-fullscreen" : ""}`}
        >
          <div className="teleprompter-workspace-bar">
            <div>
              <span className="teleprompter-workspace-label">
                CABINA DE PRESENTACIÓN
              </span>

              <strong>
                {isOnAir
                  ? "Transmisión activa"
                  : "Control en espera"}
              </strong>
            </div>

            <div
              className={`teleprompter-connection ${
                isOnAir ? "on-air" : ""
              }`}
              role="status"
            >
              <span aria-hidden="true" />
              {isOnAir ? "AL AIRE" : "EN ESPERA"}
            </div>
          </div>

          {error && newsItem && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}

          <TeleprompterControls
            playing={playing}
            speed={speed}
            fontSize={fontSize}
            highContrast={highContrast}
            fullscreen={fullscreen}
            disabled={!newsItem}
            onPlayPause={handlePlayPause}
            onRestart={handleRestart}
            onSpeedChange={setSpeed}
            onFontSizeChange={setFontSize}
            onContrastToggle={() =>
              setHighContrast((currentValue) => !currentValue)
            }
            onFullscreenToggle={handleFullscreenToggle}
          />

          <PresenterRecorder />

          <div
            ref={displaySectionRef}
            className="teleprompter-display-section"
          >
            <TeleprompterDisplay
              newsItem={newsItem}
              onAir={isOnAir}
              fontSize={fontSize}
              containerRef={scrollAreaRef}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default TeleprompterPage;