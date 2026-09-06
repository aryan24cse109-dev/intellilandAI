const { pool } = require("../config/db");

/**
 * Find parcel using parcel UUID
 */
const findParcelById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.land_record_id,
      p.parcel_id,
      p.ulpin,
      p.survey_number,
      p.khasra_number,
      p.area_hectares,
      p.source,
      ST_AsGeoJSON(p.geometry)::json AS geometry,
      p.created_at,
      p.updated_at
    FROM parcels p
    WHERE p.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Find parcel using document UUID
 *
 * Relationship:
 *
 * documents
 *    ↓
 * land_records
 *    ↓
 * parcels
 */
const findParcelByDocumentId = async (documentId) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.land_record_id,
      p.parcel_id,
      p.ulpin,
      p.survey_number,
      p.khasra_number,
      p.area_hectares,
      p.source,
      ST_AsGeoJSON(p.geometry)::json AS geometry,
      p.created_at,
      p.updated_at
    FROM parcels p

    INNER JOIN land_records lr
      ON lr.id = p.land_record_id

    INNER JOIN documents d
      ON d.id = lr.document_id

    WHERE d.id = $1

    LIMIT 1
    `,
    [documentId]
  );

  return result.rows[0] || null;
};

/**
 * Find parcel using land identifiers
 *
 * Supported identifiers:
 * - ULPIN
 * - Survey Number
 * - Khasra Number
 */
const findParcelByIdentifiers = async ({
  ulpin,
  surveyNumber,
  khasraNumber,
}) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.land_record_id,
      p.parcel_id,
      p.ulpin,
      p.survey_number,
      p.khasra_number,
      p.area_hectares,
      p.source,
      ST_AsGeoJSON(p.geometry)::json AS geometry,
      p.created_at,
      p.updated_at
    FROM parcels p
    WHERE
      (
        $1::varchar IS NOT NULL
        AND p.ulpin = $1
      )
      OR
      (
        $2::varchar IS NOT NULL
        AND p.survey_number = $2
      )
      OR
      (
        $3::varchar IS NOT NULL
        AND p.khasra_number = $3
      )
    LIMIT 1
    `,
    [
      ulpin || null,
      surveyNumber || null,
      khasraNumber || null,
    ]
  );

  return result.rows[0] || null;
};

module.exports = {
  findParcelById,
  findParcelByDocumentId,
  findParcelByIdentifiers,
};