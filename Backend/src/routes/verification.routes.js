const express = require("express");

const {
  verifyField,
  getVerificationHistory,
} = require("../controllers/verification.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

const router = express.Router();


// =====================================================
// VERIFICATION ROUTES
// =====================================================

// Verify / review a validation field
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER", "VERIFIER"),
  verifyField
);


// Get verification history for a document
router.get(
  "/document/:documentId",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER", "VERIFIER"),
  getVerificationHistory
);


module.exports = router;