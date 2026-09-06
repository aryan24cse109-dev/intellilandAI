import DocumentStatusBadge from "./DocumentStatusBadge";

function formatLabel(value) {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function DocumentInfoCard({
  document,
}) {
  if (!document) {
    return null;
  }

  const name =
    document?.original_filename ??
    document?.filename ??
    document?.file_name ??
    document?.name ??
    "Untitled Document";

  const id =
    document?.id ??
    document?.document_id;

  const type =
    document?.document_type ??
    document?.type;

  const status =
    document?.processing_status ??
    document?.status;

  const quality =
    document?.quality_status ??
    document?.quality;

  const uploadedAt =
    document?.created_at ??
    document?.createdAt ??
    document?.uploaded_at;

  const mimeType =
    document?.mime_type ??
    document?.mimeType;

  const fileSize =
    document?.file_size ??
    document?.size;

  return (
    <div className="document-info-card">
      <div className="document-info-header">
        <div>
          <span className="document-info-label">
            DOCUMENT
          </span>

          <h2>{name}</h2>
        </div>

        <DocumentStatusBadge
          status={status}
        />
      </div>

      <div className="document-info-grid">
        <div className="document-info-item">
          <span>Document ID</span>
          <strong>{id ?? "—"}</strong>
        </div>

        <div className="document-info-item">
          <span>Document Type</span>
          <strong>
            {formatLabel(type)}
          </strong>
        </div>

        <div className="document-info-item">
          <span>Quality</span>
          <strong>
            {formatLabel(quality)}
          </strong>
        </div>

        <div className="document-info-item">
          <span>File Type</span>
          <strong>
            {mimeType ?? "—"}
          </strong>
        </div>

        <div className="document-info-item">
          <span>File Size</span>
          <strong>
            {fileSize
              ? `${(
                  Number(fileSize) /
                  1024 /
                  1024
                ).toFixed(2)} MB`
              : "—"}
          </strong>
        </div>

        <div className="document-info-item">
          <span>Uploaded</span>
          <strong>
            {uploadedAt
              ? new Date(
                  uploadedAt
                ).toLocaleString("en-IN")
              : "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default DocumentInfoCard;