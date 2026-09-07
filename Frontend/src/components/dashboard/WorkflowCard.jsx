import { Link } from "react-router-dom";

function WorkflowCard({
  icon,
  step,
  title,
  description,
  count,
  status = "normal",
  path,
}) {
  const content = (
    <>
      <div className="workflow-card-top">
        <div className="workflow-card-icon">
          {icon}
        </div>

        <span
          className={`workflow-card-status workflow-status-${status}`}
        >
          {count ?? 0}
        </span>
      </div>

      <div className="workflow-card-content">
        <span className="workflow-card-step">
          STEP {step}
        </span>

        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <div className="workflow-card-arrow">
        →
      </div>
    </>
  );

  if (path) {
    return (
      <Link
        to={path}
        className="workflow-card"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="workflow-card">
      {content}
    </div>
  );
}

export default WorkflowCard;