-- ============================================================
-- IntelliLandAI
-- PostgreSQL + PostGIS Database Schema
-- Version: 1.0.0
-- Purpose:
-- AI-powered land record digitization, validation and GIS
-- parcel linking prototype.
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;


-- ============================================================
-- 2. USERS
-- ============================================================
-- Stores system users/officers.
-- Authentication itself will be handled by Node/Express.
-- Passwords should NEVER be stored in plain text.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'OFFICER'
        CHECK (role IN (
            'ADMIN',
            'OFFICER',
            'VERIFIER',
            'VIEWER'
        )),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. DOCUMENTS
-- ============================================================
-- Represents every uploaded source document.

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_code VARCHAR(100) UNIQUE NOT NULL,

    document_type VARCHAR(30) NOT NULL
        CHECK (document_type IN (
            'ROR',
            'MUTATION',
            'REGISTRATION',
            'HANDWRITTEN',
            'MAP'
        )),

    file_name TEXT NOT NULL,

    file_path TEXT NOT NULL,

    language VARCHAR(100),

    is_handwritten BOOLEAN NOT NULL DEFAULT FALSE,

    quality VARCHAR(30) DEFAULT 'clean'
        CHECK (quality IN (
            'clean',
            'medium',
            'poor',
            'very_poor'
        )),

    processing_status VARCHAR(30) NOT NULL DEFAULT 'uploaded'
        CHECK (processing_status IN (
            'uploaded',
            'preprocessing',
            'processing',
            'completed',
            'failed',
            'needs_review'
        )),

    uploaded_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. LAND RECORDS
-- ============================================================
-- Common normalized land identity extracted from documents.
--
-- Document-specific information is stored in:
-- mutations
-- registrations
-- legacy_records
--
-- This table provides the common identity used for validation
-- and GIS linking.

CREATE TABLE IF NOT EXISTS land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID UNIQUE
        REFERENCES documents(id)
        ON DELETE SET NULL,

    district_hindi VARCHAR(150),

    district_english VARCHAR(150),

    tehsil_hindi VARCHAR(150),

    tehsil_english VARCHAR(150),

    village_hindi VARCHAR(150),

    village_english VARCHAR(150),

    khata_number VARCHAR(100),

    khasra_number VARCHAR(100),

    survey_number VARCHAR(100),

    area_hectares NUMERIC(12,4),

    area_acres NUMERIC(12,3),

    area_bigha TEXT,

    land_classification_hindi TEXT,

    land_classification_english TEXT,

    ownership_share VARCHAR(100),

    -- Nullable because ULPIN may not exist in the prototype
    -- dataset yet.
    ulpin VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. OWNERS
-- ============================================================
-- Stores owner/party information associated with a land record.

CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    land_record_id UUID NOT NULL
        REFERENCES land_records(id)
        ON DELETE CASCADE,

    name_hindi VARCHAR(255),

    name_english VARCHAR(255),

    father_husband_name_hindi VARCHAR(255),

    father_husband_name_english VARCHAR(255),

    ownership_role VARCHAR(50)
        CHECK (ownership_role IN (
            'OWNER',
            'PREVIOUS_OWNER',
            'NEW_OWNER',
            'SELLER',
            'BUYER',
            'CO_OWNER'
        )),

    ownership_share VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. MUTATIONS
-- ============================================================
-- Stores mutation-specific information.

CREATE TABLE IF NOT EXISTS mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID
        REFERENCES documents(id)
        ON DELETE SET NULL,

    land_record_id UUID
        REFERENCES land_records(id)
        ON DELETE CASCADE,

    mutation_number VARCHAR(100),

    mutation_date DATE,

    previous_owner_id UUID
        REFERENCES owners(id)
        ON DELETE SET NULL,

    new_owner_id UUID
        REFERENCES owners(id)
        ON DELETE SET NULL,

    relation_reason_hindi TEXT,

    relation_reason_english TEXT,

    khasra_number VARCHAR(100),

    khata_number VARCHAR(100),

    area_hectares NUMERIC(12,4),

    area_acres NUMERIC(12,3),

    mutation_type VARCHAR(100),

    order_reference_number VARCHAR(150),

    remarks_hindi TEXT,

    remarks_english TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. REGISTRATIONS
