import useTranslation from "../../hooks/useTranslation.js";
import SpeechButton from "./SpeechButton.jsx";

function PageHeader({
  eyebrow,
  title,
  description,
  children,
}) {
  const { translate } = useTranslation();
  const textToRead = [translate(title), translate(description)]
    .filter(Boolean)
    .join(". ");

  return (
    <header className="page-header">
      <div className="page-header-content">
        <p className="eyebrow">{translate(eyebrow)}</p>

        <div className="page-header-title-row">
          <h1>{translate(title)}</h1>
          <SpeechButton text={textToRead} />
        </div>

        {description && (
          <p className="page-description">{translate(description)}</p>
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
