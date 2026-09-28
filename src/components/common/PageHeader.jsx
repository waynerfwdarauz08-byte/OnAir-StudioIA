function PageHeader({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <header className="page-header">
      <div className="page-header-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>

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