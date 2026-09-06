import {
  useEffect,
  useState,
} from "react";

import {
  verifyField,
} from "../../services/verification.service";


function getFieldName(result) {
  return (
    result?.field_name ??
    result?.field ??
    result?.field_key ??
    "Unknown Field"
  );
}


function getExtractedValue(result) {
  return (
    result?.extracted_value ??
    result?.ai_value ??
    result?.ocr_value ??
    result?.source_value ??
    ""
  );
}


function getReferenceValue(result) {
  return (
    result?.reference_value ??
    result?.government_value ??
    result?.expected_value ??
    result?.existing_value ??
    ""
  );
}


function VerificationPanel({
  result,
  documentId,
  onVerified,
  onClose,
}) {
  const [
    action,
    setAction,
  ] = useState("ACCEPT");


  const [
    correctedValue,
    setCorrectedValue,
  ] = useState("");


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!result) {
      return;
    }

    setCorrectedValue(
      getExtractedValue(result)
    );

    setAction("ACCEPT");
    setNotes("");
    setError("");
  }, [result]);


  if (!result) {
    return null;
  }


  const fieldName =
    getFieldName(result);


  const extractedValue =
    getExtractedValue(result);


  const referenceValue =
    getReferenceValue(result);


  const validationId =
    result?.id ??
    result?.validation_id;


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");


      /*
       * Verification payload
       */

      const payload = {
        document_id: Number(
          documentId
        ),

        validation_result_id:
          validationId
            ? Number(validationId)
            : undefined,

        field_name:
          fieldName,

        action:
          action,

        corrected_value:
          correctedValue,

        notes:
          notes,
      };


      await verifyField(
        payload
      );


      onVerified?.();
      onClose?.();

    } catch (err) {
      console.error(
        "Verification failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save verification."
      );

    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="verification-overlay">

      <div className="verification-panel">

        <div className="verification-panel-header">

          <div>
            <span className="validation-summary-label">
              FIELD VERIFICATION
            </span>

            <h2>
              {fieldName}
            </h2>
          </div>


          <button
            type="button"
            className="verification-close-button"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        <div className="verification-comparison">

          <div className="verification-value-card">

            <span>
              AI Extracted
            </span>

            <strong>
              {extractedValue ||
                "—"}
            </strong>

          </div>


          <div className="verification-arrow">
            →
          </div>


          <div className="verification-value-card verification-reference-card">

            <span>
              Reference
            </span>

            <strong>
              {referenceValue ||
                "—"}
            </strong>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="verification-form"
        >

          <div className="verification-form-field">

            <label>
              Verification Action
            </label>

            <select
              value={action}
              onChange={(event) =>
                setAction(
                  event.target.value
                )
              }
              disabled={submitting}
            >

              <option value="ACCEPT">
                Accept AI Value
              </option>

              <option value="CORRECT">
                Correct Value
              </option>

              <option value="REJECT">
                Reject Value
              </option>

              <option value="MARK_DISPUTED">
                Mark as Disputed
              </option>

            </select>

          </div>


          <div className="verification-form-field">

            <label>
              Verified / Corrected Value
            </label>

            <input
              type="text"
              value={correctedValue}
              onChange={(event) =>
                setCorrectedValue(
                  event.target.value
                )
              }
              disabled={
                submitting ||
                action === "REJECT" ||
                action ===
                  "MARK_DISPUTED"
              }
              placeholder="Enter verified value"
            />

          </div>


          <div className="verification-form-field">

            <label>
              Officer Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              disabled={submitting}
              placeholder="Add verification notes..."
              rows={4}
            />

          </div>


          {error && (
            <div className="verification-error">
              {error}
            </div>
          )}


          <div className="verification-panel-footer">

            <button
              type="button"
              className="verification-cancel-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="verification-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : "Save Verification"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default VerificationPanel;