import {
  useNavigate,
} from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";

import DocumentUploadForm from "../components/documents/DocumentUploadForm";

function DocumentUpload() {
  const navigate = useNavigate();

  const handleSuccess = (
    uploadedDocument
  ) => {
    const id =
      uploadedDocument?.id ??
      uploadedDocument?.document_id;

    if (id) {
      navigate(`/documents/${id}`);
      return;
    }

    navigate("/documents");
  };

  return (
    <div className="content-page document-upload-page">
      <PageHeader
        title="Upload Document"
        description="Upload a scanned land record for digitization and validation."
        breadcrumbs={[
          "Documents",
          "Upload",
        ]}
      />

      <div className="upload-page-card">
        <div className="upload-page-intro">
          <div className="upload-page-intro-icon">
            ↑
          </div>

          <div>
            <h2>
              Add Land Record
            </h2>

            <p>
              Upload a PDF or image of the
              land record. The document will
              be stored and can later be sent
              through the AI processing pipeline.
            </p>
          </div>
        </div>

        <DocumentUploadForm
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}

export default DocumentUpload;