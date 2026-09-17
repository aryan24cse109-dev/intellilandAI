const { pool } = require("../config/db");

const createDocument = async ({
  documentCode,
  documentType,
  fileName,
  filePath,
  language,
  isHandwritten,
  quality,
  uploadedBy,
}) => {
  const result = await pool.query(
    `
    INSERT INTO documents (
      document_code,
      document_type,
      file_name,
      file_path,
      language,
      is_handwritten,
      quality,
      processing_status,
      uploaded_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'uploaded',$8)
    RETURNING *
    `,
    [
      documentCode,
      documentType,
      fileName,
      filePath,
      language,
      isHandwritten,
      quality,
      uploadedBy,
    ]
  );

  return result.rows[0];
};

const findAllDocuments = async () => {
  const result = await pool.query(`
    SELECT
      id,
      document_code,
      document_type,
      file_name,
      language,
      is_handwritten,
      quality,
      processing_status,
      uploaded_at,
      processed_at
    FROM documents
    ORDER BY created_at DESC
  `);

  return result.rows;
};

const findDocumentById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      d.*,
      lr.id AS land_record_id,
      lr.district_hindi,
      lr.district_english,
      lr.tehsil_hindi,
      lr.tehsil_english,
      lr.village_hindi,
      lr.village_english,
      lr.khata_number,
      lr.khasra_number,
      lr.survey_number,
      lr.area_hectares,
      lr.area_acres,
      lr.area_bigha,
      lr.land_classification_hindi,
      lr.land_classification_english,
      lr.ownership_share,
      lr.ulpin,
      jsonb_strip_nulls(jsonb_build_object(
        'district_hindi', lr.district_hindi,
        'district_english', lr.district_english,
        'tehsil_hindi', lr.tehsil_hindi,
        'tehsil_english', lr.tehsil_english,
        'village_hindi', lr.village_hindi,
        'village_english', lr.village_english,
        'khata_number', lr.khata_number,
        'khasra_number', lr.khasra_number,
        'survey_number', lr.survey_number,
        'land_area_hectares', lr.area_hectares,
        'land_area_acres', lr.area_acres,
        'land_area_bigha', lr.area_bigha,
        'land_classification_hindi', lr.land_classification_hindi,
        'land_classification_english', lr.land_classification_english,
        'ownership_share', lr.ownership_share,
        'ulpin', lr.ulpin,
        'owner_name_english', (SELECT o.name_english FROM owners o WHERE o.land_record_id = lr.id AND o.ownership_role = 'OWNER' ORDER BY o.created_at LIMIT 1),
        'owner_name_hindi', (SELECT o.name_hindi FROM owners o WHERE o.land_record_id = lr.id AND o.ownership_role = 'OWNER' ORDER BY o.created_at LIMIT 1)
      )) AS extracted_data
    FROM documents d
    LEFT JOIN land_records lr
      ON lr.document_id = d.id
    WHERE d.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
};

const updateProcessingStatus = async (
  id,
  status,
  processedAt = null
) => {
  const result = await pool.query(
    `
    UPDATE documents
    SET
      processing_status = $1,
      processed_at = COALESCE($2, processed_at)
    WHERE id = $3
    RETURNING *
    `,
    [status, processedAt, id]
  );

  return result.rows[0] || null;
};

const updateExtractionSource = async (id, extractionSource) => {
  const result = await pool.query(
    "UPDATE documents SET extraction_source = $1 WHERE id = $2 RETURNING *",
    [extractionSource, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createDocument,
  findAllDocuments,
  findDocumentById,
  updateProcessingStatus,
  updateExtractionSource,
};
