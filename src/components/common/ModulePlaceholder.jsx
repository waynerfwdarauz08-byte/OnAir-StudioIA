import PageHeader from "./PageHeader.jsx";

function ModulePlaceholder({
  eyebrow,
  title,
  description,
  status = "MÓDULO PREPARADO",
}) {
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
          <span className="placeholder-status">{status}</span>
          <h2>La estructura de esta sección está lista</h2>
          <p>
            Las funciones de este módulo se incorporarán en las siguientes
            etapas del proyecto.
          </p>
        </div>
      </section>
    </>
  );
}

export default ModulePlaceholder;