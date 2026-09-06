function DocumentStatusBadge({ status }) {
  const normalizedStatus = String(
    status || "UNKNOWN"
  )
    .toUpperCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");

  const statusMap = {
    UPLOADED: {
      label: "Uploaded",
      className: "document-status-uploaded",
    },

    PREPROCESSING: {
      label: "Preprocessing",
      className: "document-status-processing",
    },

    PROCESSING: {
      label: "Processing",
      className: "document-status-processing",
    },

    COMPLETED: {
      label: "Completed",
      className: "document-status-completed",
    },

    NEEDS_REVIEW: {
      label: "Needs Review",
      className: "document-status-review",
    },

    FAILED: {
      label: "Failed",
      className: "document-status-failed",
    },

    UNKNOWN: {
      label: "Unknown",
      className: "document-status-unknown",
    },
  };

  const config =
    statusMap[normalizedStatus] ||
    statusMap.UNKNOWN;

  return (
    <span
      className={`document-status-badge ${config.className}`}
    >
      <span className="document-status-dot" />

      {config.label}
    </span>
  );
}

export default DocumentStatusBadge;