-- ============================================================
-- IntelliLandAI - Synthetic Database Seed
-- Version: 1.0.1
-- Purpose: Prototype / Development / Testing
-- ============================================================

BEGIN;


-- ============================================================
-- 1. USERS
-- ============================================================

INSERT INTO public.users (
    id,
    full_name,
    email,
    password_hash,
    role,
    is_active
)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Admin User',
    'admin@intelliland.local',
    'DEMO_HASH_ADMIN',
    'ADMIN',
    TRUE
),
(
    '22222222-2222-2222-2222-222222222222',
    'Revenue Officer',
    'officer@intelliland.local',
    'DEMO_HASH_OFFICER',
    'OFFICER',
    TRUE
),
(
    '33333333-3333-3333-3333-333333333333',
    'Verification Officer',
    'verifier@intelliland.local',
    'DEMO_HASH_VERIFIER',
    'VERIFIER',
    TRUE
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. DOCUMENTS
-- ============================================================

INSERT INTO public.documents (
    id,
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
VALUES

(
    'a0000001-0000-0000-0000-000000000001',
    'DOC-ROR-001',
    'ROR',
    'ROR_001.pdf',
    'sample-data/documents/ror/ROR_001.pdf',
    'Hindi-English',
    FALSE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000002',
    'DOC-ROR-001-PQ',
    'ROR',
    'ROR_001_POOR_QUALITY.pdf',
    'sample-data/documents/ror/ROR_001_POOR_QUALITY.pdf',
    'Hindi-English',
    FALSE,
    'poor',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000003',
    'DOC-ROR-002',
    'ROR',
    'ROR_002.pdf',
    'sample-data/documents/ror/ROR_002.pdf',
    'Hindi-English',
    FALSE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000004',
    'DOC-MUT-001',
    'MUTATION',
    'MUTATION_001.pdf',
    'sample-data/documents/mutation/MUTATION_001.pdf',
    'Hindi-English',
    FALSE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000005',
    'DOC-REG-001',
    'REGISTRATION',
    'REGISTRATION_001.pdf',
    'sample-data/documents/registration/REGISTRATION_001.pdf',
    'Hindi-English',
    FALSE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000006',
    'DOC-REG-001-PQ',
    'REGISTRATION',
    'REGISTRATION_001_POOR_QUALITY.pdf',
    'sample-data/documents/registration/REGISTRATION_001_POOR_QUALITY.pdf',
    'Hindi-English',
    FALSE,
    'poor',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000007',
    'DOC-REG-002',
    'REGISTRATION',
    'REGISTRATION_002.pdf',
    'sample-data/documents/registration/REGISTRATION_002.pdf',
    'Hindi-English',
    FALSE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000008',
    'DOC-HW-001',
    'HANDWRITTEN',
    'HANDWRITTEN_001.pdf',
    'sample-data/documents/handwritten/HANDWRITTEN_001.pdf',
    'Hindi-English',
    TRUE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000009',
    'DOC-HW-001-PQ',
    'HANDWRITTEN',
    'HANDWRITTEN_001_POOR_QUALITY.pdf',
    'sample-data/documents/handwritten/HANDWRITTEN_001_POOR_QUALITY.pdf',
    'Hindi-English',
    TRUE,
    'poor',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
),

(
    'a0000001-0000-0000-0000-000000000010',
    'DOC-HW-002',
    'HANDWRITTEN',
    'HANDWRITTEN_002.pdf',
    'sample-data/documents/handwritten/HANDWRITTEN_002.pdf',
    'Hindi-English',
    TRUE,
    'clean',
    'uploaded',
    '22222222-2222-2222-2222-222222222222'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. LAND RECORDS
-- ============================================================

INSERT INTO public.land_records (
    id,
    document_id,
    district_hindi,
    district_english,
    tehsil_hindi,
    tehsil_english,
    village_hindi,
    village_english,
    khata_number,
    khasra_number,
    survey_number,
    area_hectares,
    area_acres,
    area_bigha,
    land_classification_hindi,
    land_classification_english,
    ownership_share,
    ulpin
)
VALUES

(
    'b0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'रामपुर (काल्पनिक)',
    'Rampur (Fictional)',
    'आनंदनगर',
    'Anandnagar',
    'चंदनपुर',
    'Chandanpur',
    '142/A',
    '589/2',
    NULL,
    1.2500,
    3.088,
    NULL,
    'कृषि भूमि (सिंचित / दोफसली)',
    'Agricultural Land (Irrigated / Double-cropped)',
    '1/1',
    '09SYNTHETIC000001'
),

(
    'b0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000003',
    'विजयनगर (काल्पनिक)',
    'Vijaynagar (Fictional)',
    'गोपालपुर',
    'Gopalpur',
    'सुंदरपुर',
    'Sundarpur',
    '287/B',
    '1042/1',
    NULL,
    2.4100,
    5.955,
    NULL,
    'असिंचित / एकफसली',
    'Unirrigated / Single-cropped',
    '1/2',
    '09SYNTHETIC000002'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. OWNERS
-- ============================================================

INSERT INTO public.owners (
    id,
    land_record_id,
    name_hindi,
    name_english,
    father_husband_name_hindi,
    father_husband_name_english,
    ownership_role,
    ownership_share
)
VALUES

(
    'c0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'सुरेश कुमार शर्मा',
    'Suresh Kumar Sharma',
    'स्व. रामनाथ शर्मा',
    'Late Ramnath Sharma',
    'OWNER',
    '1/1'
),

(
    'c0000001-0000-0000-0000-000000000002',
    'b0000001-0000-0000-0000-000000000002',
    'राजेश प्रताप सिंह',
    'Rajesh Pratap Singh',
    'विक्रम सिंह',
    'Vikram Singh',
    'OWNER',
    '1/2'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. MUTATIONS
-- ============================================================

INSERT INTO public.mutations (
    id,
    document_id,
    land_record_id,
    mutation_number,
    mutation_date,
    previous_owner_id,
    new_owner_id,
    relation_reason_hindi,
    relation_reason_english,
    khasra_number,
    khata_number,
    area_hectares,
    area_acres,
    mutation_type,
    order_reference_number,
    remarks_hindi,
    remarks_english
)
VALUES
(
    'd0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    'b0000001-0000-0000-0000-000000000001',
    'MUT-2026-001',
    '2026-07-10',
    NULL,
    'c0000001-0000-0000-0000-000000000001',
    'विरासत',
    'Inheritance',
    '589/2',
    '142/A',
    1.2500,
    3.088,
    'Inheritance',
    'ORDER-2026-7781',
    'राजस्व अभिलेख में नामांतरण दर्ज।',
    'Mutation recorded in revenue record.'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. REGISTRATIONS
-- ============================================================

INSERT INTO public.registrations (
    id,
    document_id,
    land_record_id,
    registration_number,
    registration_date,
    seller_id,
    buyer_id,
    survey_number,
    khasra_number,
    area_hectares,
    area_acres,
    property_description,
    consideration_value_inr,
    stamp_duty_paid_inr,
    witness_1,
    witness_2,
    remarks
)
VALUES

(
    'e0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    NULL,
    'REG-2026-001',
    '2026-07-15',
    NULL,
    NULL,
    'SV-402',
    '741/3',
    1.8500,
    4.571,
    'Agricultural land situated in Surajpur village.',
    4500000.00,
    315000.00,
    'Mohan Lal',
    'Ravi Kumar',
    'Synthetic registration record for prototype testing.'
),

(
    'e0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000006',
    NULL,
    'REG-2026-001',
    '2026-07-15',
    NULL,
    NULL,
    'SV-402',
    '741/3',
    1.8500,
    4.571,
    'Agricultural land situated in Surajpur village.',
    4500000.00,
    315000.00,
    'Mohan Lal',
    'Ravi Kumar',
    'Synthetic poor-quality duplicate for OCR testing.'
),

(
    'e0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000007',
    NULL,
    'REG-2026-002',
    '2026-08-02',
    NULL,
    NULL,
    '205/8',
    '589/2',
    1.2500,
    3.088,
    'Agricultural property transferred under registered sale deed.',
    3200000.00,
    224000.00,
    'Sanjay Verma',
    'Deepak Singh',
    'Synthetic registration record for validation testing.'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. LEGACY RECORDS
-- ============================================================

INSERT INTO public.legacy_records (
    id,
    document_id,
    land_record_id,
    record_reference_number,
    record_date,
    remarks_hindi,
    remarks_english
)
VALUES

(
    'f0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000008',
    NULL,
    'LEGACY-1984-001',
    '1984-10-15',
    'पुराना हस्तलिखित अभिलेख।',
    'Old handwritten land record.'
),

(
    'f0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000009',
    NULL,
    'LEGACY-1984-001',
    '1984-10-15',
    'पुराना हस्तलिखित अभिलेख।',
    'Old handwritten land record.'
),

(
    'f0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000010',
    NULL,
    'LEGACY-1985-002',
    '1985-06-20',
    'पुराना अभिलेख।',
    'Old land record.'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. PARCELS
-- ============================================================

INSERT INTO public.parcels (
    id,
    land_record_id,
    parcel_id,
    ulpin,
    survey_number,
    khasra_number,
    area_hectares,
    source,
    geometry
)
VALUES

(
    'a1000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'PARCEL-SYN-001',
    '09SYNTHETIC000001',
    NULL,
    '589/2',
    1.2500,
    'Synthetic Prototype Data',
    ST_GeomFromText(
        'POLYGON((
            79.1200 28.8200,
            79.1220 28.8200,
            79.1220 28.8220,
            79.1200 28.8220,
            79.1200 28.8200
        ))',
        4326
    )
),

(
    'a1000001-0000-0000-0000-000000000002',
    'b0000001-0000-0000-0000-000000000002',
    'PARCEL-SYN-002',
    '09SYNTHETIC000002',
    NULL,
    '1042/1',
    2.4100,
    'Synthetic Prototype Data',
    ST_GeomFromText(
        'POLYGON((
            79.2200 28.9200,
            79.2230 28.9200,
            79.2230 28.9230,
            79.2200 28.9230,
            79.2200 28.9200
        ))',
        4326
    )
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. VALIDATION RESULTS
-- ============================================================
-- Scores are stored on a 0.0 - 1.0 scale because the
-- database columns use NUMERIC(6,5).
--
-- Example:
-- 1.00000 = 100%
-- 0.98000 = 98%
-- 0.91200 = 91.2%
-- ============================================================

INSERT INTO public.validation_results (
    id,
    document_id,
    land_record_id,
    field_name,
    ai_value,
    reference_value,
    match_status,
    similarity_score,
    confidence_score,
    validation_method
)
VALUES

(
    'b1000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'khata_number',
    '142/A',
    '142/A',
    'match',
    1.00000,
    0.98000,
    'exact_match'
),

(
    'b1000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'khasra_number',
    '589/2',
    '589/2',
    'match',
    1.00000,
    0.98000,
    'exact_match'
),

(
    'b1000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'owner_name',
    'Suresh Kumar Sharma',
    'Suresh Kumar Sharma',
    'match',
    1.00000,
    0.97000,
    'normalized_exact_match'
),

(
    'b1000001-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'area_hectares',
    '1.2500',
    '1.2500',
    'match',
    1.00000,
    0.99000,
    'numeric_match'
),

(
    'b1000001-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000004',
    'b0000001-0000-0000-0000-000000000001',
    'new_owner_english',
    'Suresh Kumaar',
    'Suresh Kumar',
    'partial_match',
    0.96000,
    0.91200,
    'fuzzy_string_match'
),

(
    'b1000001-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000008',
    NULL,
    'owner_name',
    'Ramprasad Sharma',
    'Ramprasad Sharma',
    'match',
    1.00000,
    0.82000,
    'handwriting_extraction'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 10. VERIFICATION RECORDS
-- ============================================================

INSERT INTO public.verification_records (
    id,
    document_id,
    validation_id,
    officer_id,
    action,
    corrected_value,
    remarks
)
VALUES
(
    'c1000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    'b1000001-0000-0000-0000-000000000005',
    '33333333-3333-3333-3333-333333333333',
    'CORRECT',
    'Suresh Kumar',
    'Minor transliteration mismatch corrected after officer verification.'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 11. AUDIT LOGS
-- ============================================================

INSERT INTO public.audit_logs (
    id,
    user_id,
    document_id,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value,
    ip_address
)
VALUES

(
    'd1000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'a0000001-0000-0000-0000-000000000001',
    'DOCUMENT_UPLOADED',
    'documents',
    'a0000001-0000-0000-0000-000000000001',
    NULL,
    '{"status":"uploaded","file":"ROR_001.pdf"}'::jsonb,
    '127.0.0.1'
),

(
    'd1000001-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    'a0000001-0000-0000-0000-000000000004',
    'RECORD_CORRECTED',
    'validation_results',
    'b1000001-0000-0000-0000-000000000005',
    '{"new_owner_english":"Suresh Kumaar"}'::jsonb,
    '{"new_owner_english":"Suresh Kumar"}'::jsonb,
    '127.0.0.1'
)

ON CONFLICT (id) DO NOTHING;


COMMIT;