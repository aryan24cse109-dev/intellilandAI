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
 * Primary relationship:
 *
 * documents
 *    ↓
 * land_records
 *    ↓
 * parcel_links
 *    ↓
 * parcels
 *
 * Legacy fallback:
 *
 * documents
 *    ↓
 * land_records
 *    ↓
 * parcels.land_record_id
 *
 * The parcel_links relationship is preferred because a synthetic GIS
 * parcel can be linked to multiple land records/documents without
 * modifying the parcel's own land_record_id.
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
      COALESCE(pl.link_method, 'reference_record') AS link_method,
      ST_AsGeoJSON(p.geometry)::json AS geometry,
      p.created_at,
      p.updated_at

    FROM documents d

    LEFT JOIN land_records lr
      ON lr.document_id = d.id

    /*
     * Preferred runtime/document-to-parcel relationship.
     */
    LEFT JOIN parcel_links pl
      ON pl.land_record_id = lr.id
      AND pl.link_status = 'linked'

    LEFT JOIN parcels linked_parcel
      ON linked_parcel.id = pl.parcel_id

    /*
     * Legacy relationship used by seeded/reference records.
     */
    LEFT JOIN parcels owned_parcel
      ON owned_parcel.land_record_id = lr.id

    /*
     * Prefer parcel_links, otherwise use the legacy parcel.
     */
    LEFT JOIN parcels p
      ON p.id = COALESCE(linked_parcel.id, owned_parcel.id)

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

/**
 * Automatically link a land record to a GIS parcel.
 *
 * Matching hierarchy:
 *
 * 1. Exact ULPIN
 * 2. Survey Number + Khasra Number
 * 3. Khasra Number
 * 4. Manual review
 */
const linkParcelForLandRecord = async (landRecordId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const recordResult = await client.query(
      `
      SELECT *
      FROM land_records
      WHERE id = $1
      `,
      [landRecordId]
    );

    const record = recordResult.rows[0];

    if (!record) {
      throw new Error("Land record not found for parcel linking");
    }

    let match = null;
    let method = null;

    /*
     * 1. Exact ULPIN match
     */
    if (record.ulpin) {
      const result = await client.query(
        `
        SELECT id
        FROM parcels
        WHERE ulpin = $1
        LIMIT 1
        `,
        [record.ulpin]
      );

      match = result.rows[0];

      if (match) {
        method = "ulpin_exact";
      }
    }

    /*
     * 2. Survey Number + Khasra Number
     */
    if (!match && record.survey_number && record.khasra_number) {
      const result = await client.query(
        `
        SELECT id
        FROM parcels
        WHERE survey_number = $1
          AND khasra_number = $2
        LIMIT 1
        `,
        [
          record.survey_number,
          record.khasra_number,
        ]
      );

      match = result.rows[0];

      if (match) {
        method = "survey_khasra";
      }
    }

    /*
     * 3. Khasra Number
     *
     * This is used for synthetic/demo records where the Khasra
     * number uniquely identifies the available GIS parcel.
     */
    if (!match && record.khasra_number) {
      const result = await client.query(
        `
        SELECT id
        FROM parcels
        WHERE khasra_number = $1
        LIMIT 1
        `,
        [record.khasra_number]
      );

      match = result.rows[0];

      if (match) {
        method = "khasra_location";
      }
    }

    /*
     * 4. No parcel found
     */
    if (!match) {
      await client.query("COMMIT");

      return {
        status: "needs_review",
        method: "manual_review",
        parcel: null,
      };
    }

    /*
     * Create/update document-to-parcel relationship.
     */
    const linkResult = await client.query(
      `
      INSERT INTO parcel_links (
        land_record_id,
        parcel_id,
        link_method,
        link_status
      )
      VALUES (
        $1,
        $2,
        $3,
        'linked'
      )
      ON CONFLICT (land_record_id, parcel_id)
      DO UPDATE SET
        link_method = EXCLUDED.link_method,
        link_status = 'linked'
      RETURNING *
      `,
      [
        landRecordId,
        match.id,
        method,
      ]
    );

    await client.query("COMMIT");

    return {
      status: "linked",
      method,
      parcel: linkResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findParcelById,
  findParcelByDocumentId,
  findParcelByIdentifiers,
  linkParcelForLandRecord,
};