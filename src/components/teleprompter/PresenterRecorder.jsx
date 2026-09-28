import {
  useEffect,
  useRef,
  useState,
} from "react";

function formatRecordingTime(seconds) {
  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function getSupportedMimeType() {
  if (
    typeof MediaRecorder ===
    "undefined"
  ) {
    return "";
  }

  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return (
    types.find((type) =>
      MediaRecorder.isTypeSupported(
        type
      )
    ) || ""
  );
}

function PresenterRecorder() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedUrlRef = useRef("");

  const [
    cameraActive,
    setCameraActive,
  ] = useState(false);

  const [
    recording,
    setRecording,
  ] = useState(false);

  const [
    recordingTime,
    setRecordingTime,
  ] = useState(0);

  const [
    recordedUrl,
    setRecordedUrl,
  ] = useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const timer =
      window.setInterval(() => {
        setRecordingTime(
          (currentValue) =>
            currentValue + 1
        );
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [recording]);

  useEffect(() => {
    return () => {
      if (
        recorderRef.current?.state ===
        "recording"
      ) {
        recorderRef.current.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      if (recordedUrlRef.current) {
        URL.revokeObjectURL(
          recordedUrlRef.current
        );
      }
    };
  }, []);

  async function activateCamera() {
    setError("");

    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {
      setError(
        "Este navegador no permite utilizar la cámara y el micrófono."
      );

      return null;
    }

    try {
      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            video: {
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;
      }

      setCameraActive(true);

      return stream;
    } catch (cameraError) {
      if (
        cameraError.name ===
        "NotAllowedError"
      ) {
        setError(
          "Debes permitir el acceso a la cámara y al micrófono."
        );
      } else if (
        cameraError.name ===
        "NotFoundError"
      ) {
        setError(
          "No se encontró una cámara o un micrófono disponible."
        );
      } else {
        setError(
          "No fue posible activar la cámara."
        );
      }

      return null;
    }
  }

  function deactivateCamera() {
    if (
      recorderRef.current?.state ===
      "recording"
    ) {
      recorderRef.current.stop();
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraActive(false);
    setRecording(false);
    setRecordingTime(0);
  }

  async function startRecording() {
    setError("");

    let stream =
      streamRef.current;

    if (!stream) {
      stream =
        await activateCamera();
    }

    if (!stream) {
      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      setError(
        "Este navegador no permite realizar grabaciones."
      );

      return;
    }

    try {
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(
          recordedUrlRef.current
        );

        recordedUrlRef.current = "";
        setRecordedUrl("");
      }

      const mimeType =
        getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        if (
          chunksRef.current.length ===
          0
        ) {
          return;
        }

        const recordingBlob =
          new Blob(
            chunksRef.current,
            {
              type:
                recorder.mimeType ||
                "video/webm",
            }
          );

        const recordingUrl =
          URL.createObjectURL(
            recordingBlob
          );

        recordedUrlRef.current =
          recordingUrl;

        setRecordedUrl(
          recordingUrl
        );

        setRecording(false);
      };

      recorder.start(1000);

      setRecordingTime(0);
      setRecording(true);
    } catch {
      setError(
        "No fue posible iniciar la grabación."
      );
    }
  }

  function stopRecording() {
    if (
      recorderRef.current?.state ===
      "recording"
    ) {
      recorderRef.current.stop();
    }
  }

  function deleteRecording() {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(
        recordedUrlRef.current
      );
    }

    recordedUrlRef.current = "";
    chunksRef.current = [];

    setRecordedUrl("");
    setRecordingTime(0);
  }

  return (
    <section
      className={`presenter-recorder ${
        recording
          ? "is-recording"
          : ""
      }`}
      aria-labelledby="presenter-recorder-title"
    >
      {recording && (
        <div
          className="presenter-recording-floating"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <strong>GRABANDO</strong>

          <time>
            {formatRecordingTime(
              recordingTime
            )}
          </time>
        </div>
      )}

      <div className="presenter-recorder-preview">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Vista previa de la cámara"
        />

        {!cameraActive && (
          <div className="presenter-camera-placeholder">
            <span aria-hidden="true">
              ●
            </span>

            <p>
              Cámara desactivada
            </p>
          </div>
        )}

        {recording && (
          <div
            className="presenter-recording-badge"
            role="status"
          >
            <span aria-hidden="true" />

            GRABANDO{" "}
            {formatRecordingTime(
              recordingTime
            )}
          </div>
        )}
      </div>

      <div className="presenter-recorder-content">
        <div>
          <span className="presenter-recorder-label">
            SIMULACIÓN DE PRESENTACIÓN
          </span>

          <h2 id="presenter-recorder-title">
            Cámara del presentador
          </h2>

          <p>
            Activa la cámara y el
            micrófono para grabar tu
            presentación mientras lees
            el guion.
          </p>
        </div>

        {error && (
          <div
            className="presenter-recorder-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="presenter-recorder-actions">
          {!cameraActive ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={activateCamera}
            >
              Activar cámara
            </button>
          ) : (
            <button
              type="button"
              className="button button-secondary"
              disabled={recording}
              onClick={
                deactivateCamera
              }
            >
              Apagar cámara
            </button>
          )}

          {!recording ? (
            <button
              type="button"
              className="button button-primary"
              onClick={startRecording}
            >
              Iniciar grabación
            </button>
          ) : (
            <button
              type="button"
              className="button button-danger"
              onClick={stopRecording}
            >
              Detener grabación
            </button>
          )}
        </div>

        <small className="presenter-recorder-privacy">
          La grabación permanece en este
          dispositivo y no se envía al
          servidor.
        </small>
      </div>

      {recordedUrl && (
        <div className="presenter-recording-result">
          <div>
            <span>
              GRABACIÓN FINALIZADA
            </span>

            <strong>
              Vista previa del resultado
            </strong>
          </div>

          <video
            src={recordedUrl}
            controls
            playsInline
            aria-label="Grabación de la presentación"
          />

          <div className="presenter-recording-actions">
            <a
              className="button button-primary"
              href={recordedUrl}
              download={`presentacion-${Date.now()}.webm`}
            >
              Descargar grabación
            </a>

            <button
              type="button"
              className="button button-secondary"
              onClick={
                deleteRecording
              }
            >
              Eliminar grabación
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default PresenterRecorder;