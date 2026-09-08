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

  const [processing, setProcessing] = useState(false);

  const [processError, setProcessError] = useState("");

  const [aiResult, setAiResult] = useState(null);


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
      setAiResult(null);

      const response = await processDocument(id);

      /*
       * Backend response:
       *
       * {
       *   success: true,
       *   data: {
       *     document_id: "...",
       *     ai_result: {
       *       success: true,
       *       data: {
       *         extracted_data: {...}
       *       }
       *     }
       *   }
       * }
       */

      const result =
        response?.data?.ai_result ??
        response?.ai_result ??
        response?.data ??
        response;

      setAiResult(result);

      await refresh();

    } catch (err) {
      console.error(
        "Document processing failed:",
        err
      );

      setProcessError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to process document."
      );

    } finally {
      setProcessing(false);
    }
  };


  /* =========================
     Extract structured data
  ========================= */

  const extractedData =
    aiResult?.data?.extracted_data ??
    aiResult?.extracted_data ??
    null;


  /* =========================
     Render
  ========================= */

  return (
    <div className="content-page document-details-page">

      <PageHeader
        title="Document Details"
        description="Review document metadata and AI processing results."
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
            AI PROCESSING PIPELINE
          </span>

          <h2>
            Document Processing
          </h2>

          <p>
            Preprocessing, OCR, document understanding
            and structured land-record extraction.
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
                ? "Processing..."
                : "Process Document"}
            </button>
          )}

        </div>

      </div>


      {/* =========================
          AI STRUCTURED DATA
      ========================= */}

      {extractedData && (
        <div className="document-ai-result-card">

          <div className="document-ai-result-header">

            <div>

              <span className="document-info-label">
                AI EXTRACTED DATA
              </span>

              <h2>
                Structured Land Record
              </h2>

              <p>
                Information automatically extracted
                from the uploaded document.
              </p>

            </div>

            <span className="document-ai-success-badge">
              ✓ AI PROCESSED
            </span>

          </div>


          <div className="document-ai-data-grid">

            {Object.entries(extractedData).map(
              ([key, value]) => {

                if (
                  value === null ||
                  value === undefined ||
                  typeof value === "object"
                ) {
                  return null;
                }

                const label = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, char =>
                    char.toUpperCase()
                  );

                return (
                  <div
                    key={key}
                    className="document-ai-data-item"
                  >

                    <span>
                      {label}
                    </span>

                    <strong>
                      {String(value)}
                    </strong>

                  </div>
                );
              }
            )}

          </div>

        </div>
      )}


      {/* =========================
          NEXT MODULES
      ========================= */}

      <div className="document-next-step-card">

        <div>

          <span className="document-info-label">
            NEXT MODULES
          </span>

          <h3>
            Validation & GIS
          </h3>

          <p>
            Extracted land-record fields can be
            validated against reference records
            and linked with the corresponding parcel.
          </p>

        </div>


        <div className="document-next-links">

          <Link
            to={`/validation?documentId=${id}`}
            className="document-next-module-button"
          >
            Review Validation
          </Link>

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