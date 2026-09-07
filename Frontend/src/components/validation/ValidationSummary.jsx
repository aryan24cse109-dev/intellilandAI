function getNumber(
  object,
  keys,
  fallback = 0
) {
  for (const key of keys) {
    if (
      object?.[key] !==
        undefined &&
      object?.[key] !== null
    ) {
      return Number(
        object[key]
      );
    }
  }

  return fallback;
}


function ValidationSummary({
  summary,
}) {
  const data = summary || {};


  const total = getNumber(
    data,
    [
      "total",
      "total_results",
      "total_fields",
      "count",
    ]
  );


  const matches = getNumber(
    data,
    [
      "matches",
      "matched",
      "matched_count",
      "valid",
    ]
  );


  const mismatches = getNumber(
    data,
    [
      "mismatches",
      "mismatch",
      "mismatched",
      "mismatch_count",
      "invalid",
    ]
  );


  const needsReview = getNumber(
    data,
    [
      "needs_review",
      "review",
      "review_count",
      "pending",
    ]
  );


  const matchPercentage =
    total > 0
      ? Math.round(
          (matches / total) * 100
        )
      : 0;


  return (
    <div className="validation-summary">

      <div className="validation-summary-card">

        <span className="validation-summary-label">
          TOTAL FIELDS
        </span>

        <strong>
          {total}
        </strong>

        <small>
          Fields checked
        </small>

      </div>


      <div className="validation-summary-card validation-summary-match">

        <span className="validation-summary-label">
          MATCHED
        </span>

        <strong>
          {matches}
        </strong>

        <small>
          {matchPercentage}% match rate
        </small>

      </div>


      <div className="validation-summary-card validation-summary-mismatch">

        <span className="validation-summary-label">
          MISMATCHED
        </span>

        <strong>
          {mismatches}
        </strong>

        <small>
          Requires attention
        </small>

      </div>


      <div className="validation-summary-card validation-summary-review">

        <span className="validation-summary-label">
          NEEDS REVIEW
        </span>

        <strong>
          {needsReview}
        </strong>

        <small>
          Officer verification
        </small>

      </div>

    </div>
  );
}


export default ValidationSummary;