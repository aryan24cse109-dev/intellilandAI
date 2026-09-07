import api from "./api";

export const getParcelById = async (id) => {
  const response = await api.get(`/parcels/${id}`);
  return response.data;
};

export const getParcelByDocumentId = async (documentId) => {
  const response = await api.get(
    `/parcels/document/${documentId}`
  );

  return response.data;
};