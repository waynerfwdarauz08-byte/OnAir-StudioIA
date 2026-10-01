import useAccessibility from "../../hooks/useAccessibility.js";

function TeleprompterDisplay({
  newsItem,
  onAir = false,
  fontSize = 56,
  containerRef,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const script =
    newsItem?.script?.trim() ||
    newsItem?.summary?.trim() ||
    "";

  const paragraphs = script
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section
      className="teleprompter-display"
      aria-label={isEnglish ? "Teleprompter screen" : "Pantalla del teleprompter"}
    >
      <header className="teleprompter-display-header">
        <div className="teleprompter-live-status">
          <span
            className={`teleprompter-live-dot ${
              onAir ? "active" : ""
            }`}
            aria-hidden="true"
          />

          <span>
            {onAir
              ? isEnglish ? "ON-AIR CONTENT" : "CONTENIDO AL AIRE"
              : isEnglish ? "OFF AIR" : "FUERA DEL AIRE"}
          </span>
        </div>

        {newsItem && (
          <span className="teleprompter-news-id">
            {newsItem.id}
          </span>
        )}
      </header>

      <div
        ref={containerRef}
        className="teleprompter-scroll-area"
        tabIndex="0"
        aria-live="polite"
        aria-label={
          newsItem
            ? `${isEnglish ? "Script for" : "Guion de"} ${newsItem.title}`
            : isEnglish ? "There is no active script" : "No hay un guion activo"
        }
      >
        {!newsItem ? (
          <div className="teleprompter-empty-state">
            <span
              className="teleprompter-empty-icon"
              aria-hidden="true"
            >
              T
            </span>

            <h2>{isEnglish ? "Waiting for content" : "Esperando contenido"}</h2>

            <p>
              {isEnglish ? "Select a news item from On-air control to show its script on this screen." : "Selecciona una noticia desde Control al aire para mostrar su guion en esta pantalla."}
            </p>
          </div>
        ) : (
          <article className="teleprompter-script">
            <div
              className="teleprompter-start-space"
              aria-hidden="true"
            />

            <header className="teleprompter-script-heading">
              <span>{isEnglish ? "ACTIVE SCRIPT" : "GUION ACTIVO"}</span>

              <h2>{newsItem.title}</h2>

              {newsItem.selectedLowerThird && (
                <div className="teleprompter-lower-third">
                  <span>{isEnglish ? "LOWER THIRD" : "CINTILLO"}</span>

                  <strong>
                    {newsItem.selectedLowerThird}
                  </strong>
                </div>
              )}
            </header>

            <div
              className="teleprompter-script-text"
              style={{
                "--teleprompter-font-size": `${fontSize}px`,
              }}
            >
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p
                    key={`${paragraph}-${index}`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p style={{ fontSize: `${fontSize}px` }}>
                  {isEnglish ? "This news item does not have an available script yet." : "Esta noticia todavía no tiene un guion disponible."}
                </p>
              )}
            </div>

            <div
              className="teleprompter-end-message"
              role="note"
            >
              <span>{isEnglish ? "END OF SCRIPT" : "FIN DEL GUION"}</span>

              <strong>{newsItem.title}</strong>
            </div>

            <div
              className="teleprompter-end-space"
              aria-hidden="true"
            />
          </article>
        )}
      </div>
    </section>
  );
}

export default TeleprompterDisplay;
