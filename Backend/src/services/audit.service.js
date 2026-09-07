const { pool } = require("../config/db");

const createAuditLog = async ({
  userId,
  documentId = null,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) => {
  await pool.query(
    `
    INSERT INTO audit_logs (
      user_id,
      document_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      ip_address
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      userId,
      documentId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
    ]
  );
};

module.exports = {
  createAuditLog,
};