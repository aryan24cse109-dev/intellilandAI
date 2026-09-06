const { pool } = require("../config/db");

const getDashboardStats = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM documents) AS total_documents,

        (SELECT COUNT(*)
         FROM documents
         WHERE processing_status = 'completed') AS processed_documents,

        (SELECT COUNT(*)
         FROM documents
         WHERE processing_status IN ('uploaded', 'processing'))
         AS pending_documents,

        (SELECT COUNT(*)
         FROM documents
         WHERE processing_status = 'needs_review')
         AS review_documents,

        (SELECT COUNT(*)
         FROM validation_results
         WHERE match_status = 'mismatch')
         AS mismatches,

        (SELECT COUNT(*)
         FROM verification_records
         WHERE action = 'MARK_DISPUTED')
         AS disputed_records,

        (SELECT COUNT(*) FROM parcels) AS mapped_parcels
    `);

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};