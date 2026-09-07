export const APP_NAME = "IntelliLandAI";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const USER_ROLES = {
  ADMIN: "ADMIN",
  OFFICER: "OFFICER",
  VERIFIER: "VERIFIER",
  VIEWER: "VIEWER",
};

export const DOCUMENT_TYPES = {
  ROR: "ROR",
  MUTATION: "MUTATION",
  REGISTRATION: "REGISTRATION",
  HANDWRITTEN: "HANDWRITTEN",
  MAP: "MAP",
};

export const DOCUMENT_STATUS = {
  UPLOADED: "uploaded",
  PREPROCESSING: "preprocessing",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  NEEDS_REVIEW: "needs_review",
};

export const DOCUMENT_QUALITY = {
  CLEAN: "clean",
  MEDIUM: "medium",
  POOR: "poor",
  VERY_POOR: "very_poor",
};

export const VERIFICATION_ACTIONS = {
  ACCEPT: "ACCEPT",
  CORRECT: "CORRECT",
  REJECT: "REJECT",
  MARK_DISPUTED: "MARK_DISPUTED",
};

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  DOCUMENTS: "/documents",
  DOCUMENT_UPLOAD: "/documents/upload",
  DOCUMENT_DETAILS: "/documents/:id",
  VALIDATION_REVIEW: "/validation/:documentId",
  GIS_MAP: "/gis",
  AUDIT_HISTORY: "/audit/:documentId",
};