function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

function getActionClass(action) {
  if (!action) {
    return "audit-action-default";
  }

  const normalized = action.toUpperCase();

  if (
    normalized.includes("ACCEPT") ||
    normalized.includes("APPROVE")
  ) {
    return "audit-action-success";
  }

  if (
    normalized.includes("REJECT") ||
    normalized.includes("DELETE")
  ) {
    return "audit-action-danger";
  }

  if (
    normalized.includes("CORRECT") ||
    normalized.includes("UPDATE") ||
    normalized.includes("EDIT")
  ) {
    return "audit-action-warning";
  }

  return "audit-action-default";
}

function AuditTable({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="audit-empty-state">
        <div className="audit-empty-icon">↻</div>

        <h3>No audit activity</h3>

        <p>
          No audit actions have been recorded for this
          document yet.
        </p>
      </div>
    );
  }

  return (
    <div className="audit-table-wrapper">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Field</th>
            <th>Previous Value</th>
            <th>New Value</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
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
              "—";

            const oldValue =
              log.old_value ??
              log.previous_value ??
              "—";

            const newValue =
              log.new_value ??
              log.updated_value ??
              log.corrected_value ??
              "—";

            const details =
              log.notes ||
              log.description ||
              log.message ||
              "—";

            return (
              <tr key={log.id || index}>
                <td>
                  <span className="audit-date">
                    {formatDate(
                      log.created_at ||
                        log.timestamp ||
                        log.action_time
                    )}
                  </span>
                </td>

                <td>
                  <div className="audit-user">
                    <div className="audit-user-avatar">
                      {String(user)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span>{user}</span>
                  </div>
                </td>

                <td>
                  <span
                    className={`audit-action ${getActionClass(
                      action
                    )}`}
                  >
                    {action}
                  </span>
                </td>

                <td>
                  <strong>{field}</strong>
                </td>

                <td>
                  <span className="audit-value old">
                    {String(oldValue)}
                  </span>
                </td>

                <td>
                  <span className="audit-value new">
                    {String(newValue)}
                  </span>
                </td>

                <td>
                  <span className="audit-details">
                    {details}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AuditTable;