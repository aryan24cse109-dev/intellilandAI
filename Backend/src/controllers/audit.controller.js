const { pool } = require("../config/db");

const getAuditLogs = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.created_at,
        u.full_name AS user_name,
        u.role AS user_role
      FROM audit_logs al
      LEFT JOIN users u
        ON u.id = al.user_id
      WHERE al.document_id = $1
      ORDER BY al.created_at DESC
      `,
      [documentId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};