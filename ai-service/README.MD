# IntelliLandAI — AI Service

Python + FastAPI service responsible for document intelligence and structured extraction.

---

## Table of Contents

- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [FastAPI Application and Routes](#fastapi-application-and-routes)
- [Document Processor](#document-processor)
- [Parser / Compare Tools](#parser--compare-tools)
- [Extraction Rules](#extraction-rules)
- [Zero-Hallucination Principle](#zero-hallucination-principle)
- [Survey Number vs. Khasra Number](#survey-number-vs-khasra-number)
- [Bilingual (Hindi/English) Extraction](#bilingual-hindienglish-extraction)
- [Extraction Source and Ground-Truth Fallback](#extraction-source-and-ground-truth-fallback)
- [Environment Variables](#environment-variables)
- [Installation and Running](#installation-and-running)
- [Backend ↔ AI Service Communication](#backend--ai-service-communication)
- [Current Limitations](#current-limitations)
- [Future / Planned](#future--planned)

---

## Overview

The AI Service is a Python-based FastAPI application that handles document intelligence: preprocessing, text extraction, document understanding, and structured field extraction from land-record documents. It uses Pydantic for schema definitions, LangChain for orchestration, and an OpenRouter-based LLM integration for the underlying language model calls.

## Responsibilities

- Document preprocessing
- Text extraction / document understanding
- Structured field extraction
- Bilingual (English/Hindi) information handling
- Land-record identifier extraction (survey number, khasra number, khata number, etc.)
- Producing validation-related extracted information for downstream use by the Backend

## Architecture

```
Backend (ai.service.js)
      │  REST
      ▼
FastAPI app
      │
      ▼
api/routes/document.py
      │
      ▼
services/document_processor.py
      │
      ├── preprocessing
      ├── OCR / document understanding
      ├── structured extraction (Pydantic schemas + LangChain + OpenRouter LLM)
      │
      ▼
Structured JSON response ───► Backend
```

Supporting tools:

```
tools/parser.py    → parsing logic
tools/compare.py   → comparison logic (e.g. against ground truth)
```

## Technology Stack

- Python (3.13)
- FastAPI
- Pydantic
- LangChain
- OpenRouter (LLM integration)

## Directory Structure

```
ai-service/
│
├── api/
│   └── routes/
│       └── document.py
│
├── services/
│   └── document_processor.py
│
└── tools/
    ├── compare.py
    └── parser.py
```

> Additional standard FastAPI project files (e.g. a top-level `main.py`/app factory, `schemas/`, `prompts/`) may exist but are **Not currently specified** beyond what is listed above. Note that a root-level `main.py` exists at the repository root (see the [root README](../README.md#repository-structure)); its exact relationship to the `ai-service/` directory is **Not currently specified**.

## FastAPI Application and Routes

`api/routes/document.py` defines the FastAPI route(s) for document processing/extraction.

> Exact endpoint paths, HTTP methods, and request/response schemas are **Not currently specified** beyond the existence of this route file.

## Document Processor

`services/document_processor.py` implements the core processing pipeline: preprocessing, document understanding, and structured extraction.

> The exact internal steps (e.g. specific OCR library/model used) are **Not currently specified** — see [Current Limitations](#current-limitations).

## Parser / Compare Tools

| Tool | Purpose (inferred) |
|---|---|
| `tools/parser.py` | Parsing logic supporting extraction |
| `tools/compare.py` | Comparison logic, e.g. comparing extraction output against ground truth |

## Extraction Rules

### Zero-Hallucination Principle

The extraction prompt follows a **zero-hallucination principle**:

- Only information explicitly present in the document is extracted.
- Missing, unclear, or illegible information is **not invented**.

### Survey Number vs. Khasra Number

The extraction logic explicitly distinguishes between:

- **Survey Number**
- **Khasra Number**
- **Khata Number**

For registration/sale deed documents:

- If a Survey Number exists → extracted as `survey_number`.
- If a Khasra Number exists → extracted as `khasra_number`.
- If both exist → both are kept separate.
- Survey Number is **never** copied into Khasra Number, and vice versa.

### Bilingual (Hindi/English) Extraction

Hindi/Devanagari information is preserved when available. Location fields include both English and Hindi variants:

- `district_english`, `district_hindi`
- `tehsil_english`, `tehsil_hindi`
- `village_english`, `village_hindi`

## Extraction Source and Ground-Truth Fallback

The AI service (in conjunction with the Backend's processing service) records an `extraction_source` value, which can be:

- `OpenRouter` — extraction produced via the OpenRouter-based LLM integration
- `synthetic_ground_truth_fallback` — extraction falls back to synthetic ground-truth data (e.g. for sample/demo documents)

> The exact conditions/logic that trigger the `synthetic_ground_truth_fallback` path are **Not currently specified** beyond its existence as a recorded extraction source value.

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | API key for OpenRouter-based LLM integration |

**Python version:** 3.13

## Installation and Running

```bash
cd ai-service

# create and activate a virtual environment (example)
python3.13 -m venv .venv
source .venv/bin/activate     # on Windows: .venv\Scripts\activate

# install dependencies
pip install -r requirements.txt   # exact dependency file/manager not currently specified

# set required environment variable
export OPENROUTER_API_KEY=your_key_here

# run the FastAPI application
uvicorn <app_module>:app --host 0.0.0.0 --port 8000   # exact module path not currently specified
```

The AI Service runs on port `8000` and is accessible at `http://localhost:8000`.

> The repository root also contains `pyproject.toml` and `uv.lock`, suggesting `uv` may be used for Python dependency management at the project level; the exact relationship between the root Python configuration and the `ai-service/` directory's own dependency setup is **Not currently specified**.

## API Request/Response Examples

Not currently specified — exact request/response payloads for `api/routes/document.py` were not provided.

## Backend ↔ AI Service Communication

The Backend's `services/ai.service.js` communicates with the AI Service to request document extraction and receives structured extraction results, which are then persisted by the Backend's `processing.service.js`.

## Current Limitations

- Exact API route paths/payload schemas are not enumerated in the available information
- No confirmed specific OCR model or LLM model name — do not assume a specific model beyond "OpenRouter-based LLM integration"
- No confirmed accuracy/performance benchmarks
- No confirmed dataset used for training/fine-tuning (extraction relies on prompting, per the zero-hallucination principle, rather than a custom-trained model)

## Future / Planned

Not currently specified.