const validationService = require("../services/validation.service");

const getValidationResults = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const data =
      await validationService.getResultsByDocumentId(documentId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getValidationSummary = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const data =
      await validationService.getSummaryByDocumentId(documentId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getValidationResults,
  getValidationSummary,
};