-- ============================================================
-- Stores sale/registration deed information.

CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID
        REFERENCES documents(id)
        ON DELETE SET NULL,

    land_record_id UUID
        REFERENCES land_records(id)
        ON DELETE CASCADE,

    registration_number VARCHAR(150),

    registration_date DATE,

    seller_id UUID
        REFERENCES owners(id)
        ON DELETE SET NULL,

    buyer_id UUID
        REFERENCES owners(id)
        ON DELETE SET NULL,

    survey_number VARCHAR(100),

    khasra_number VARCHAR(100),

    area_hectares NUMERIC(12,4),

    area_acres NUMERIC(12,3),

    property_description TEXT,

    consideration_value_inr NUMERIC(18,2),

    stamp_duty_paid_inr NUMERIC(18,2),

    witness_1 VARCHAR(255),

    witness_2 VARCHAR(255),

    remarks TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. LEGACY / HANDWRITTEN RECORDS
-- ============================================================
-- Stores information specific to handwritten/legacy documents.

CREATE TABLE IF NOT EXISTS legacy_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID
        REFERENCES documents(id)
        ON DELETE SET NULL,

    land_record_id UUID
        REFERENCES land_records(id)
        ON DELETE CASCADE,

    record_reference_number VARCHAR(150),

    record_date DATE,

    remarks_hindi TEXT,

    remarks_english TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. PARCELS - POSTGIS
-- ============================================================
-- Stores the actual GIS parcel geometry.
--
-- geometry:
-- POLYGON using WGS84 / EPSG:4326
--
-- In production this can be populated from authorized
-- cadastral/GIS datasets.

CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    land_record_id UUID
        REFERENCES land_records(id)
        ON DELETE CASCADE,

    parcel_id VARCHAR(150) UNIQUE,

    ulpin VARCHAR(50),

    survey_number VARCHAR(100),

    khasra_number VARCHAR(100),

    area_hectares NUMERIC(12,4),

    source VARCHAR(100),

    geometry GEOMETRY(POLYGON, 4326),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. VALIDATION RESULTS
-- ============================================================
-- Stores AI/reference comparison field-by-field.
--
-- Example:
--
-- field_name       = owner_name
-- ai_value         = Suresh Kumaar
-- reference_value  = Suresh Kumar
-- match_status     = partial_match
-- similarity_score = 0.94
--
-- This is the core table for the validation engine.

CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    land_record_id UUID
        REFERENCES land_records(id)
        ON DELETE SET NULL,

    field_name VARCHAR(150) NOT NULL,

    ai_value TEXT,

    reference_value TEXT,

    match_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (match_status IN (
            'match',
            'mismatch',
            'partial_match',
            'not_found',
            'pending'
        )),

    similarity_score NUMERIC(6,5),

    confidence_score NUMERIC(6,5),

    validation_method VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. VERIFICATION RECORDS
-- ============================================================
-- Stores human officer action after AI validation.

CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    validation_id UUID
        REFERENCES validation_results(id)
        ON DELETE SET NULL,

    officer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    action VARCHAR(30) NOT NULL
        CHECK (action IN (
            'ACCEPT',
            'CORRECT',
            'REJECT',
            'MARK_DISPUTED'
        )),

    corrected_value TEXT,

    remarks TEXT,

    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
