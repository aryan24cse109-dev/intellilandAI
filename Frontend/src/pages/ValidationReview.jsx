import {
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";

import ValidationSummary from "../components/validation/ValidationSummary";
import ValidationTable from "../components/validation/ValidationTable";
import VerificationPanel from "../components/validation/VerificationPanel";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import useValidation from "../hooks/useValidation";


function ValidationReview() {
  const { documentId } =
    useParams();

  const {
    results,
    summary,
    loading,
    error,
    refresh,
  } = useValidation(
    documentId
  );


  const [
    selectedResult,
    setSelectedResult,
  ] = useState(null);


  const handleReview = (
    result
  ) => {
    setSelectedResult(result);
  };


  const handleCloseReview = () => {
    setSelectedResult(null);
  };


  const handleVerified = async () => {
    setSelectedResult(null);

    await refresh();
  };


  if (loading) {
    return (
      <div className="document-details-loading">
        <Loader
          size="large"
          text="Loading validation results..."
        />
      </div>
    );
  }


  return (
    <div className="content-page validation-page">

      <PageHeader
        title="Validation Review"
        description="Compare AI-extracted land-record data with authorized reference values."
        breadcrumbs={[
          "Validation",
          "Review",
        ]}
        actions={
          <Link
            to={`/documents/${documentId}`}
            className="document-secondary-button"
          >
            ← Document
          </Link>
        }
      />


      {error ? (
        <ErrorMessage
          title="Unable to load validation"
          message={error}
          onRetry={refresh}
        />
      ) : (
        <>
          <ValidationSummary
            summary={summary}
          />


          <div className="validation-main-panel">

            <div className="validation-panel-header">

              <div>
                <span className="document-info-label">
                  VALIDATION RESULTS
                </span>

                <h2>
                  Field-level comparison
                </h2>

                <p>
                  Review mismatches and verify
                  extracted values before finalizing
                  the land record.
                </p>
              </div>


              <div className="validation-document-id">
                Document #{documentId}
              </div>

            </div>


            <ValidationTable
              results={results}
              onReview={handleReview}
            />

          </div>
        </>
      )}


      {selectedResult && (
        <VerificationPanel
          result={selectedResult}
          documentId={documentId}
          onVerified={
            handleVerified
          }
          onClose={
            handleCloseReview
          }
        />
      )}

    </div>
  );
}


export default ValidationReview;