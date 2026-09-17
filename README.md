# IntelliLandAI

> **AI-powered Intelligent Land Record Digitization, Validation and Parcel Linking Platform**

IntelliLandAI is a prototype AI-assisted decision-support platform for digitizing, extracting, validating, verifying, and linking information from Indian land-record documents.

## Important Prototype Note

IntelliLandAI is **not a replacement for authorized government land-record systems, legal verification, or government authorities**.

The current prototype uses **synthetic/demo data** and does not claim live access to DILRMP, LRMS, Bhu Naksha, NAKSHA, ULPIN services, or state land-record databases.

## Core Idea

**Document tells WHAT / WHICH LAND.**
**GIS tells WHERE.**
**Validation checks WHETHER INFORMATION IS CONSISTENT.**

## Workflow

```text
Upload Document
      ↓
Preprocessing
      ↓
OCR + Document Understanding
      ↓
Structured Extraction
      ↓
Validation
      ↓
Human Review / Correction
      ↓
Audit Trail
      ↓
Parcel Linking
      ↓
GIS Parcel View
```

## Live Demo

> **Live Prototype:** Coming soon

A cloud-hosted deployment is planned for evaluator access. The live URL will be added here after the cloud deployment is fully verified.

### Demo Video

> **Complete Working Demo:** `<https://youtu.be/Zx0Wei0orts?si=tdP-MXs5pLa4jGAY>`

The recorded demonstration shows the working prototype and its end-to-end workflow.

---

## Repository Structure

```text
intelliLandAI/
├── Frontend/
├── Backend/
├── ai-service/
├── database/
├── gis/
├── sample-data/
├── test_outputs/
├── .gitignore
├── README.md
├── data.json
├── main.py
├── pyproject.toml
└── uv.lock
```

## Components

| Module      | Technology                | Responsibility                                                |
| ----------- | ------------------------- | ------------------------------------------------------------- |
| Frontend    | React + Vite              | UI, workflow, validation review, GIS view                     |
| Backend     | Node.js + Express         | API, authentication, workflow, persistence, validation, audit |
| AI Service  | Python + FastAPI          | preprocessing, OCR/extraction pipeline, AI processing         |
| Database    | PostgreSQL + PostGIS      | application and spatial data                                  |
| GIS         | QGIS + GeoJSON/GeoPackage | synthetic parcel/map data                                     |
| Sample Data | PDF + JSON                | synthetic documents and ground truth                          |

See the README inside each module for setup and implementation details.

---

## End-to-End Processing

1. User uploads a document.
2. Backend stores document metadata.
3. Backend sends the document for AI processing.
4. AI service preprocesses and extracts structured information.
5. Backend normalizes and persists the result.
6. Validation results are generated.
7. Parcel-linking logic attempts to associate the record with a parcel.
8. Human review can accept, correct, reject, or dispute the result.
9. Changes are recorded in the audit trail.
10. The linked parcel can be displayed in the GIS interface.

## Roles

```text
ADMIN
OFFICER
VERIFIER
VIEWER
```

---

# 🧪 Local Demo

The complete IntelliLandAI prototype can be run locally using three application services and a PostgreSQL + PostGIS database.

## Prerequisites

Install:

* Git
* Node.js
* Python 3.13
* PostgreSQL with PostGIS
* npm

The AI service uses a Python 3.13 virtual environment.

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd intelliLandAI
```

## 2. Database Setup

Create a PostgreSQL database named:

```text
intelliland
```

Enable the required extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
```

Apply the schema:

```bash
psql -U postgres -d intelliland -f database/schema.sql
```

Load the synthetic demo data:

```bash
psql -U postgres -d intelliland -f database/seed.sql
```

For detailed database setup, see:

```text
database/README.md
```

---

## 3. Start AI Service

Open a terminal:

```bash
cd ai-service
```

Create/activate the Python environment:

### Git Bash

```bash
source .venv/Scripts/activate
```

Start the FastAPI service:

