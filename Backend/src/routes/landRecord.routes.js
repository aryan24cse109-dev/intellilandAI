const express = require("express");

const {
  getLandRecords,
  getLandRecordById,
} = require("../controllers/landRecord.controller");

const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  getLandRecords
);

router.get(
  "/:id",
  authenticate,
  getLandRecordById
);

module.exports = router;