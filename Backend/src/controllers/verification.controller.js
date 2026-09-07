const verificationService = require("../services/verification.service");

const verifyField = async (req, res, next) => {
  try {
    const {
      document_id,
      validation_id,
      action,
      corrected_value,
      remarks,
    } = req.body;

    const allowedActions = [
      "ACCEPT",
      "CORRECT",
      "REJECT",
      "MARK_DISPUTED",
    ];

    if (!document_id || !action) {
      return res.status(400).json({
        success: false,
        message: "document_id and action are required",
      });
    }

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification action",
      });
    }

    const data = await verificationService.createVerification({
      documentId: document_id,
      validationId: validation_id || null,
      officerId: req.user.id,
      action,
      correctedValue: corrected_value || null,
      remarks: remarks || null,
    });

    res.status(201).json({
      success: true,
      message: "Verification recorded successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getVerificationHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const data =
      await verificationService.getHistoryByDocumentId(documentId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyField,
  getVerificationHistory,
};