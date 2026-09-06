import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getValidationResults,
  getValidationSummary,
} from "../services/validation.service";

import {
  getVerificationHistory,
} from "../services/verification.service";


function normalizeResults(response) {
  const data =
    response?.data ??
    response?.results ??
    response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.validation_results)) {
    return data.validation_results;
  }

  return [];
}


function normalizeSummary(response) {
  return (
    response?.data?.summary ??
    response?.summary ??
    response?.data ??
    response ??
    {}
  );
}


function normalizeHistory(response) {
  const data =
    response?.data ??
    response?.history ??
    response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.history)) {
    return data.history;
  }

  if (Array.isArray(data?.verifications)) {
    return data.verifications;
  }

  return [];
}


/* =========================
   Main Validation Hook
========================= */

export const useValidation = (
  documentId
) => {
  const [results, setResults] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadValidation = useCallback(
    async () => {
      if (!documentId) {
        setResults([]);
        setSummary(null);
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          resultsResponse,
          summaryResponse,
          historyResponse,
        ] = await Promise.all([
          getValidationResults(
            documentId
          ),
          getValidationSummary(
            documentId
          ),
          getVerificationHistory(
            documentId
          ),
        ]);

        setResults(
          normalizeResults(
            resultsResponse
          )
        );

        setSummary(
          normalizeSummary(
            summaryResponse
          )
        );

        setHistory(
          normalizeHistory(
            historyResponse
          )
        );

      } catch (err) {
        console.error(
          "Failed to load validation data:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load validation data."
        );

      } finally {
        setLoading(false);
      }
    },
    [documentId]
  );


  useEffect(() => {
    loadValidation();
  }, [loadValidation]);


  return {
    results,
    summary,
    history,
    loading,
    error,
    refresh: loadValidation,
  };
};


export default useValidation;