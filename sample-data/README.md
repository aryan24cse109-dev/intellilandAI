# IntelliLandAI — Sample Data

Synthetic land-record document dataset used for demonstration and testing.

---

## Table of Contents

- [Overview](#overview)
- [Dataset Structure](#dataset-structure)
- [Sample Documents](#sample-documents)
- [Document Categories](#document-categories)
- [Ground-Truth Mapping](#ground-truth-mapping)
- [Dataset Metadata](#dataset-metadata)
- [How the AI Service Uses These Files](#how-the-ai-service-uses-these-files)
- [Testing Scenarios](#testing-scenarios)
- [Adding a New Sample](#adding-a-new-sample)
- [Current Limitations](#current-limitations)
- [Synthetic Data Disclaimer](#synthetic-data-disclaimer)
- [Privacy Considerations](#privacy-considerations)

---

## Overview

The `sample-data/` directory contains synthetic land-record documents (PDFs) and corresponding ground-truth JSON files, used to demonstrate and test the document extraction and validation pipeline.

## Dataset Structure

```
sample-data/
│
├── ROR_001.pdf
├── ROR_001_POOR_QUALITY.pdf
├── ROR_002.pdf
├── MUTATION_001.pdf
├── REGISTRATION_001.pdf
├── REGISTRATION_001_POOR_QUALITY.pdf
├── REGISTRATION_002.pdf
├── HANDWRITTEN_001.pdf
├── HANDWRITTEN_001_POOR_QUALITY.pdf
├── HANDWRITTEN_002.pdf
│
├── dataset.json
└── metadata.json
```

> Ground-truth JSON files corresponding to each sample document are referenced by `dataset.json`; their individual filenames were not itemized in the source information beyond the mapping role of `dataset.json` itself. Exact ground-truth JSON filenames should be verified directly against the repository.

## Sample Documents

| File | Category | Quality Variant |
|---|---|---|
| `ROR_001.pdf` | Record of Rights (RoR) | Standard |
| `ROR_001_POOR_QUALITY.pdf` | Record of Rights (RoR) | Poor quality |
| `ROR_002.pdf` | Record of Rights (RoR) | Standard |
| `MUTATION_001.pdf` | Mutation | Standard |
| `REGISTRATION_001.pdf` | Registration / Sale Deed | Standard |
| `REGISTRATION_001_POOR_QUALITY.pdf` | Registration / Sale Deed | Poor quality |
| `REGISTRATION_002.pdf` | Registration / Sale Deed | Standard |
| `HANDWRITTEN_001.pdf` | Handwritten record | Standard |
| `HANDWRITTEN_001_POOR_QUALITY.pdf` | Handwritten record | Poor quality |
| `HANDWRITTEN_002.pdf` | Handwritten record | Standard |

## Document Categories

The sample set covers:

- **RoR** (Record of Rights)
- **Mutation**
- **Registration** (Sale Deed)
- **Handwritten**
- **Poor-quality** variants (for RoR, Registration, and Handwritten categories)

This is intended to demonstrate different document conditions and extraction/validation scenarios.

## Ground-Truth Mapping

- **`dataset.json`** — maps input documents to their corresponding ground-truth data.
- Ground truth may include expected extracted information (`expected_extraction`-type content) and expected validation behavior (`expected_validation`-type content).

> The exact internal JSON schema of `dataset.json` and its associated ground-truth entries is **Not currently specified** beyond its role as the document-to-ground-truth mapping file.

## Dataset Metadata

**`metadata.json`** — stores dataset-level metadata.

> The exact fields within `metadata.json` are **Not currently specified**.

## How the AI Service Uses These Files

The AI Service's document processor (`ai-service/services/document_processor.py`) and comparison tool (`ai-service/tools/compare.py`) are understood to use these sample documents and their ground-truth data for extraction and comparison/testing purposes.

**Ground-truth fallback**: The system supports an extraction source value of `synthetic_ground_truth_fallback`, indicating that in some cases the ground-truth data associated with these sample files may be used as a fallback source of extracted information rather than (or alongside) live LLM-based extraction.

> The exact trigger conditions for this fallback path are **Not currently specified**.

### Backend Usage

Whether/how the Backend directly references `sample-data/` (as opposed to only via the AI Service) is **Not currently specified**.

## Testing Scenarios

The dataset supports testing across:

- **Poor-quality document testing** — using the `_POOR_QUALITY` variants of RoR, Registration, and Handwritten documents.
- **Identifier testing** — verifying correct extraction/distinction of survey number, khasra number, and khata number across document types.
- **Validation testing** — using ground-truth `expected_validation` data (where present in `dataset.json`) to verify validation logic.

## Adding a New Sample

1. Add the new PDF document to `sample-data/`, following the existing naming convention: `<CATEGORY>_<NUMBER>.pdf` (e.g. `ROR_003.pdf`), with an optional `_POOR_QUALITY` suffix for degraded-quality variants.
2. Create a corresponding ground-truth JSON file for the new document.
3. Update `dataset.json` to map the new document filename to its ground-truth entry.
4. Update `metadata.json` if dataset-level metadata needs to reflect the new sample (e.g. counts, categories).

> Exact ground-truth JSON schema and `metadata.json` update requirements are **Not currently specified** — follow the structure of existing entries once verified against the repository.

## Current Limitations

- Exact ground-truth JSON filenames/schema not enumerated in the available information
- Exact `metadata.json` schema not enumerated
- Dataset size is limited to the 10 sample PDFs listed above

## Synthetic Data Disclaimer

> The current prototype uses synthetic/demo data for demonstration and testing. The sample land records, identifiers, parcel geometries, and related values should not be interpreted as official government records or legally verified land ownership information.

## Privacy Considerations

Because the dataset is synthetic/demonstration data, it is not expected to contain real personally identifiable landowner information. No real-world personal data handling policy is documented here beyond this expectation; this should be independently verified before any use beyond internal testing.