-- Immutable-style history of important actions.
--
-- Useful for:
-- - Who changed what?
-- - When?
-- - Previous value?
-- - New value?
-- - Which document was involved?

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    document_id UUID
        REFERENCES documents(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    old_value JSONB,

    new_value JSONB,

    ip_address INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 13. INDEXES
-- ============================================================

-- ----------------------------
-- Documents
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_documents_type
ON documents(document_type);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
ON documents(uploaded_by);


-- ----------------------------
-- Land records
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_land_records_khata
ON land_records(khata_number);

CREATE INDEX IF NOT EXISTS idx_land_records_khasra
ON land_records(khasra_number);

CREATE INDEX IF NOT EXISTS idx_land_records_survey
ON land_records(survey_number);

CREATE INDEX IF NOT EXISTS idx_land_records_ulpin
ON land_records(ulpin);

CREATE INDEX IF NOT EXISTS idx_land_records_location
ON land_records(
    district_english,
    tehsil_english,
    village_english
);


-- ----------------------------
-- Owners
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_owners_land_record
ON owners(land_record_id);

CREATE INDEX IF NOT EXISTS idx_owners_name_english
ON owners(name_english);


-- ----------------------------
-- Mutations
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_mutations_number
ON mutations(mutation_number);

CREATE INDEX IF NOT EXISTS idx_mutations_land_record
ON mutations(land_record_id);


-- ----------------------------
-- Registrations
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_registrations_number
ON registrations(registration_number);

CREATE INDEX IF NOT EXISTS idx_registrations_land_record
ON registrations(land_record_id);


-- ----------------------------
-- Legacy records
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_legacy_land_record
ON legacy_records(land_record_id);


-- ----------------------------
-- Validation
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_validation_document
ON validation_results(document_id);

CREATE INDEX IF NOT EXISTS idx_validation_status
ON validation_results(match_status);


-- ----------------------------
-- Verification
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_verification_document
ON verification_records(document_id);

CREATE INDEX IF NOT EXISTS idx_verification_officer
ON verification_records(officer_id);


-- ----------------------------
-- Audit
-- ----------------------------

CREATE INDEX IF NOT EXISTS idx_audit_document
ON audit_logs(document_id);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_created_at
ON audit_logs(created_at);


-- ============================================================
-- 14. POSTGIS SPATIAL INDEX
-- ============================================================
-- GiST index makes parcel spatial queries efficient.

CREATE INDEX IF NOT EXISTS idx_parcels_geometry
ON parcels
USING GIST (geometry);


-- ============================================================
-- 15. PARCEL LOOKUP INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_parcels_ulpin
ON parcels(ulpin);

CREATE INDEX IF NOT EXISTS idx_parcels_survey
ON parcels(survey_number);

CREATE INDEX IF NOT EXISTS idx_parcels_khasra
ON parcels(khasra_number);

CREATE INDEX IF NOT EXISTS idx_parcels_land_record
ON parcels(land_record_id);


-- ============================================================
-- 16. UPDATED_AT TRIGGER
-- ============================================================
-- Automatically updates updated_at whenever a row changes.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Users

DROP TRIGGER IF EXISTS update_users_updated_at
ON users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Documents

DROP TRIGGER IF EXISTS update_documents_updated_at
ON documents;

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Land records

DROP TRIGGER IF EXISTS update_land_records_updated_at
ON land_records;

CREATE TRIGGER update_land_records_updated_at
BEFORE UPDATE ON land_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Owners

DROP TRIGGER IF EXISTS update_owners_updated_at
ON owners;

CREATE TRIGGER update_owners_updated_at
BEFORE UPDATE ON owners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Mutations

DROP TRIGGER IF EXISTS update_mutations_updated_at
ON mutations;

CREATE TRIGGER update_mutations_updated_at
BEFORE UPDATE ON mutations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Registrations

DROP TRIGGER IF EXISTS update_registrations_updated_at
ON registrations;

CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Legacy records

DROP TRIGGER IF EXISTS update_legacy_records_updated_at
ON legacy_records;

CREATE TRIGGER update_legacy_records_updated_at
BEFORE UPDATE ON legacy_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Parcels

DROP TRIGGER IF EXISTS update_parcels_updated_at
ON parcels;

CREATE TRIGGER update_parcels_updated_at
BEFORE UPDATE ON parcels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- END OF SCHEMA
-- ============================================================