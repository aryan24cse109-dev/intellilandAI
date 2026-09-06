import EmptyState from "../common/EmptyState";

import DocumentRow from "./DocumentRow";

function DocumentTable({
  documents = [],
}) {
  if (documents.length === 0) {
    return (
      <div className="documents-empty-container">
        <EmptyState
          title="No documents found"
          message="Try changing your filters or upload a new land record."
        />
      </div>
    );
  }

  return (
    <div className="document-table-wrapper">
      <table className="document-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Status</th>
            <th>Uploaded</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {documents.map((document) => (
            <DocumentRow
              key={
                document?.id ??
                document?.document_id
              }
              document={document}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;