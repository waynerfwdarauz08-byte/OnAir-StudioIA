import SpeechButton from "./SpeechButton.jsx";

function PageHeader({
  eyebrow,
  title,
  description,
  children,
}) {
  const textToRead = [title, description]
    .filter(Boolean)
    .join(". ");

  return (
    <header className="page-header">
      <div className="page-header-content">
        <p className="eyebrow">{eyebrow}</p>

        <div className="page-header-title-row">
          <h1>{title}</h1>
          <SpeechButton text={textToRead} />
        </div>

        {description && (
          <p className="page-description">{description}</p>
        )}
      </div>

      {children && (
        <div className="page-header-actions">
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;