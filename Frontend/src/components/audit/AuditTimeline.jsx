function formatDate(dateValue) {
  if (!dateValue) {
    return "Unknown time";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

function getTimelineClass(action) {
  const normalized = String(action || "").toUpperCase();

  if (
    normalized.includes("ACCEPT") ||
    normalized.includes("APPROVE")
  ) {
    return "timeline-success";
  }

  if (
    normalized.includes("REJECT") ||
    normalized.includes("DELETE")
  ) {
    return "timeline-danger";
  }

  if (
    normalized.includes("CORRECT") ||
    normalized.includes("UPDATE") ||
    normalized.includes("EDIT")
  ) {
    return "timeline-warning";
  }

  return "timeline-default";
}

function AuditTimeline({ logs = [] }) {
  if (!logs.length) {
    return null;
  }

  return (
    <div className="audit-timeline">
      {logs.map((log, index) => {
        const action =
          log.action ||
          log.event_type ||
          log.activity ||
          "ACTION";

        const user =
          log.user_email ||
          log.email ||
          log.username ||
          log.user_name ||
          "System";

        const field =
          log.field_name ||
          log.field ||
          null;

        const description =
          log.notes ||
          log.description ||
          log.message ||
          "Audit action recorded.";

        const timelineClass =
          getTimelineClass(action);

        return (
          <div
            className="audit-timeline-item"
            key={log.id || index}
          >
            <div
              className={`audit-timeline-marker ${timelineClass}`}
            >
              ✓
            </div>

            <div className="audit-timeline-content">
              <div className="audit-timeline-top">
                <span
                  className={`audit-action ${timelineClass}`}
                >
                  {action}
                </span>

                <span className="audit-timeline-date">
                  {formatDate(
                    log.created_at ||
                      log.timestamp ||
                      log.action_time
                  )}
                </span>
              </div>

              <h4>
                {field
                  ? `${field} verification`
                  : "Document activity"}
              </h4>

              <p>{description}</p>

              <div className="audit-timeline-user">
                Performed by <strong>{user}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AuditTimeline;