function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">
          {icon}
        </div>

        {subtitle && (
          <span className="stat-card-subtitle">
            {subtitle}
          </span>
        )}
      </div>

      <div className="stat-card-content">
        <span className="stat-card-title">
          {title}
        </span>

        <strong className="stat-card-value">
          {value}
        </strong>
      </div>
    </div>
  );
}

export default StatCard;