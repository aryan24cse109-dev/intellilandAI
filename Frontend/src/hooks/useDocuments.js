import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDocuments,
  getDocumentById,
} from "../services/document.service";

/**
 * Normalize documents API response.
 * Supports:
 * { data: [...] }
 * { documents: [...] }
 * { data: { documents: [...] } }
 * [...]
 */
function normalizeDocumentsResponse(response) {
  const data =
    response?.data ??
    response?.documents ??
    response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.documents)) {
    return data.documents;
  }

  return [];
}

/**
 * Normalize single document API response.
 */
function normalizeDocumentResponse(response) {
  return (
    response?.data?.document ??
    response?.document ??
    response?.data ??
    response
  );
}


/* =========================
   useDocuments
========================= */

export const useDocuments = () => {
  const [documents, setDocuments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadDocuments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getDocuments();

        const normalizedDocuments =
          normalizeDocumentsResponse(
            response
          );

        setDocuments(
          normalizedDocuments
        );
      } catch (err) {
        console.error(
          "Failed to load documents:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load documents."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);


  return {
    documents,
    loading,
    error,
    refresh: loadDocuments,
  };
};


/* =========================
   useDocument
========================= */

export const useDocument = (id) => {
  const [document, setDocument] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadDocument = useCallback(
    async () => {
      if (!id) {
        setDocument(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await getDocumentById(id);

        const normalizedDocument =
          normalizeDocumentResponse(
            response
          );

        setDocument(
          normalizedDocument
        );
      } catch (err) {
        console.error(
          "Failed to load document:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load document."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );


  useEffect(() => {
    loadDocument();
  }, [loadDocument]);


  return {
    document,
    loading,
    error,
    refresh: loadDocument,
  };
};


/*
 * Default export is kept for:
 *
 * import useDocuments from "../hooks/useDocuments";
 *
 * Named export is available for:
 *
 * import {
 *   useDocuments,
 *   useDocument
 * } from "../hooks/useDocuments";
 */

export default useDocuments;