# IntelliLandAI Backend

Node.js + Express backend for the IntelliLandAI platform.

## Responsibilities

The backend manages:

- Authentication
- Authorization
- Document upload
- Document workflow
- Land-record APIs
- Validation APIs
- Verification APIs
- Parcel/GIS APIs
- Audit APIs
- Dashboard APIs
- PostgreSQL communication
- AI-service communication

## Stack

- Node.js
- Express.js
- PostgreSQL
- PostGIS
- JWT
- Multer
- Axios/fetch-based service communication

## Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js