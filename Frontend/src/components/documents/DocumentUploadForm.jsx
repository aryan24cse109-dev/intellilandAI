import {
  useRef,
  useState,
} from "react";

import {
  uploadDocument,
} from "../../services/document.service";

function DocumentUploadForm({
  onSuccess,
}) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] =
    useState("ROR");

  const [dragActive, setDragActive] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleFile = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setError(
        "Only PDF, JPG and PNG files are allowed."
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError(
        "File size must be less than 10 MB."
      );

      return;
    }

    setFile(selectedFile);
  };

  const handleInputChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    handleFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragActive(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError(
        "Please select a document first."
      );

      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      /*
       * Backend multer field.
       * Backend should use upload.single("file").
       */
      formData.append("file", file);

      formData.append(
        "document_type",
        documentType
      );

      const response =
        await uploadDocument(formData);

      const uploadedDocument =
        response?.data?.document ??
        response?.document ??
        response?.data ??
        response;

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      onSuccess?.(uploadedDocument);
    } catch (err) {
      console.error(
        "Document upload failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Document upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="document-upload-form"
      onSubmit={handleSubmit}
    >
      <div className="upload-form-grid">
        <div className="upload-form-field">
          <label htmlFor="document-type">
            Document Type
          </label>

          <select
            id="document-type"
            value={documentType}
            onChange={(event) =>
              setDocumentType(
                event.target.value
              )
            }
            className="upload-select"
            disabled={uploading}
          >
            <option value="ROR">
              Record of Rights (ROR)
            </option>

            <option value="MUTATION">
              Mutation Record
            </option>

            <option value="REGISTRATION">
              Registration Record
            </option>

            <option value="HANDWRITTEN">
              Handwritten Record
            </option>

            <option value="MAP">
              Land Map
            </option>
          </select>
        </div>

        <div className="upload-form-field">
          <label>
            Land Record File
          </label>

          <div
            className={`document-dropzone ${
              dragActive
                ? "document-dropzone-active"
                : ""
            } ${
              file
                ? "document-dropzone-selected"
                : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleInputChange}
              className="hidden-file-input"
            />

            {!file ? (
              <>
                <div className="upload-drop-icon">
                  ↑
                </div>

                <strong>
                  Drop your document here
                </strong>

                <span>
                  or click to browse
                </span>

                <small>
                  PDF, JPG or PNG • Max 10 MB
                </small>
              </>
            ) : (
              <>
                <div className="upload-drop-icon upload-file-selected">
                  ✓
                </div>

                <strong
                  className="selected-file-name"
                  title={file.name}
                >
                  {file.name}
                </strong>

                <span>
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>

                <small>
                  Click to choose another file
                </small>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <div className="upload-form-footer">
        <p>
          Uploaded documents are stored securely
          and can be processed through the AI
          pipeline.
        </p>

        <button
          type="submit"
          className="document-upload-submit"
          disabled={!file || uploading}
        >
          {uploading
            ? "Uploading..."
            : "Upload Document"}
        </button>
      </div>
    </form>
  );
}

export default DocumentUploadForm;