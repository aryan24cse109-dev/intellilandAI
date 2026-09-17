import { useEffect, useState } from "react";

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
     Keep local processing state
     synchronized with backend
     ========================= */

  useEffect(() => {
    if (!document) {
      return;
    }

    const backendStatus =
      document?.processing_status ??
      document?.status ??
      "";

    const normalizedBackendStatus =
      String(backendStatus).toUpperCase();

    /*
     * If the backend says the document is still
     * processing, keep the UI in processing mode.
     *
     * This is important after a page refresh or
     * when the frontend request times out while
     * backend processing continues.
     */

    if (
      normalizedBackendStatus === "PROCESSING" ||
      normalizedBackendStatus === "PREPROCESSING"
    ) {
      setProcessing(true);
      return;
    }

    /*
     * Once backend processing finishes or fails,
     * allow the UI to leave the local processing state.
     */

    setProcessing(false);
  }, [document]);


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


  /*
   * A document should not be processed again
   * while it is already being processed or after
   * processing has completed.
   */

  const backendIsProcessing =
    normalizedStatus === "PROCESSING" ||
    normalizedStatus === "PREPROCESSING";

  const processingCompleted =
    normalizedStatus === "COMPLETED";

  const canProcess =
    !backendIsProcessing &&
    !processingCompleted &&
    !processing;


  /* =========================
     Process Document
  ========================= */

  const handleProcess = async () => {

    /*
     * Prevent accidental double-clicks or multiple
     * requests while the current request is active.
     */

    if (
      processing ||
      backendIsProcessing
    ) {
      return;
    }

    try {
      setProcessing(true);

      setProcessError("");

      setAiResult(null);


      const response =
        await processDocument(id);


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


      /*
       * Refresh document data so that:
       *
       * - processing_status updates
       * - extraction_source updates
       * - persisted extracted data appears
       * - validation/GIS links use the latest state
       */

      await refresh();

    } catch (err) {

      console.error(
        "Document processing failed:",
        err
      );


      /*
       * If the frontend request timed out, the backend
       * may still be processing the document.
       *
       * Therefore refresh the document once before
       * showing the final error state.
       */

      try {
        await refresh();
      } catch (refreshError) {
        console.error(
          "Unable to refresh document after processing error:",
          refreshError
        );
      }


      /*
       * Read the latest backend status after refresh.
       *
       * If the backend is still processing, don't
       * incorrectly tell the user that processing failed.
       */

      const latestStatus =
        document?.processing_status ??
        document?.status ??
        "";

      const normalizedLatestStatus =
        String(latestStatus).toUpperCase();


      const backendStillProcessing =
        normalizedLatestStatus === "PROCESSING" ||
        normalizedLatestStatus === "PREPROCESSING";


      if (!backendStillProcessing) {
        setProcessError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to process document."
        );
      }

    } finally {

      /*
       * Do not blindly leave the UI stuck in processing
       * if the request finishes.
       *
       * The useEffect above will synchronize this again
       * with the actual backend document status.
       */

      setProcessing(false);
    }
  };


  /* =========================
     Extract structured data
  ========================= */

  const extractedData =
    aiResult?.data?.extracted_data ??
    aiResult?.extracted_data ??
    document?.extracted_data ??
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


      {/* =========================
          Document Information
      ========================= */}

      <DocumentInfoCard
        document={document}
      />


      {/* =========================
          Processing Error
      ========================= */}

      {processError && (
        <div className="document-process-error">
          {processError}
        </div>
      )}


      {/* =========================
          Processing Panel
      ========================= */}

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


          {/* =========================
              Active Processing Message
          ========================= */}

          {processing && (
            <div
              className="document-processing-message"
              role="status"
              aria-live="polite"
            >
              <strong>
                Processing document...
              </strong>

              <span>
                OCR, document understanding and
                structured data extraction are in progress.
                This may take a few minutes.
              </span>
            </div>
          )}

        </div>


        <div className="document-processing-actions">

          <DocumentStatusBadge
            status={status}
          />


          {/* =========================
              Process Button
          ========================= */}

          {canProcess && (
            <button
              type="button"
              className="document-process-button"
              onClick={handleProcess}
              disabled={processing}
              aria-busy={processing}
            >
              {processing
                ? "Processing..."
                : "Process Document"}
            </button>
          )}


          {/* =========================
              Explicit Processing State
          ========================= */}

          {backendIsProcessing && (
            <button
              type="button"
              className="document-process-button"
              disabled
              aria-busy="true"
            >
              Processing...
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
              {document?.extraction_source ===
              "synthetic_ground_truth_fallback"
                ? "SYNTHETIC DEMO FALLBACK"
                : "✓ AI PROCESSED"}
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
                  .replace(
                    /\b\w/g,
                    char => char.toUpperCase()
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
            to={`/validation/${id}`}
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