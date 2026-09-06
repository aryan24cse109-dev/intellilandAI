const express = require("express");

const { getAuditLogs } = require("../controllers/audit.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.get(
  "/document/:documentId",
  authenticate,
  authorizeRoles("ADMIN", "OFFICER", "VERIFIER"),
  getAuditLogs
);

module.exports = router;