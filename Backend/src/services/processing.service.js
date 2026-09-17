const { pool } = require("../config/db");


const LAND_RECORD_COLUMNS = {
  district_hindi: "district_hindi",
  district_english: "district_english",
  tehsil_hindi: "tehsil_hindi",
  tehsil_english: "tehsil_english",
  village_hindi: "village_hindi",
  village_english: "village_english",
  khata_number: "khata_number",
  khasra_number: "khasra_number",
  survey_number: "survey_number",
  land_area_hectares: "area_hectares",
  land_area_acres: "area_acres",
  land_area_bigha: "area_bigha",
  land_classification_hindi: "land_classification_hindi",
  land_classification_english: "land_classification_english",
  ownership_share: "ownership_share",
  ulpin: "ulpin",
};

const comparableFields = [
  "khata_number",
  "khasra_number",
  "survey_number",
  "area_hectares",
  "area_acres",
  "district_english",
  "tehsil_english",
  "village_english",
];

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const asText = (value) => value == null ? null : String(value);

function recordValues(extracted) {
  return Object.fromEntries(Object.entries(LAND_RECORD_COLUMNS).map(([source, target]) => [target, extracted[source] ?? null]));
}

async function upsertLandRecord(client, documentId, extracted) {
  const values = recordValues(extracted);
  const columns = Object.keys(values);
  const params = columns.map((column) => values[column]);
  const sets = columns.map((column, index) => `${column} = COALESCE($${index + 2}, land_records.${column})`);
  const existing = await client.query("SELECT id FROM land_records WHERE document_id = $1", [documentId]);
  if (existing.rows[0]) {
    const result = await client.query(
      `UPDATE land_records SET ${sets.join(", ")} WHERE document_id = $1 RETURNING *`,
      [documentId, ...params]
    );
    return result.rows[0];
  }
  const result = await client.query(
    `INSERT INTO land_records (document_id, ${columns.join(", ")}) VALUES ($1, ${columns.map((_, index) => `$${index + 2}`).join(", ")}) RETURNING *`,
    [documentId, ...params]
  );
  return result.rows[0];
}

async function upsertOwner(client, landRecordId, extracted) {
  const nameEnglish = extracted.owner_name_english || extracted.new_owner_english || extracted.buyer_name || null;
  const nameHindi = extracted.owner_name_hindi || extracted.new_owner_hindi || null;
  if (!nameEnglish && !nameHindi) return null;
  const fatherEnglish = extracted.father_husband_name_english || extracted.father_name_english || extracted.buyer_father_name || null;
  const fatherHindi = extracted.father_husband_name_hindi || extracted.father_name_hindi || null;
  const existing = await client.query(
    "SELECT id FROM owners WHERE land_record_id = $1 AND ownership_role = 'OWNER' ORDER BY created_at LIMIT 1",
    [landRecordId]
  );
  if (existing.rows[0]) {
    const result = await client.query(
      "UPDATE owners SET name_hindi = $1, name_english = $2, father_husband_name_hindi = $3, father_husband_name_english = $4, ownership_share = $5 WHERE id = $6 RETURNING *",
      [nameHindi, nameEnglish, fatherHindi, fatherEnglish, extracted.ownership_share || null, existing.rows[0].id]
    );
    return result.rows[0];
  }
  const result = await client.query(
    "INSERT INTO owners (land_record_id, name_hindi, name_english, father_husband_name_hindi, father_husband_name_english, ownership_role, ownership_share) VALUES ($1,$2,$3,$4,$5,'OWNER',$6) RETURNING *",
    [landRecordId, nameHindi, nameEnglish, fatherHindi, fatherEnglish, extracted.ownership_share || null]
  );
  return result.rows[0];
}

async function findReference(client, documentId, record) {
  const result = await client.query(
    `SELECT lr.*, o.name_english AS owner_name_english
     FROM land_records lr
     LEFT JOIN owners o ON o.land_record_id = lr.id AND o.ownership_role = 'OWNER'
     WHERE lr.document_id <> $1
       AND (($2::varchar IS NOT NULL AND lr.ulpin = $2)
         OR ($3::varchar IS NOT NULL AND lr.survey_number = $3 AND lr.khasra_number = $4)
         OR ($4::varchar IS NOT NULL AND lr.khasra_number = $4))
     ORDER BY CASE WHEN lr.ulpin = $2 THEN 0 WHEN lr.survey_number = $3 AND lr.khasra_number = $4 THEN 1 ELSE 2 END
     LIMIT 1`,
    [documentId, record.ulpin || null, record.survey_number || null, record.khasra_number || null]
  );
  return result.rows[0] || null;
}

function compare(aiValue, referenceValue) {
  if (aiValue == null || aiValue === "") return { status: "not_found", similarity: null, method: "missing_extraction" };
  if (referenceValue == null || referenceValue === "") return { status: "pending", similarity: null, method: "reference_unavailable" };
  if (normalize(aiValue) === normalize(referenceValue)) return { status: "match", similarity: 1, method: "exact_match" };
  return { status: "mismatch", similarity: 0, method: "exact_comparison" };
}

async function regenerateValidation(client, documentId, landRecord, extracted) {
  await client.query("DELETE FROM validation_results WHERE document_id = $1", [documentId]);
  const reference = await findReference(client, documentId, landRecord);
  const fields = [...comparableFields, "owner_name_english"];
  for (const field of fields) {
    const aiValue = field === "owner_name_english" ? extracted.owner_name_english : landRecord[field];
    const referenceValue = reference ? reference[field] : null;
    const comparison = compare(aiValue, referenceValue);
    await client.query(
      `INSERT INTO validation_results (document_id, land_record_id, field_name, ai_value, reference_value, match_status, similarity_score, validation_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [documentId, landRecord.id, field, asText(aiValue), asText(referenceValue), comparison.status, comparison.similarity, comparison.method]
    );
  }
  return reference;
}

async function persistProcessingResult(documentId, aiResult) {
  
  const extracted = aiResult?.data?.extracted_data || aiResult?.extracted_data;

  if (!extracted || typeof extracted !== "object") {
    throw new Error("AI service returned no extracted land-record data");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const landRecord = await upsertLandRecord(
      client,
      documentId,
      extracted
    );

    const owner = await upsertOwner(
      client,
      landRecord.id,
      extracted
    );

    const reference = await regenerateValidation(
      client,
      documentId,
      landRecord,
      extracted
    );

    await client.query("COMMIT");

let parcelLink = null;

try {
  const { linkParcelForLandRecord } = require("./parcel.service");

  parcelLink = await linkParcelForLandRecord(landRecord.id);
} catch (parcelError) {
  console.error(
    `Parcel linking failed for document ${documentId}:`,
    parcelError
  );
}

return {
  landRecord,
  owner,
  referenceRecordId: reference?.id || null,
  extractedData: extracted,
  parcelLink,
};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  persistProcessingResult,
  LAND_RECORD_COLUMNS,
};