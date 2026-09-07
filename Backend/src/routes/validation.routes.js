const express = require("express");

const {
  getValidationResults,
  getValidationSummary,
} = require("../controllers/validation.controller");

const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/document/:documentId",
  authenticate,
  getValidationResults
);

router.get(
  "/document/:documentId/summary",
  authenticate,
  getValidationSummary
);

module.exports = router;