import { Link } from "react-router-dom";

import EmptyState from "../common/EmptyState";
import Loader from "../common/Loader";

import {
  formatDateTime,
  formatStatus,
} from "../../utils/formatters";

function getDocumentId(document) {
  return (
    document?.id ??
    document?.document_id ??
    document?.documentId
  );
}

function getDocumentName(document) {
  return (
    document?.original_filename ??
    document?.filename ??
    document?.file_name ??
    document?.name ??
    "Untitled Document"
  );
}

function getDocumentType(document) {
  return (
    document?.document_type ??
    document?.type ??
    "—"
  );
}

function getDocumentStatus(document) {
  return (
    document?.processing_status ??
    document?.status ??
    "—"
  );
}

function RecentDocuments({
  documents = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Recent Documents</h2>
            <p>Latest uploaded land records</p>
          </div>
        </div>

        <Loader
          size="medium"
          text="Loading documents..."
        />
      </div>
    );
  }

  const recentDocuments = [...documents]
    .sort((a, b) => {
      const dateA = new Date(
        a?.created_at ??
          a?.createdAt ??
          0
      );

      const dateB = new Date(
        b?.created_at ??
          b?.createdAt ??
          0
      );

      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>Recent Documents</h2>
          <p>Latest uploaded land records</p>
        </div>

        <Link
          to="/documents"
          className="dashboard-panel-link"
        >
          View all →
        </Link>
      </div>

      {recentDocuments.length === 0 ? (
        <EmptyState
          title="No documents yet"
          message="Uploaded land records will appear here."
        />
      ) : (
        <div className="recent-documents-list">
          {recentDocuments.map((document) => {
            const id = getDocumentId(document);

            const name =
              getDocumentName(document);

            const type =
              getDocumentType(document);

            const status =
              getDocumentStatus(document);

            return (
              <Link
                key={id ?? name}
                to={
                  id
                    ? `/documents/${id}`
                    : "/documents"
                }
                className="recent-document-row"
              >
                <div className="recent-document-icon">
                  PDF
                </div>

                <div className="recent-document-main">
                  <strong title={name}>
                    {name}
                  </strong>

                  <span>
                    {type} •{" "}
                    {formatDateTime(
                      document?.created_at ??
                        document?.createdAt
                    )}
                  </span>
                </div>

                <span
                  className={`document-status-chip status-${String(
                    status
                  )
                    .toLowerCase()
                    .replaceAll("_", "-")}`}
                >
                  {formatStatus(status)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentDocuments;