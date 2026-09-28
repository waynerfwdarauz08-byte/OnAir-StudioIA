function TeleprompterDisplay({
  newsItem,
  onAir = false,
  fontSize = 56,
  containerRef,
}) {
  const script =
    newsItem?.script?.trim() ||
    newsItem?.summary?.trim() ||
    "";

  const paragraphs = script
    .split(/\n+/)
    .map((paragraph) =>
      paragraph.trim()
    )
    .filter(Boolean);

  return (
    <section
      className="teleprompter-display"
      aria-label="Pantalla del teleprompter"
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
              ? "CONTENIDO AL AIRE"
              : "FUERA DEL AIRE"}
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
            ? `Guion de ${newsItem.title}`
            : "No hay un guion activo"
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

            <h2>
              Esperando contenido
            </h2>

            <p>
              Selecciona una noticia desde
              Control al aire para mostrar su
              guion en esta pantalla.
            </p>
          </div>
        ) : (
          <article className="teleprompter-script">
            <div
              className="teleprompter-start-space"
              aria-hidden="true"
            />

            <header className="teleprompter-script-heading">
              <span>GUION ACTIVO</span>

              <h2>{newsItem.title}</h2>

              {newsItem.selectedLowerThird && (
                <div className="teleprompter-lower-third">
                  <span>CINTILLO</span>

                  <strong>
                    {
                      newsItem.selectedLowerThird
                    }
                  </strong>
                </div>
              )}
            </header>

            <div
              className="teleprompter-script-text"
              style={{
                "--teleprompter-font-size":
                  `${fontSize}px`,
              }}
            >
              {paragraphs.length > 0 ? (
                paragraphs.map(
                  (
                    paragraph,
                    index
                  ) => (
                    <p
                      key={`${paragraph}-${index}`}
                    >
                      {paragraph}
                    </p>
                  )
                )
              ) : (
                <p>
                  Esta noticia todavía no
                  tiene un guion disponible.
                </p>
              )}
            </div>

            <div
              className="teleprompter-end-message"
              role="note"
            >
              <span>FIN DEL GUION</span>

              <strong>
                {newsItem.title}
              </strong>
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