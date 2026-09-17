const env = require("../config/env");

const processDocumentWithAI = async (document) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120000);

  try {
    const response = await fetch(
      `${env.aiServiceUrl}/ai/process-document`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: document.id,
          file_path: document.file_path,
          document_type: document.document_type,
          language: document.language || null,
        }),
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
      throw new Error("AI processing service is unavailable");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  processDocumentWithAI,
};