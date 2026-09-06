const express = require("express");

const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  processDocument,
} = require("../controllers/document.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();


// =====================================================
// DOCUMENT ROUTES
// =====================================================

// Upload document
router.post(
  "/upload",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER"),
  upload.single("document"),
  uploadDocument
);


// Get all documents
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER", "VERIFIER"),
  getDocuments
);


// Get document by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER", "VERIFIER"),
  getDocumentById
);


// Process document using AI service
router.post(
  "/:id/process",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER"),
  processDocument
);


module.exports = router;