```bash
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

AI Service:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

Expected response:

```json
{
  "success": true,
  "message": "IntelliLandAI AI Service is running"
}
```

---

## 4. Start Backend

Open a second terminal:

```bash
cd Backend
npm install
npm start
```

Backend:

```text
http://localhost:5000
```

The backend connects to PostgreSQL/PostGIS and communicates with the AI service.

---

## 5. Start Frontend

Open a third terminal:

```bash
cd Frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the application in a browser:

```text
http://localhost:5173
```

---

## Local Service Overview

| Service    | Technology           | Port |
| ---------- | -------------------- | ---: |
| Frontend   | React + Vite         | 5173 |
| Backend    | Node.js + Express    | 5000 |
| AI Service | Python + FastAPI     | 8000 |
| Database   | PostgreSQL + PostGIS | 5432 |

### Local Architecture

```text
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │     :5173           │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Node.js + Express   │
                 │     :5000           │
                 └───────┬─────┬───────┘
                         │     │
              PostgreSQL │     │ HTTP
                         │     │
                         ▼     ▼
              ┌────────────┐  ┌────────────────┐
              │ PostgreSQL │  │   FastAPI AI   │
              │ + PostGIS  │  │     :8000      │
              └────────────┘  └───────┬────────┘
                                      │
                                      ▼
                                AI / OpenRouter
```

---

# ☁️ Cloud Deployment

The application is designed as a multi-service architecture and can be deployed using container-based cloud infrastructure.

A planned cloud deployment uses:

```text
                    ┌─────────────────┐
                    │ React Frontend  │
                    │     Vercel      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Node.js Backend │
                    │  Google Cloud   │
                    │     Run         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Python FastAPI  │
                    │   AI Service    │
                    │  Google Cloud   │
                    │     Run         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ PostgreSQL +    │
                    │     PostGIS     │
                    │  Cloud / DB     │
                    └─────────────────┘
```

### Cloud Configuration

Cloud deployment requires environment-specific configuration for:

* Frontend API base URL
* Backend API URL
* AI service URL
* PostgreSQL connection
* CORS configuration
* JWT secret
* OpenRouter API key
* Cloud service ports
* File/storage configuration

### Important

No real credentials, API keys, database passwords, or other secrets should be committed to this repository.

Cloud deployment documentation will be updated with the final service URLs and verified deployment configuration once the cloud deployment is completed.

---

# Environment Variables

Never commit real secrets.

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intelliland
DB_USER=postgres
DB_PASSWORD=<password>
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=<local-secret>
```

### AI Service

```env
OPENROUTER_API_KEY=<key-if-used>
```

For cloud deployment, these values must be replaced with the appropriate cloud service URLs and secret values.

Use each module's `.env.example` as the current source of truth.

---

# GIS and Parcel Linking

The prototype uses synthetic parcel data.

Records can be associated with parcels using identifiers such as:

* ULPIN
* Survey number
* Khasra number
* Contextual matching
* Manual review

The application separates the extracted land record from its parcel association.

---

# Security Principles

* JWT authentication
* Role-based access control
* Server-side validation
* Audit logging
* Explicit human verification actions
* No fabricated cadastral identifiers during extraction
* Synthetic data for demonstration
* Secrets kept outside source control

---

# Current Limitations

The prototype does not claim:

* Live government database access
* Official ULPIN verification
* Official ownership verification
* Production-scale deployment
* Guaranteed OCR accuracy
* Legal validity of extracted records
* Replacement of government verification workflows

A production deployment would require authorized integrations, security controls, data governance, infrastructure, monitoring, domain validation, and government approval.

---

# Current Prototype Flow

```text
Upload
  ↓
Process
  ↓
Extract
  ↓
Persist
  ↓
Validate
  ↓
Verify
  ↓
Audit
  ↓
Link Parcel
  ↓
View GIS
```

---

# Documentation

Each major module contains its own README with module-specific setup and implementation information:

```text
Frontend/README.md
Backend/README.md
ai-service/README.md
database/README.md
gis/README.md
sample-data/README.md
```

---

# License

Add the project's chosen license before public release.
