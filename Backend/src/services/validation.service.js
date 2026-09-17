const { pool } = require("../config/db");

const getResultsByDocumentId = async (documentId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      document_id,
      land_record_id,
      field_name,
      ai_value,
      reference_value,
      match_status,
      similarity_score,
      confidence_score,
      validation_method,
      created_at,
      latest_verification.action AS verification_action,
      latest_verification.corrected_value,
      latest_verification.remarks AS verification_remarks,
      latest_verification.verified_at
    FROM validation_results
    LEFT JOIN LATERAL (
      SELECT action, corrected_value, remarks, verified_at
      FROM verification_records
      WHERE validation_id = validation_results.id
      ORDER BY verified_at DESC
      LIMIT 1
    ) AS latest_verification ON TRUE
    WHERE document_id = $1
    ORDER BY created_at ASC
    `,
    [documentId]
  );

  return result.rows;
};

const getSummaryByDocumentId = async (documentId) => {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) AS total_fields,
      COUNT(*) FILTER (
        WHERE match_status = 'match'
      ) AS matched,
      COUNT(*) FILTER (
        WHERE match_status = 'mismatch'
      ) AS mismatched,
      COUNT(*) FILTER (
        WHERE match_status IN ('partial_match', 'pending', 'not_found')
      ) AS review,
      COUNT(*) FILTER (
        WHERE match_status = 'not_found'
      ) AS not_found
    FROM validation_results
    WHERE document_id = $1
    `,
    [documentId]
  );

  return result.rows[0];
};

module.exports = {
  getResultsByDocumentId,
  getSummaryByDocumentId,
};
