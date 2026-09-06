function MatchBadge({
  status,
  score,
}) {
  const normalizedStatus =
    String(
      status || ""
    ).toUpperCase();


  let label = "Pending";
  let className =
    "validation-badge-pending";


  if (
    normalizedStatus === "MATCH" ||
    normalizedStatus === "MATCHED" ||
    normalizedStatus === "VALID"
  ) {
    label = "Match";
    className =
      "validation-badge-match";
  }


  if (
    normalizedStatus === "MISMATCH" ||
    normalizedStatus === "INVALID"
  ) {
    label = "Mismatch";
    className =
      "validation-badge-mismatch";
  }


  if (
    normalizedStatus === "REVIEW" ||
    normalizedStatus === "NEEDS_REVIEW"
  ) {
    label = "Needs Review";
    className =
      "validation-badge-review";
  }


  if (
    normalizedStatus === "CORRECTED"
  ) {
    label = "Corrected";
    className =
      "validation-badge-corrected";
  }


  return (
    <div className="match-badge-wrapper">

      <span
        className={`validation-match-badge ${className}`}
      >
        <span className="validation-match-dot" />

        {label}
      </span>

      {score !== undefined &&
        score !== null && (
          <span className="validation-score">
            {Math.round(
              Number(score) <= 1
                ? Number(score) * 100
                : Number(score)
            )}
            %
          </span>
        )}

    </div>
  );
}


export default MatchBadge;