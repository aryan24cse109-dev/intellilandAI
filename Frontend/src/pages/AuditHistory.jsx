import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import AuditTable from "../components/audit/AuditTable";
import AuditTimeline from "../components/audit/AuditTimeline";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import { getAuditLogs } from "../services/audit.service";

function AuditHistory() {
  const [searchParams] = useSearchParams();

  const documentId =
    searchParams.get("documentId");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!documentId) {
        setLoading(false);
        setLogs([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getAuditLogs(documentId);

        const auditData =
          response?.data ||
          response?.logs ||
          response?.audit_logs ||
          response;

        setLogs(
          Array.isArray(auditData)
            ? auditData
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load audit logs:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load audit history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [documentId]);

  if (loading) {
    return (
      <div className="content-page">
        <PageHeader
          title="Audit History"
          subtitle="Track document processing and verification activity"
        />

        <div className="audit-loading-state">
          <Loader
            size="large"
            text="Loading audit history..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="content-page audit-page">
      <PageHeader
        title="Audit History"
        subtitle="Track all actions performed on land records"
      />

      {error && (
        <div className="audit-error-wrapper">
          <ErrorMessage message={error} />
        </div>
      )}

      {!documentId ? (
        <div className="audit-no-document">
          <div className="audit-no-document-icon">
            ⓘ
          </div>

          <h2>Document not selected</h2>

          <p>
            Open audit history from a document to
            view its complete activity trail.
          </p>

          <Link
            to="/documents"
            className="document-next-module-button"
          >
            Go to Documents
          </Link>
        </div>
      ) : (
        <>
          <div className="audit-page-header">
            <div>
              <span className="audit-page-label">
                Document
              </span>

              <h2>
                Audit trail for Document #{documentId}
              </h2>
            </div>

            <span className="audit-record-count">
              {logs.length}{" "}
              {logs.length === 1
                ? "record"
                : "records"}
            </span>
          </div>

          <div className="audit-section">
            <div className="audit-section-header">
              <div>
                <h3>Activity Timeline</h3>
                <p>
                  Chronological history of actions
                  performed on this document.
                </p>
              </div>
            </div>

            <AuditTimeline logs={logs} />
          </div>

          <div className="audit-section">
            <div className="audit-section-header">
              <div>
                <h3>Audit Records</h3>
                <p>
                  Detailed audit information for
                  verification and review.
                </p>
              </div>
            </div>

            <AuditTable logs={logs} />
          </div>

          <div className="audit-bottom-navigation">
            <Link
              to={`/documents/${documentId}`}
              className="document-next-module-button secondary"
            >
              ← Back to Document
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default AuditHistory;