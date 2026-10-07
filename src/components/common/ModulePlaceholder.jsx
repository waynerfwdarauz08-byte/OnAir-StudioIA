import useTranslation from "../../hooks/useTranslation.js";
import PageHeader from "./PageHeader.jsx";

function ModulePlaceholder({
  eyebrow,
  title,
  description,
  status = "MÓDULO PREPARADO",
}) {
  const { translate } = useTranslation();
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <section className="placeholder-panel">
        <div className="placeholder-icon" aria-hidden="true">
          +
        </div>

        <div>
          <span className="placeholder-status">{translate(status)}</span>
          <h2>{translate("La estructura de esta sección está lista")}</h2>
          <p>{translate("Las funciones de este módulo se incorporarán en las siguientes etapas del proyecto.")}</p>
        </div>
      </section>
    </>
  );
}

export default ModulePlaceholder;
