const fs = require("fs");
const path = require("path");

const env = require("../config/env");

const processDocumentWithAI = async (document) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120000);

  let fileStream = null;

  try {
    if (!document?.file_path) {
      throw new Error("Document file path is missing");
    }

    if (!fs.existsSync(document.file_path)) {
      throw new Error(
        `Uploaded document file not found: ${document.file_path}`
      );
    }

    const formData = new FormData();

    formData.append("document_id", document.id);

    if (document.document_type) {
      formData.append("document_type", document.document_type);
    }

    if (document.language) {
      formData.append("language", document.language);
    }

    fileStream = fs.createReadStream(document.file_path);

    const originalFileName =
      document.file_name ||
      path.basename(document.file_path);

    const fileExtension =
      path.extname(originalFileName).toLowerCase();

    let contentType = "application/octet-stream";

    if (fileExtension === ".pdf") {
      contentType = "application/pdf";
    } else if (
      fileExtension === ".jpg" ||
      fileExtension === ".jpeg"
    ) {
      contentType = "image/jpeg";
    } else if (fileExtension === ".png") {
      contentType = "image/png";
    }

    formData.append(
      "file",
      fileStream,
      {
        filename: originalFileName,
        contentType,
      }
    );

    const response = await fetch(
      `${env.aiServiceUrl}/ai/process-document`,
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      const message =
        result?.message ||
        result?.detail ||
        `AI service returned status ${response.status}`;

      throw new Error(message);
    }

    return result;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "AI document processing timed out after 120 seconds"
      );
    }

    if (
      error?.name === "TypeError" &&
      error?.message?.toLowerCase().includes("fetch")
    ) {
      throw new Error(
        "AI processing service is unavailable"
      );
    }

    throw error;
  } finally {
    if (fileStream) {
      fileStream.destroy();
    }

    clearTimeout(timeout);
  }
};

module.exports = {
  processDocumentWithAI,
};