from pathlib import Path

from tools.parser import parse_document


# Project root:
# intelliLandAI/
# ├── ai-service/
# │   └── services/
# │       └── document_processor.py
# └── sample-data/
PROJECT_ROOT = Path(__file__).resolve().parents[2]


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

    model, category, doc_stem = parse_document(
        document_source=source_path,
        schema_type=schema_type,
    )

    return {
        "document_id": document_id,
        "document_name": doc_stem,
        "document_category": category.value,
        "language": language,
        "extracted_data": model.model_dump(mode="json"),
    }