import api from "./api";


/* =========================
   Get Validation Results
========================= */

export const getValidationResults = async (
  documentId
) => {
  const response = await api.get(
    `/validation/document/${documentId}`
  );

  return response.data;
};


/* =========================
   Get Validation Summary
========================= */

export const getValidationSummary = async (
  documentId
) => {
  const response = await api.get(
    `/validation/document/${documentId}/summary`
  );

  return response.data;
};