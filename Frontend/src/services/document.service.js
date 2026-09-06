import api from "./api";

export const getDocuments = async () => {
  const response = await api.get("/documents");

  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);

  return response.data;
};

export const uploadDocument = async (formData) => {
  const response = await api.post(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const processDocument = async (id) => {
  const response = await api.post(
    `/documents/${id}/process`
  );

  return response.data;
};