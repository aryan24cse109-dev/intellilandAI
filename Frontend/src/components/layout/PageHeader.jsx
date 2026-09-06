function PageHeader({
  title,
  description,
  actions,
  breadcrumbs = [],
}) {
  return (
    <div className="page-header">
      <div className="page-header-main">
        {breadcrumbs.length > 0 && (
          <div className="page-breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <span key={`${item}-${index}`}>
                {item}

                {index < breadcrumbs.length - 1 && (
                  <span className="breadcrumb-separator">
                    /
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;