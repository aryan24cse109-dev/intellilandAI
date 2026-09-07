const { pool } = require("../config/db");

const createVerification = async ({
  documentId,
  validationId,
  officerId,
  action,
  correctedValue,
  remarks,
}) => {
  const result = await pool.query(
    `
    INSERT INTO verification_records (
      document_id,
      validation_id,
      officer_id,
      action,
      corrected_value,
      remarks
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      documentId,
      validationId,
      officerId,
      action,
      correctedValue,
      remarks,
    ]
  );

  return result.rows[0];
};

const getHistoryByDocumentId = async (documentId) => {
  const result = await pool.query(
    `
    SELECT
      vr.*,
      u.full_name AS officer_name,
      u.role AS officer_role
    FROM verification_records vr
    JOIN users u
      ON u.id = vr.officer_id
    WHERE vr.document_id = $1
    ORDER BY vr.verified_at DESC
    `,
    [documentId]
  );

  return result.rows;
};

module.exports = {
  createVerification,
  getHistoryByDocumentId,
};