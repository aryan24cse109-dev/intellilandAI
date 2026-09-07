import MatchBadge from "./MatchBadge";


function formatFieldName(field) {
  if (!field) {
    return "Unknown Field";
  }

  return String(field)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}


function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function ValidationRow({
  result,
  onReview,
}) {
  const fieldName =
    result?.field_name ??
    result?.field ??
    result?.field_key ??
    "unknown";


  const extractedValue =
    result?.extracted_value ??
    result?.ai_value ??
    result?.ocr_value ??
    result?.source_value;


  const referenceValue =
    result?.reference_value ??
    result?.government_value ??
    result?.expected_value ??
    result?.existing_value;


  const status =
    result?.validation_status ??
    result?.status ??
    result?.match_status;


  const score =
    result?.validation_score ??
    result?.match_score ??
    result?.confidence_score ??
    result?.confidence;


  const id =
    result?.id ??
    result?.validation_id;


  const needsReview =
    [
      "MISMATCH",
      "REVIEW",
      "NEEDS_REVIEW",
      "INVALID",
    ].includes(
      String(status).toUpperCase()
    );


  return (
    <tr className="validation-table-row">

      <td>
        <div className="validation-field-name">
          {formatFieldName(fieldName)}
        </div>
      </td>


      <td>
        <div className="validation-value validation-ai-value">
          {displayValue(extractedValue)}
        </div>
      </td>


      <td>
        <div className="validation-value validation-reference-value">
          {displayValue(referenceValue)}
        </div>
      </td>


      <td>
        <MatchBadge
          status={status}
          score={score}
        />
      </td>


      <td>
        {needsReview ? (
          <button
            type="button"
            className="validation-review-button"
            onClick={() =>
              onReview?.(result)
            }
          >
            Review
          </button>
        ) : (
          <span className="validation-auto-label">
            Auto-validated
          </span>
        )}
      </td>

    </tr>
  );
}


export default ValidationRow;