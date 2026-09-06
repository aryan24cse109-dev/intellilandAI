const parcelService = require("../services/parcel.service");

/**
 * GET /api/parcels/:id
 *
 * Find parcel using parcel UUID
 */
const getParcelById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const parcel = await parcelService.findParcelById(id);

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/parcels/document/:id
 *
 * Find parcel using document UUID
 *
 * documents
 *     ↓
 * land_records
 *     ↓
 * parcels
 */
const getParcelByDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const parcel =
      await parcelService.findParcelByDocumentId(id);

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "No parcel found for this document",
      });
    }

    return res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/parcels/search
 *
 * Search parcel using:
 * - ULPIN
 * - Survey Number
 * - Khasra Number
 */
const getParcelByIdentifiers = async (req, res, next) => {
  try {
    const {
      ulpin,
      surveyNumber,
      khasraNumber,
    } = req.query;

    if (!ulpin && !surveyNumber && !khasraNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Provide at least one identifier: ulpin, surveyNumber or khasraNumber",
      });
    }

    const parcel =
      await parcelService.findParcelByIdentifiers({
        ulpin,
        surveyNumber,
        khasraNumber,
      });

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "No parcel found for the provided identifiers",
      });
    }

    return res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParcelById,
  getParcelByDocument,
  getParcelByIdentifiers,
};