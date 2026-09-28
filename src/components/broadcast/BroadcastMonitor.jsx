function BroadcastMonitor({
  source,
  mode = "idle",
  large = false,
  lowerThird = "",
  title = "",
  onClick,
  onDoubleClick,
}) {
  const isProgram = mode === "program";
  const isPreview = mode === "preview";

  const statusLabel = isProgram
    ? "PGM · AL AIRE"
    : isPreview
      ? "PVW · PREPARADA"
      : "SEÑAL DISPONIBLE";

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

          <strong>{source.name}</strong>
        </div>

        <span className="broadcast-signal-status">
          <i />
          {statusLabel}
        </span>
      </header>

      <div className="broadcast-monitor-screen">
        <img
          src={source.image}
          alt={`Señal de ${source.name}`}
        />

        {isProgram && (
          <span className="broadcast-live-corner">
            EN VIVO
          </span>
        )}

        {isPreview && (
          <span className="broadcast-preview-corner">
            PREVIEW
          </span>
        )}

        {isProgram && lowerThird && (
          <div className="broadcast-lower-third">
            <span>ONAIR STUDIO</span>

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