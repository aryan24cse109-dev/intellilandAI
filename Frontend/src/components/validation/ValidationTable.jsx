import EmptyState from "../common/EmptyState";

import ValidationRow from "./ValidationRow";


function ValidationTable({
  results = [],
  onReview,
}) {
  if (results.length === 0) {
    return (
      <div className="validation-empty">
        <EmptyState
          title="No validation results"
          message="Validation results will appear here after document processing."
        />
      </div>
    );
  }


  return (
    <div className="validation-table-wrapper">

      <table className="validation-table">

        <thead>
          <tr>
            <th>Field</th>
            <th>AI Extracted Value</th>
            <th>Reference Value</th>
            <th>Result</th>
            <th>Action</th>
          </tr>
        </thead>


        <tbody>
          {results.map(
            (result, index) => (
              <ValidationRow
                key={
                  result?.id ??
                  result?.validation_id ??
                  index
                }
                result={result}
                onReview={onReview}
              />
            )
          )}
        </tbody>

      </table>

    </div>
  );
}


export default ValidationTable;