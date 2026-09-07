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
      created_at
    FROM validation_results
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
        WHERE match_status = 'partial_match'
      ) AS partial_matches,
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