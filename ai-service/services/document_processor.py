from pathlib import Path
import json
import os

from tools.parser import parse_document


# Project root:
# intelliLandAI/
# ├── ai-service/
# │   └── services/
# │       └── document_processor.py
# └── sample-data/
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def load_synthetic_demo_fallback(source_path: Path) -> dict | None:
    """Return ground truth only for the bundled, named synthetic documents.

    This is deliberately unavailable for arbitrary uploads, and callers expose
    its use as ``synthetic_ground_truth_fallback`` rather than AI extraction.
    """
    stem = source_path.stem
    if "-" in stem and stem.split("-", 1)[0].isdigit():
        stem = stem.split("-", 1)[1]
    allowed = {
        "ROR_001": "ror/ROR_001_GROUND_TRUTH.json",
        "ROR_001_POOR_QUALITY": "ror/ROR_001_POOR_QUALITY_GROUND_TRUTH.json",
        "ROR_002": "ror/ROR_002_GROUND_TRUTH.json",
    }
    relative = allowed.get(stem)
    if not relative:
        return None
    with (PROJECT_ROOT / "sample-data" / "ground-truth" / relative).open(encoding="utf-8") as handle:
        return json.load(handle)


def resolve_document_path(file_path: str) -> Path:
    """
    Resolve both absolute paths and project-relative paths.

    Examples:
    - sample-data/documents/ror/ROR_001.pdf
    - Backend/uploads/document.pdf
    - C:/.../intelliLandAI/Backend/uploads/document.pdf
    """

    source_path = Path(file_path)

    # Absolute path: use directly.
    if source_path.is_absolute():
        return source_path

    # Relative path: resolve from IntelliLandAI project root.
    return (PROJECT_ROOT / source_path).resolve()


def process_document(
    document_id: str,
    file_path: str,
    document_type: str | None = None,
    language: str | None = None,
):
    source_path = resolve_document_path(file_path)

    if not source_path.is_file():
        raise FileNotFoundError(
            f"Document file not found: {source_path}"
        )

    schema_type = document_type or "auto"

    fallback = None
    if not os.getenv("OPENROUTER_API_KEY"):
        fallback = load_synthetic_demo_fallback(source_path)
        if fallback is None:
            raise ValueError(
                "OpenRouter is not configured. Synthetic demo fallback is available only for bundled ROR sample documents."
            )

    if fallback is not None:
        from schema import parse_land_document, detect_document_category
        model = parse_land_document(fallback)
        category = detect_document_category(fallback)
        doc_stem = source_path.stem
        extraction_source = "synthetic_ground_truth_fallback"
    else:
        model, category, doc_stem = parse_document(
            document_source=source_path,
            schema_type=schema_type,
        )
        extraction_source = "openrouter_ai"

    return {
        "document_id": document_id,
        "document_name": doc_stem,
        "document_category": category.value,
        "language": language,
        "extraction_source": extraction_source,
        "extracted_data": model.model_dump(mode="json"),
    }
