# IntelliLand AI — Synthetic Dataset

## Overview

The `sample-data` directory contains a controlled synthetic dataset developed for the prototype of **IntelliLand AI — Intelligent Land Record Digitization and Validation System**.

The dataset is designed to simulate the diverse types of land-related documents that the proposed system is expected to process, including Record of Rights (RoR), mutation records, registration documents, handwritten legacy records, and degraded document scans.

Since access to authentic government land records is restricted and such records may contain sensitive personal or property information, the prototype uses **synthetically generated documents and reference data** for development, testing, and demonstration.

---

## Dataset Purpose

The dataset is primarily used to evaluate the prototype's ability to:

- Process scanned land-record documents.
- Perform OCR on printed and handwritten content.
- Handle Hindi and mixed-language documents.
- Extract predefined land-record fields.
- Process documents with different levels of image quality.
- Validate extracted information against known reference values.
- Identify matching and inconsistent records.
- Generate confidence scores for extracted information.
- Support human-assisted verification workflows.
- Link extracted land identifiers with corresponding GIS parcels.

---

## Dataset Categories

The current prototype contains the following document categories:

| Category | Description |
|---|---|
| **RoR** | Synthetic Record of Rights / Khatauni-style documents |
| **Mutation** | Synthetic records representing changes in ownership or land records |
| **Registration** | Synthetic sale/registration-style property documents |
| **Handwritten** | Synthetic handwritten and legacy-style land records |
| **Poor Quality** | Documents intentionally degraded to simulate real-world scanning conditions |
| **Maps** | GIS-based synthetic parcel data prepared separately using QGIS |

---

## Directory Structure

```text
sample-data/
│
├── documents/
│   ├── ror/
│   ├── mutation/
│   ├── registration/
│   ├── handwritten/
│   └── maps/
│
├── ground-truth/
│   ├── ror/
│   ├── mutation/
│   ├── registration/
│   └── handwritten/
│
├── metadata/
│   └── dataset.json
│
└── README.md