# IntelliLandAI — Database

PostgreSQL + PostGIS database schema for the IntelliLandAI platform.

---

## Table of Contents

- [Overview](#overview)
- [Database Details](#database-details)
- [Extensions](#extensions)
- [Table List](#table-list)
- [Table Details](#table-details)
- [Entity Relationship Overview](#entity-relationship-overview)
- [Setup](#setup)
- [Useful SQL Commands](#useful-sql-commands)
- [Current Limitations](#current-limitations)
- [Synthetic Data Disclaimer](#synthetic-data-disclaimer)

---

## Overview

The database layer stores all persisted application data for IntelliLandAI: users, uploaded documents, extracted land-record information, ownership/mutation/registration/legacy details, validation and verification results, audit logs, and spatial parcel data (via PostGIS) with parcel-linking relationships.

## Database Details

| Property | Value |
|---|---|
| Engine | PostgreSQL |
| Spatial extension | PostGIS |
| Additional extension | pgcrypto |
| Database name | `intelliland` |
| Identifier strategy | UUID-based records |

## Extensions

- **PostGIS** — enables spatial data types and operations for parcel geometry.
- **pgcrypto** — supports UUID generation and/or cryptographic functions used for record identifiers.

## Table List

| # | Table | Purpose |
|---|---|---|
| 1 | `users` | Application users and their roles |
| 2 | `documents` | Uploaded land-record documents |
| 3 | `land_records` | Extracted structured land information |
| 4 | `owners` | Owner-related information |
| 5 | `mutations` | Mutation-related information |
| 6 | `registrations` | Registration-related information |
| 7 | `legacy_records` | Legacy land-record information |
| 8 | `validation_results` | Validation results and comparison information |
| 9 | `verification_records` | Human verification actions |
| 10 | `audit_logs` | Workflow/audit events |
| 11 | `parcels` | Spatial parcel information |
| 12 | `parcel_links` | Connects land records with parcels |

## Table Details

### `users`

Stores application users and their roles (`ADMIN`, `OFFICER`, `VERIFIER`, `VIEWER`).

### `documents`

Stores uploaded land-record documents. Important concepts include:

- document ID
- document code
- document type
- file name
- file path
- language
- handwritten flag
- quality
- processing status
- uploaded_by
- extraction_source
- timestamps

**Document types:** `ROR`, `MUTATION`, `REGISTRATION`, `HANDWRITTEN`, `MAP`

**Document quality categories:** `clean`, `medium`, `poor`, `very_poor`

**Processing statuses:** `uploaded`, `preprocessing`, `processing`, `completed`, `failed`, `needs_review`

### `land_records`

Stores extracted structured land information, including:

- district
- tehsil
- village
- khata
- khasra
- survey
- area
- classification
- ownership share
- ULPIN (where available)

### `owners`

Stores owner-related information.

### `mutations`

Stores mutation-related information.

### `registrations`

Stores registration-related information.

### `legacy_records`

Stores legacy land-record information.

### `validation_results`

Stores validation results and comparison information generated during the validation step of the workflow.

### `verification_records`

Stores human verification actions. Supported verification actions:

- `ACCEPT`
- `CORRECT`
- `REJECT`
- `MARK_DISPUTED`

### `audit_logs`

Stores workflow/audit events.

### `parcels`

Stores spatial parcel information, including:

- `parcel_id`
- `ULPIN`
- `survey_number`
- `khasra_number`
- `area_hectares`
- `source`
- `geometry` (PostGIS spatial type)

### `parcel_links`

Connects land records with parcels.

**Link methods:** `ulpin_exact`, `survey_khasra`, `khasra_location`, `manual_review`

**Link statuses:** `linked`, `needs_review`

> Exact column names, data types, constraints, and indexes beyond those listed above are **Not currently specified** — this documentation reflects only the table-level and key-field information provided.

## Entity Relationship Overview

Core relationship:

```
documents
    ↓
land_records
    ↓
parcels
```

More specifically:

```
documents.id
      ↓
land_records.document_id

land_records.id
      ↓
parcels.land_record_id
```

Explicit parcel linking can additionally use a join table:

```
land_records
      ↓
parcel_links
      ↓
parcels
```

```
┌───────┐     ┌───────────┐     ┌───────────┐
│ users │     │ documents │────▶│land_records│
└───────┘     └───────────┘     └─────┬──────┘
                                       │
                     ┌─────────────────┼───────────────────┐
                     ▼                 ▼                   ▼
              ┌───────────┐   ┌──────────────────┐  ┌──────────────┐
              │  owners   │   │validation_results │  │  mutations   │
              └───────────┘   └──────────────────┘  └──────────────┘
                                       │
                     ┌─────────────────┼───────────────────┐
                     ▼                 ▼                   ▼
           ┌──────────────────┐ ┌─────────────┐    ┌────────────────┐
           │verification_records│ │ audit_logs │    │ legacy_records │
           └──────────────────┘ └─────────────┘    └────────────────┘
                     │
                     ▼
              ┌──────────────┐        ┌──────────┐
              │ parcel_links │ ──────▶│ parcels  │
              └──────────────┘        └──────────┘
                                            ▲
                                            │
                                       registrations
```

> This diagram reflects the conceptual relationships described in the source information. Exact foreign key names/constraints are **Not currently specified**.

## Setup

### Creating the Database

```sql
CREATE DATABASE intelliland;
```

### Enabling Extensions

```sql
\c intelliland

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Running Schema and Seed Scripts

```bash
psql -d intelliland -f schema.sql
psql -d intelliland -f seed.sql
```

> The exact location and filenames of `schema.sql` and `seed.sql` within the `database/` directory, and any runtime migration scripts, are **Not currently specified** beyond their conceptual existence as referenced in the project description.

## Useful SQL Commands

```sql
-- List all tables
\dt

-- Inspect land_records table structure
\d land_records

-- Inspect parcels table structure (including geometry column)
\d parcels

-- Count documents by processing status
SELECT processing_status, COUNT(*) FROM documents GROUP BY processing_status;

-- View parcel links and their statuses
SELECT link_method, status, COUNT(*) FROM parcel_links GROUP BY link_method, status;
```

> Exact column names used above (e.g. `processing_status`, `status`) are illustrative based on the described concepts and should be verified against the actual schema once available.

### Reset Instructions

Not currently specified.

## Current Limitations

- Exact column names, types, constraints, and indexes are not enumerated in the available information
- No confirmed migration tooling/framework
- No confirmed coordinate reference system (SRID) at the database layer beyond PostGIS geometry usage — see [`gis/README.md`](../gis/README.md)

## Synthetic Data Disclaimer

> The current prototype uses synthetic/demo data for demonstration and testing. The sample land records, identifiers, parcel geometries, and related values should not be interpreted as official government records or legally verified land ownership information.