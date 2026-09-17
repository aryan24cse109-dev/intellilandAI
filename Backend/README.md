# IntelliLandAI — Backend

Node.js + Express REST API for the IntelliLandAI platform.

---

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Application Entry Point](#application-entry-point)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Authentication and Authorization](#authentication-and-authorization)
- [Middleware](#middleware)
- [Controllers](#controllers)
- [Routes](#routes)
- [Services](#services)
- [Document Processing Workflow](#document-processing-workflow)
- [AI Service Communication](#ai-service-communication)
- [Validation, Verification, and Audit](#validation-verification-and-audit)
- [Parcel Linking](#parcel-linking)
- [Error Handling](#error-handling)
- [Local Installation and Running](#local-installation-and-running)
- [Current Limitations](#current-limitations)
- [Future / Planned](#future--planned)

---

## Overview

The Backend is the central REST API for IntelliLandAI. It authenticates users, orchestrates document upload and processing, communicates with the AI service for extraction, persists structured land-record data, manages validation/verification/audit workflows, exposes parcel-linking and GIS-related APIs, and serves dashboard data to the Frontend.

## Responsibilities

- Authentication and JWT-based authorization
- Role-based access control
- Document upload handling
- Orchestrating the document processing workflow
- Communicating with the AI service for extraction
- Persisting extracted land-record data
- Validation of extracted information
- Human verification / correction / rejection / dispute workflow
- Audit logging
- Parcel linking
- GIS-related APIs
- Dashboard APIs

## Architecture

```
Frontend
   │  REST (JWT)
   ▼
Express App (app.js)
   │
   ├── middleware (auth, role, upload, error)
   ├── routes → controllers → services
   │
   ├── services/ai.service.js ───► AI Service (FastAPI)
   ├── services/document.service.js
   ├── services/processing.service.js
   ├── services/validation.service.js
   ├── services/verification.service.js
   ├── services/audit.service.js
   ├── services/parcel.service.js
   │
   ▼
config/db.js ───► PostgreSQL + PostGIS
```

## Technology Stack

- Node.js
- Express.js
- REST APIs
- JWT authentication (via `utils/jwt.js`)
- PostgreSQL client (via `config/db.js`)

## Directory Structure

```
Backend/src/
│
├── app.js
│
├── config/
│   ├── db.js
│   └── env.js
│
├── controllers/
│   ├── audit.controller.js
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── document.controller.js
│   ├── landRecord.controller.js
│   ├── parcel.controller.js
│   ├── validation.controller.js
│   └── verification.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── role.middleware.js
│   └── upload.middleware.js
│
├── routes/
│   ├── audit.routes.js
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── document.routes.js
│   ├── landRecord.routes.js
│   ├── parcel.routes.js
│   ├── validation.routes.js
│   └── verification.routes.js
│
├── services/
│   ├── ai.service.js
│   ├── audit.service.js
│   ├── document.service.js
│   ├── parcel.service.js
│   ├── processing.service.js
│   ├── validation.service.js
│   └── verification.service.js
│
└── utils/
    ├── jwt.js
    ├── response.js
    └── validators.js
```

## Application Entry Point

`Backend/src/app.js` is the Express application entry point.

> Exact route mounting order, middleware registration sequence, and server bootstrap code are **Not currently specified** beyond the file's existence and role as the entry point.

## Configuration

| File | Purpose |
|---|---|
| `config/db.js` | PostgreSQL database connection configuration |
| `config/env.js` | Environment variable loading/configuration |

## Environment Variables

The following environment variables are implied by the configuration and utility files present in the Backend:

| Variable | Purpose |
|---|---|
| Database connection variables (used by `config/db.js`) | PostgreSQL connection to the `intelliland` database |
| JWT secret / related variables (used by `utils/jwt.js`) | Signing and verifying JWTs |
| Server port | Backend listens on port `5000` |

> Exact environment variable names (e.g. `DATABASE_URL`, `JWT_SECRET`, `PORT`) are **Not currently specified**; only their functional purpose can be inferred from the corresponding config/utility files.

**Server Port:** `5000` (Backend API is reachable at `http://localhost:5000/api`)

## Authentication and Authorization

- **Authentication**: JWT-based, implemented via `utils/jwt.js`, `auth.controller.js`, and `auth.routes.js`.
- **Authorization**: Role-based, enforced via `middleware/role.middleware.js` in combination with `middleware/auth.middleware.js`.

**Roles:** `ADMIN`, `OFFICER`, `VERIFIER`, `VIEWER`.

> The exact role-to-route mapping is **Not currently specified** beyond the presence of `role.middleware.js` governing role-based authorization.

## Middleware

| Middleware | Purpose |
|---|---|
| `auth.middleware.js` | Validates JWT and attaches authenticated user context to requests |
| `role.middleware.js` | Enforces role-based access control |
| `upload.middleware.js` | Handles document file upload processing |
| `error.middleware.js` | Centralized error handling |

## Controllers

| Controller | Responsibility |
|---|---|
| `auth.controller.js` | Login / authentication logic |
| `document.controller.js` | Document upload and management |
| `landRecord.controller.js` | Land record retrieval/management |
| `validation.controller.js` | Validation results handling |
| `verification.controller.js` | Human verification actions (accept/correct/reject/mark disputed) |
| `audit.controller.js` | Audit log retrieval |
| `parcel.controller.js` | Parcel data and parcel linking |
| `dashboard.controller.js` | Dashboard summary data |

## Routes

| Route File | Mounted Resource (inferred) |
|---|---|
| `auth.routes.js` | Authentication endpoints |
| `document.routes.js` | Document upload / management endpoints |
| `landRecord.routes.js` | Land record endpoints |
| `validation.routes.js` | Validation endpoints |
| `verification.routes.js` | Verification endpoints |
| `audit.routes.js` | Audit log endpoints |
| `parcel.routes.js` | Parcel / parcel-linking / GIS-related endpoints |
| `dashboard.routes.js` | Dashboard endpoints |

> Exact HTTP methods, path segments, and request/response payload shapes for each route are **Not currently specified**. Only the existence and functional area of each route file can be confirmed from the provided repository structure.

## Services

| Service | Responsibility |
|---|---|
| `ai.service.js` | Communication with the AI service for document extraction |
| `document.service.js` | Document persistence and management logic |
| `processing.service.js` | Orchestrates the end-to-end document processing workflow, persisting extracted land-record information |
| `validation.service.js` | Runs/persists validation of extracted data |
| `verification.service.js` | Handles human verification actions |
| `audit.service.js` | Records audit/workflow events |
| `parcel.service.js` | Parcel data retrieval and parcel-linking logic |

### Processing Service Detail

The processing service persists extracted land-record information, including:

- creating/updating land records
- creating/updating owner information
- generating validation results
- recording extraction source
- linking land records to parcels where applicable

Extraction source values recorded include:

- `OpenRouter`
- `synthetic_ground_truth_fallback`

## Document Processing Workflow

```
Document Upload (upload.middleware.js)
        ↓
document.controller.js → document.service.js
        ↓
processing.service.js
        ↓
ai.service.js  ──────►  AI Service (FastAPI)
        ↓
Persist land_records / owners / validation_results
        ↓
parcel.service.js (parcel linking, where applicable)
```

Document processing statuses (as reflected in the database schema): `uploaded`, `preprocessing`, `processing`, `completed`, `failed`, `needs_review`.

## AI Service Communication

The Backend communicates with the AI Service via `services/ai.service.js`. The AI Service returns extracted structured information, which is then persisted by `processing.service.js`.

> The exact request/response contract (endpoint path, payload schema) between `ai.service.js` and the AI Service is **Not currently specified** in the information provided.

## Validation, Verification, and Audit

- **Validation**: `validation.controller.js` / `validation.service.js` handle validation results tied to extracted land records.
- **Verification**: `verification.controller.js` / `verification.service.js` support human verification actions — `ACCEPT`, `CORRECT`, `REJECT`, `MARK_DISPUTED`.
- **Audit**: `audit.controller.js` / `audit.service.js` record workflow/audit events to `audit_logs`.

## Parcel Linking

`parcel.controller.js` / `parcel.service.js` handle retrieval of parcel data and linking of land records to parcels, supporting the `parcel_links` table's link methods (`ulpin_exact`, `survey_khasra`, `khasra_location`, `manual_review`) and statuses (`linked`, `needs_review`).

## Error Handling

`middleware/error.middleware.js` provides centralized error handling. `utils/response.js` and `utils/validators.js` support standardized response formatting and input validation respectively.

## Local Installation and Running

```bash
cd Backend
npm install
npm run <start-script>   # exact script name not currently specified
```

The Backend listens on port `5000` and exposes its API at `http://localhost:5000/api`.

> The exact `npm` script name used to start the server (e.g. `start`, `dev`) is **Not currently specified**.

### Testing

Not currently specified — no test scripts/framework were provided as part of the source information.

## Current Limitations

- Exact route paths/HTTP methods are not enumerated in the available information
- Exact environment variable names are not enumerated
- No confirmed test suite
- Prototype-stage; not verified for production deployment

## Future / Planned

Not currently specified.