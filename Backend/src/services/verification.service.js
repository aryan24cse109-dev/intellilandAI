const { pool } = require("../config/db");
const { linkParcelForLandRecord } = require("./parcel.service");

const editableFields = new Set([
  "district_hindi", "district_english", "tehsil_hindi", "tehsil_english", "village_hindi", "village_english",
  "khata_number", "khasra_number", "survey_number", "ulpin", "ownership_share", "area_hectares", "area_acres",
]);

const createVerification = async ({
  documentId,
  validationId,
  officerId,
  action,
  correctedValue,
  remarks,
  fieldName,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const validation = validationId ? (await client.query("SELECT * FROM validation_results WHERE id = $1 AND document_id = $2", [validationId, documentId])).rows[0] : null;
    if (validationId && !validation) throw new Error("Validation result does not belong to this document");
    const field = validation?.field_name || fieldName;
    const record = (await client.query("SELECT * FROM land_records WHERE document_id = $1", [documentId])).rows[0];
    if (!record) throw new Error("Process the document before verification");
    const oldValue = editableFields.has(field) ? record[field] : null;
    if (action === "CORRECT") {
      if (!editableFields.has(field) || !correctedValue) throw new Error("A supported field and corrected value are required for CORRECT");
      await client.query(`UPDATE land_records SET ${field} = $1 WHERE id = $2`, [correctedValue, record.id]);
    }
    const result = await client.query(
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
    const status = ["REJECT", "MARK_DISPUTED"].includes(action) ? "needs_review" : "completed";
    await client.query("UPDATE documents SET processing_status = $1 WHERE id = $2", [status, documentId]);
    await client.query(
      `INSERT INTO audit_logs (user_id, document_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1,$2,$3,'LAND_RECORD',$4,$5,$6)`,
      [officerId, documentId, `VERIFICATION_${action}`, record.id, oldValue == null ? null : { [field]: oldValue }, { field, action, corrected_value: correctedValue || null, remarks: remarks || null }]
    );
    await client.query("COMMIT");
    let parcelLink = null;
    if (action === "ACCEPT" || action === "CORRECT") {
      parcelLink = await linkParcelForLandRecord(record.id);
      if (parcelLink.status === "linked") await pool.query(
        `INSERT INTO audit_logs (user_id, document_id, action, entity_type, entity_id, new_value) VALUES ($1,$2,'PARCEL_LINKED','PARCEL',$3,$4)`,
        [officerId, documentId, parcelLink.parcel.parcel_id, { link_method: parcelLink.method }]
      );
    }
    return { verification: result.rows[0], parcelLink };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
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
