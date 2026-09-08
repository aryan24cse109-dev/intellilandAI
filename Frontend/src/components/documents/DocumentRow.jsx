import { Link } from "react-router-dom";

import DocumentStatusBadge from "./DocumentStatusBadge";

function formatDocumentType(type) {
  if (!type) return "—";

  return String(type)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DocumentRow({ document }) {
  // Backend documents.id is the UUID used by:
  // GET /api/documents/:id
  const id = document?.id;

  const name =
    document?.original_filename ??
    document?.filename ??
    document?.file_name ??
    document?.name ??
    "Untitled Document";

  const type =
    document?.document_type ??
    document?.type;

  const status =
    document?.processing_status ??
    document?.status;

  const uploadedAt =
    document?.created_at ??
    document?.createdAt ??
    document?.uploaded_at;

  return (
    <tr className="document-table-row">
      <td>
        <div className="document-name-cell">
          <div className="document-file-icon">
            PDF
          </div>

          <div className="document-name-info">
            {id ? (
              <Link
                to={`/documents/${id}`}
                className="document-name-link"
                title={name}
              >
                {name}
              </Link>
            ) : (
              <span
                className="document-name-link"
                title={name}
              >
                {name}
              </span>
            )}

            <span>
              Document ID: {id ?? "—"}
            </span>
          </div>
        </div>
      </td>

      <td>
        <span className="document-type-text">
          {formatDocumentType(type)}
        </span>
      </td>

      <td>
        <DocumentStatusBadge
          status={status}
        />
      </td>

      <td>
        <span className="document-date">
          {formatDate(uploadedAt)}
        </span>
      </td>

      <td>
        {id ? (
          <Link
            to={`/documents/${id}`}
            className="document-view-button"
          >
            View
          </Link>
        ) : (
          <span className="document-view-button">
            —
          </span>
        )}
      </td>
    </tr>
  );
}

export default DocumentRow;