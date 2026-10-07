import useTranslation from "../../hooks/useTranslation.js";
import useSystemSettings from "../../hooks/useSystemSettings.js";

function BroadcastMonitor({
  source,
  mode = "idle",
  large = false,
  lowerThird = "",
  title = "",
  onClick,
  onDoubleClick,
}) {
  const { translate } = useTranslation();
  const { channelName } = useSystemSettings();
  const isProgram = mode === "program";
  const isPreview = mode === "preview";

  const statusLabel = isProgram
    ? translate("PGM · AL AIRE")
    : isPreview
      ? translate("PVW · PREPARADA")
      : translate("SEÑAL DISPONIBLE");

  return (
    <article
      className={`broadcast-monitor ${
        large ? "is-large" : ""
      } ${
        isProgram
          ? "is-program"
          : isPreview
            ? "is-preview"
            : ""
      }`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? "0" : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(event) => {
        if (
          onClick &&
          (event.key === "Enter" ||
            event.key === " ")
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <header className="broadcast-monitor-header">
        <div>
          <span className="broadcast-source-code">
            {source.code}
          </span>

          <strong>{translate(source.name)}</strong>
        </div>

        <span className="broadcast-signal-status">
          <i />
          {statusLabel}
        </span>
      </header>

      <div className="broadcast-monitor-screen">
        <img
          src={source.image}
          alt={translate("Señal de {0}", {0: translate(source.name)})}
        />

        {isProgram && (
          <span className="broadcast-live-corner">{translate("EN VIVO")}</span>
        )}

        {isPreview && (
          <span className="broadcast-preview-corner">
            PREVIEW
          </span>
        )}

        {isProgram && lowerThird && (
          <div className="broadcast-lower-third">
            <span>{channelName}</span>

            <strong>{lowerThird}</strong>

            {title && <small>{title}</small>}
          </div>
        )}

        <div className="broadcast-safe-area">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <footer className="broadcast-monitor-footer">
        <span>{source.format}</span>

        <span>{source.latency}</span>

        <strong>
          <i />
          LOCKED
        </strong>
      </footer>
    </article>
  );
}

export default BroadcastMonitor;
