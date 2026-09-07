import api from "./api";


/* =========================
   Verify Field
========================= */

export const verifyField = async (
  verificationData
) => {
  const response = await api.post(
    "/verification",
    verificationData
  );

  return response.data;
};


/* =========================
   Verification History
========================= */

export const getVerificationHistory = async (
  documentId
) => {
  const response = await api.get(
    `/verification/document/${documentId}`
  );

  return response.data;
};