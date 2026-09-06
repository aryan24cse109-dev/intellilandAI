import { useCallback, useEffect, useState } from "react";

import {
  getDashboardStats,
  getDashboardDocuments,
} from "../services/dashboard.service";

import { getApiErrorMessage } from "../utils/helpers";

const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, documentsResponse] =
        await Promise.all([
          getDashboardStats(),
          getDashboardDocuments(),
        ]);

      setStats(
        statsResponse?.data ??
          statsResponse?.stats ??
          statsResponse
      );

      const documentData =
        documentsResponse?.data ??
        documentsResponse?.documents ??
        documentsResponse;

      setDocuments(
        Array.isArray(documentData)
          ? documentData
          : []
      );
    } catch (err) {
      console.error(
        "Dashboard loading failed:",
        err
      );

      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    stats,
    documents,
    loading,
    error,
    refresh: loadDashboard,
  };
};

export default useDashboard;