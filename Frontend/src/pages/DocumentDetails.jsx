import { useState } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";

import DocumentInfoCard from "../components/documents/DocumentInfoCard";
import DocumentStatusBadge from "../components/documents/DocumentStatusBadge";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import { useDocument } from "../hooks/useDocuments";

import {
  processDocument,
} from "../services/document.service";


function DocumentDetails() {
  const { id } = useParams();

  const {
    document,
    loading,
    error,
    refresh,
  } = useDocument(id);

  const [processing, setProcessing] =
    useState(false);

  const [processError, setProcessError] =
    useState("");


  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div className="document-details-loading">
        <Loader
          size="large"
          text="Loading document..."
        />
      </div>
    );
  }


  /* =========================
     Error / Not Found
  ========================= */

  if (error || !document) {
    return (
      <div className="content-page">

        <PageHeader
          title="Document Details"
          breadcrumbs={[
            "Documents",
            "Details",
          ]}
        />

        <ErrorMessage
          title="Unable to load document"
          message={
            error ||
            "Document was not found."
          }
          onRetry={refresh}
        />

        <Link
          to="/documents"
          className="document-back-link"
        >
          ← Back to Documents
        </Link>

      </div>
    );
  }


  /* =========================
     Document Data
  ========================= */

  const status =
    document?.processing_status ??
    document?.status ??
    "";

  const normalizedStatus =
    String(status).toUpperCase();


  const canProcess =
    ![
      "PROCESSING",
      "PREPROCESSING",
      "COMPLETED",
    ].includes(normalizedStatus);


  /* =========================
     Process Document
  ========================= */

  const handleProcess = async () => {
    try {
      setProcessing(true);
      setProcessError("");

      await processDocument(id);

      await refresh();

    } catch (err) {
      console.error(
        "Document processing failed:",
        err
      );

      setProcessError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start document processing."
      );

    } finally {
      setProcessing(false);
    }
  };


  /* =========================
     Render
  ========================= */

  return (
    <div className="content-page document-details-page">

      <PageHeader
        title="Document Details"
        description="Review document metadata and processing state."
        breadcrumbs={[
          "Documents",
          "Details",
        ]}
        actions={
          <Link
            to="/documents"
            className="document-secondary-button"
          >
            ← Back
          </Link>
        }
      />


      {/* Document Information */}

      <DocumentInfoCard
        document={document}
      />


      {/* Processing Error */}

      {processError && (
        <div className="document-process-error">
          {processError}
        </div>
      )}


      {/* Processing Panel */}

      <div className="document-processing-panel">

        <div>

          <span className="document-info-label">
            PROCESSING PIPELINE
          </span>

          <h2>
            Document Processing
          </h2>

          <p>
            Send this document to the AI
            processing service for preprocessing,
            OCR and structured extraction.
          </p>

        </div>


        <div className="document-processing-actions">

          <DocumentStatusBadge
            status={status}
          />


          {canProcess && (
            <button
              type="button"
              className="document-process-button"
              onClick={handleProcess}
              disabled={processing}
            >
              {processing
                ? "Starting..."
                : "Process Document"}
            </button>
          )}

        </div>

      </div>


      {/* Next Modules */}

      <div className="document-next-step-card">

        <div>

          <span className="document-info-label">
            NEXT MODULES
          </span>

          <h3>
            Validation & GIS
          </h3>

          <p>
            Once AI processing is completed,
            extracted land-record fields can be
            validated and linked with the parcel
            layer.
          </p>

        </div>


        <div className="document-next-links">

          w
<Link
  to={`/gis?documentId=${id}`}
  className="document-next-module-button"
>
  View Parcel on GIS
</Link>

          <Link
  to={`/audit?documentId=${id}`}
  className="document-next-module-button"
>
  View Audit History
</Link>

        </div>

      </div>

    </div>
  );
}


export default DocumentDetails;