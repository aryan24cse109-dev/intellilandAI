import api from "./api";

export const getAuditLogs = async (documentId) => {
  const response = await api.get(`/audit/document/${documentId}`);
  return response.data;
};