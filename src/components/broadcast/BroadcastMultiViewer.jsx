import BroadcastMonitor from "./BroadcastMonitor.jsx";

function BroadcastMultiViewer({
  sources = [],
  programSourceId,
  previewSourceId,
  lowerThird = "",
  title = "",
  onPreview,
  onTake,
}) {
  return (
    <section
      className="broadcast-multiviewer"
      aria-labelledby="multiviewer-title"
    >
      <header className="broadcast-section-heading">
        <div>
          <span>MULTIVIEWER</span>

          <h2 id="multiviewer-title">
            Matriz de señales
          </h2>
        </div>

        <p>
          Un clic prepara la señal en Preview. Doble clic la
          envía directamente al aire.
        </p>

        <div className="broadcast-status-legend">
          <span className="program-legend">
            <i />
            PGM
          </span>

          <span className="preview-legend">
            <i />
            PVW
          </span>
        </div>
      </header>

      <div className="broadcast-multiviewer-grid">
        {sources.map((source) => {
          let mode = "idle";

          if (source.id === programSourceId) {
            mode = "program";
          } else if (
            source.id === previewSourceId
          ) {
            mode = "preview";
          }

          return (
            <BroadcastMonitor
              key={source.id}
              source={source}
              mode={mode}
              lowerThird={lowerThird}
              title={title}
              onClick={() => onPreview(source.id)}
              onDoubleClick={() =>
                onTake(source.id)
              }
            />
          );
        })}
      </div>
    </section>
  );
}

export default BroadcastMultiViewer;