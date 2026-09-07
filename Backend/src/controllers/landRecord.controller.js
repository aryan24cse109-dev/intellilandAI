const { pool } = require("../config/db");

const getLandRecords = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        lr.*,
        d.document_code,
        d.document_type
      FROM land_records lr
      LEFT JOIN documents d
        ON d.id = lr.document_id
      ORDER BY lr.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getLandRecordById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM land_records
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Land record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLandRecords,
  getLandRecordById,
};