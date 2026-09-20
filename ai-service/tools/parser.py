"""
ai-service/tools/parser.py

Universal Land Record Extraction Engine for Indian Revenue Documents.

Supported document types:
- Land Mutation Register / Orders
- Property Registration Sale Deeds
- Record of Rights / Khatauni / Jamabandi
- Legacy Handwritten Revenue Records
- Unified Land Records

Architecture:
- OpenRouter OpenAI-compatible endpoint
- LangChain ChatOpenAI
- Pydantic schemas from schema.py
- Robust JSON extraction from LLM responses
- Normalization of common LLM field-name variations
- Zero fabricated values
- UTF-8 support for Hindi / Devanagari
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Type, Union

from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyMuPDFLoader


# =============================================================================
# UTF-8 CONFIGURATION
# =============================================================================

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# =============================================================================
# PATH CONFIGURATION
# =============================================================================

CURRENT_DIR = Path(__file__).resolve().parent
AI_SERVICE_DIR = CURRENT_DIR.parent
PROJECT_ROOT = AI_SERVICE_DIR.parent

if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# =============================================================================
# ENVIRONMENT
# =============================================================================

ENV_FILE = AI_SERVICE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)


# =============================================================================
# SCHEMA IMPORTS
# =============================================================================

from schema import (
    BaseLandRecordSchema,
    MutationDocumentSchema,
    HandwrittenDocumentSchema,
    RegistrationDocumentSchema,
    RORDocumentSchema,
    UnifiedLandRecordSchema,
    DocumentCategory,
    parse_numeric_area,
)


# =============================================================================
# SCHEMA REGISTRY
# =============================================================================

SCHEMA_REGISTRY: Dict[DocumentCategory, Type[BaseModel]] = {
    DocumentCategory.MUTATION: MutationDocumentSchema,
    DocumentCategory.HANDWRITTEN: HandwrittenDocumentSchema,
    DocumentCategory.REGISTRATION: RegistrationDocumentSchema,
    DocumentCategory.ROR: RORDocumentSchema,
    DocumentCategory.UNKNOWN: UnifiedLandRecordSchema,
}


SCHEMA_ALIAS_MAP: Dict[str, Type[BaseModel]] = {
    "mutation": MutationDocumentSchema,
    "namantaran": MutationDocumentSchema,
    "handwritten": HandwrittenDocumentSchema,
    "legacy": HandwrittenDocumentSchema,
    "legacy_revenue": HandwrittenDocumentSchema,
    "registration": RegistrationDocumentSchema,
    "sale_deed": RegistrationDocumentSchema,
    "saledeed": RegistrationDocumentSchema,
    "registry": RegistrationDocumentSchema,
    "ror": RORDocumentSchema,
    "khatauni": RORDocumentSchema,
    "jamabandi": RORDocumentSchema,
    "unified": UnifiedLandRecordSchema,
    "unknown": UnifiedLandRecordSchema,
}


# =============================================================================
# LLM INITIALIZATION
# =============================================================================

def get_llm(
    model: Optional[str] = None,
    temperature: float = 0.0,
) -> ChatOpenAI:
    """
    Creates the OpenRouter ChatOpenAI client.

    The client is initialized lazily so the FastAPI service can start even
    when the OpenRouter key is unavailable.
    """

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OpenRouter API key is not configured. "
            "Set OPENROUTER_API_KEY in ai-service/.env."
        )

    selected_model = (
        model
        or os.getenv("OPENROUTER_MODEL")
        or "openrouter/free"
    )

    try:
        timeout = float(os.getenv("OPENROUTER_TIMEOUT", "120"))
    except ValueError:
        timeout = 120.0

    try:
        max_retries = int(os.getenv("OPENROUTER_MAX_RETRIES", "2"))
    except ValueError:
        max_retries = 2

   return ChatOpenAI(
    model=selected_model,
    temperature=0.0,
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    timeout=timeout,
    max_retries=max_retries,
    max_tokens=8192,
    model_kwargs={
        "response_format": {
            "type": "json_object"
        }
    },
    default_headers={
        "HTTP-Referer": "https://intelliland.vercel.app",
        "X-Title": "IntelliLandAI",
    },
)


# Global lazy client.
llm: Optional[ChatOpenAI] = None


# =============================================================================
# EXTRACTION PROMPT
# =============================================================================

PARSER_SYSTEM_PROMPT = """
You are IntelliLandAI, an expert Indian land-record extraction engine.

Your job is to extract structured information from Indian land records,
including:

- Record of Rights / RoR / Khatauni / Jamabandi
- Mutation / Namantaran records
- Registration / Sale Deeds
- Legacy handwritten revenue records

STRICT RULES:

1. ZERO HALLUCINATION
Only extract information explicitly present in the document text.

If a field is missing, unclear, illegible, or not present:
- return null
- never invent a value
- never guess a number
- never guess a person's name
- never fabricate ULPIN
- never fabricate survey/khasra numbers

2. RETURN JSON ONLY

Your response MUST contain exactly one JSON object.

Do not return:
- Markdown
- ```json fences
- explanations
- comments
- "User Safety"
- safety messages
- prose before or after JSON

The first character of your useful response must be "{"
and the final character must be "}".

3. FIELD NAMES

Use the exact field names supplied in the target schema.

For location fields use:

"district_english"
"district_hindi"
"tehsil_english"
"tehsil_hindi"
"village_english"
"village_hindi"

For cadastral identifiers use:

"khasra_number"
"khata_number"
"survey_number"

Do NOT create nested objects such as:

"district": {
    "english": "...",
    "hindi": "..."
}

Instead return:

"district_english": "...",
"district_hindi": "..."

4. DATES

Preserve the date from the document accurately.

Never corrupt the year.

Examples:
"12-May-2026"
"2026-05-12"

5. CADASTRAL IDENTIFIERS

Preserve numbers exactly.

Examples:
"741/3"
"589/2"
"205/8"
"SV-402"

Do not remove slashes.

6. REGISTRATION / SALE DEED IDENTIFIERS

For Registration / Sale Deed documents, carefully distinguish between
different cadastral identifiers.

If a Survey Number is explicitly present in the document:
- extract it into "survey_number"
- preserve its exact value
- preserve slashes, hyphens, letters, and suffixes
- do not modify or normalize the identifier

If a Khasra Number is explicitly present:
- extract it into "khasra_number"
- keep it separate from "survey_number"

If both Survey Number and Khasra Number are present, populate both
fields independently.

Examples:

"Survey No.: SV-402"
→ "survey_number": "SV-402"

"Khasra No.: 589/2"
→ "khasra_number": "589/2"

"Survey No.: SV-402, Khasra No.: 589/2"
→ "survey_number": "SV-402"
→ "khasra_number": "589/2"

NEVER copy a Khasra Number into "survey_number".

NEVER copy a Survey Number into "khasra_number".

If the Survey Number is not explicitly present or cannot be reliably
read, return null for "survey_number".

6. LAND AREA

Return numeric hectare/acre fields as numbers where possible.

Example:
1.25

Do not write:
"1.25 hectares"

Traditional Bigha/Biswa can remain a string.

7. HINDI

Preserve Devanagari Hindi when available.

8. BILINGUAL INFORMATION

If both English and Hindi are present, populate both fields.

9. DOCUMENT TYPE

Use the appropriate record type based only on the document.

10. REQUIRED FIELDS

For required schema fields:
- extract them from the document if explicitly present
- do not invent or guess a value
- if a required field is genuinely absent, return null
- the application will flag the record for validation/review when the
  returned value cannot satisfy the target schema

The application will decide whether human verification is required.
"""


# =============================================================================
# DOCUMENT LOADING
# =============================================================================

def load_document_text(
    source: Union[str, Path]
) -> Tuple[str, str]:
    """
    Loads text from:
    - PDF
    - TXT
    - JSON
    - CSV
    - image
    - raw text

    Returns:
        (raw_text, document_stem)
    """

    source_path = Path(source) if isinstance(source, (str, Path)) else None
    resolved_path: Optional[Path] = None

    if source_path:
        candidates = [
            source_path,
            PROJECT_ROOT / source_path,
            AI_SERVICE_DIR / source_path,
        ]

        for candidate in candidates:
            if candidate.is_file():
                resolved_path = candidate
                break

    if resolved_path:
        doc_stem = resolved_path.stem
        suffix = resolved_path.suffix.lower()

        # ---------------------------------------------------------
        # PDF
        # ---------------------------------------------------------

        if suffix == ".pdf":
            try:
                loader = PyMuPDFLoader(str(resolved_path))
                pages = loader.load()

                raw_text = "\n\n".join(
                    page.page_content
                    for page in pages
                )

                raw_text = raw_text.strip()

                if raw_text:
                    return raw_text, doc_stem

            except Exception:
                pass

            # Fallback to direct PyMuPDF
            try:
                import fitz

                doc = fitz.open(str(resolved_path))

                text_list = [
                    page.get_text()
                    for page in doc
                ]

                raw_text = "\n\n".join(text_list).strip()

                return raw_text, doc_stem

            except Exception as exc:
                raise ValueError(
                    f"Could not extract text from PDF "
                    f"{resolved_path}: {exc}"
                ) from exc

        # ---------------------------------------------------------
        # TXT / JSON / CSV
        # ---------------------------------------------------------

        if suffix in (".txt", ".json", ".csv"):
            with open(
                resolved_path,
                "r",
                encoding="utf-8"
            ) as file:
                content = file.read()

            if suffix == ".json":
                try:
                    data = json.loads(content)

                    if isinstance(data, dict):

                        if "ocr" in data:
                            return (
                                str(data["ocr"]).strip(),
                                doc_stem,
                            )

                        if "raw_text" in data:
                            return (
                                str(data["raw_text"]).strip(),
                                doc_stem,
                            )

                except Exception:
                    pass

            return content.strip(), doc_stem

        # ---------------------------------------------------------
        # IMAGE
        # ---------------------------------------------------------

        if suffix in (
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".tiff",
            ".bmp",
        ):
            try:
                from main import process_image

                result = process_image(str(resolved_path))

                ocr_text = str(
                    result.get("ocr", "")
                ).strip()

                return ocr_text, doc_stem

            except Exception as exc:
                raise ValueError(
                    f"Could not extract OCR text from image "
                    f"{resolved_path}: {exc}"
                ) from exc

        # ---------------------------------------------------------
        # Generic text file
        # ---------------------------------------------------------

        try:
            with open(
                resolved_path,
                "r",
                encoding="utf-8"
            ) as file:
                return file.read().strip(), doc_stem

        except Exception as exc:
            raise ValueError(
                f"Could not read document {resolved_path}: {exc}"
            ) from exc

    # -----------------------------------------------------------------
    # Raw text input
    # -----------------------------------------------------------------

    raw_str = str(source).strip()

    return raw_str, "extracted_document"


# =============================================================================
# DOCUMENT CLASSIFICATION
# =============================================================================

def detect_document_category_from_text(
    text: str,
    filename: str = "",
) -> DocumentCategory:
    """
    Detect document category from filename/header/text.
    """

    combined = (
        filename + " " + text[:2000]
    ).lower()

    full_lower = text.lower()

    # Mutation
    if any(
        key in combined
        for key in [
            "mutation",
            "namantaran",
            "नामांतरण",
            "वरासत",
            "उत्तराधिकार",
            "mutation no",
        ]
    ):
        return DocumentCategory.MUTATION

    # Registration
    if any(
        key in combined
        for key in [
            "sub-registrar",
            "sale deed",
            "विक्रय विलेख",
            "उप-पंजीयक",
            "deed registration",
            "consideration value",
            "stamp duty",
        ]
    ):
        return DocumentCategory.REGISTRATION

    # Handwritten / Legacy
    if any(
        key in combined
        for key in [
            "legacy revenue",
            "handwritten",
            "पुरातन राजस्व",
            "पुरातन भू-अभिलेख",
            "भू-अभिलेख रजिस्टर",
            "bigha",
            "बीघा",
        ]
    ):
        return DocumentCategory.HANDWRITTEN

    # RoR
    if any(
        key in combined
        for key in [
            "record of rights",
            "khatauni",
            "खतौनी",
            "अधिकार अभिलेख",
            "jamabandi",
            "जमाबंदी",
            "प्रपत्र 10",
            "form 10",
        ]
    ):
        return DocumentCategory.ROR

    # Broader fallback
    if (
        "mutation" in full_lower
        or "नामांतरण" in full_lower
    ):
        return DocumentCategory.MUTATION

    if (
        "sale deed" in full_lower
        or "विक्रय विलेख" in full_lower
        or "sub-registrar" in full_lower
    ):
        return DocumentCategory.REGISTRATION

    if (
        "khatauni" in full_lower
        or "खतौनी" in full_lower
        or "record of rights" in full_lower
        or "jamabandi" in full_lower
    ):
        return DocumentCategory.ROR

    if (
        "legacy" in full_lower
        or "पुरातन" in full_lower
        or "bigha" in full_lower
        or "बीघा" in full_lower
    ):
        return DocumentCategory.HANDWRITTEN

    return DocumentCategory.UNKNOWN


# =============================================================================
# SCHEMA RESOLUTION
# =============================================================================

def resolve_schema(
    schema_type: Union[
        str,
        Type[BaseModel],
        DocumentCategory,
        None,
    ],
    raw_text: str = "",
    filename: str = "",
) -> Tuple[
    Type[BaseModel],
    DocumentCategory,
]:

    if (
        isinstance(schema_type, type)
        and issubclass(schema_type, BaseModel)
    ):
        category = DocumentCategory.UNKNOWN

        for cat, schema_cls in SCHEMA_REGISTRY.items():
            if schema_cls == schema_type:
                category = cat
                break

        return schema_type, category

    if isinstance(schema_type, DocumentCategory):
        return (
            SCHEMA_REGISTRY.get(
                schema_type,
                UnifiedLandRecordSchema,
            ),
            schema_type,
        )

    if isinstance(schema_type, str):

        cleaned_key = schema_type.strip().lower()

        if cleaned_key in SCHEMA_ALIAS_MAP:

            target_cls = SCHEMA_ALIAS_MAP[cleaned_key]

            for cat, schema_cls in SCHEMA_REGISTRY.items():

                if schema_cls == target_cls:
                    return target_cls, cat

            return (
                target_cls,
                DocumentCategory.UNKNOWN,
            )

        if cleaned_key != "auto":

            for cat in DocumentCategory:

                if (
                    cat.value.lower()
                    == cleaned_key
                ):
                    return (
                        SCHEMA_REGISTRY[cat],
                        cat,
                    )

    # Auto detection
    detected_category = (
        detect_document_category_from_text(
            raw_text,
            filename,
        )
    )

    target_schema = SCHEMA_REGISTRY.get(
        detected_category,
        UnifiedLandRecordSchema,
    )

    return target_schema, detected_category


# =============================================================================
# JSON EXTRACTION HELPERS
# =============================================================================

def _content_to_text(content: Any) -> str:
    """
    Converts different LangChain/OpenAI response content formats
    into plain text.
    """

    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):

        parts: List[str] = []

        for item in content:

            if isinstance(item, str):
                parts.append(item)
                continue

            if isinstance(item, dict):

                text = item.get("text")

                if text is not None:
                    parts.append(str(text))

                continue

            parts.append(str(item))

        return "\n".join(parts)

    if isinstance(content, dict):

        if "text" in content:
            return str(content["text"])

        return json.dumps(
            content,
            ensure_ascii=False,
        )

    return str(content)


def _remove_safety_prefixes(text: str) -> str:
    """
    Removes harmless provider/model wrapper text such as:

    User Safety: safe

    without modifying actual JSON content.
    """

    cleaned = text.strip()

    # Remove common provider safety line only when it occurs
    # before the JSON object.
    cleaned = re.sub(
        r"^\s*User\s+Safety\s*:\s*[^\n]*\n?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"^\s*Safety\s*:\s*[^\n]*\n?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    return cleaned.strip()


def _strip_markdown_fences(text: str) -> str:
    """
    Removes markdown JSON fences if the model ignores the
    JSON-only instruction.
    """

    cleaned = text.strip()

    if cleaned.startswith("```"):

        cleaned = re.sub(
            r"^```(?:json)?\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )

        cleaned = re.sub(
            r"\s*```$",
            "",
            cleaned,
        )

    return cleaned.strip()


def _extract_balanced_json_object(
    text: str,
) -> Optional[str]:
    """
    Finds the first balanced JSON object.

    Handles braces inside quoted strings correctly.
    """

    start = text.find("{")

    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False

    for index in range(start, len(text)):

        char = text[index]

        if in_string:

            if escaped:
                escaped = False
                continue

            if char == "\\":
                escaped = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "{":
            depth += 1

        elif char == "}":

            depth -= 1

            if depth == 0:
                return text[start:index + 1]

    return None


def extract_json_from_llm_response(
    response: Any,
) -> Dict[str, Any]:
    """
    Converts an LLM response into a Python dictionary.

    Supports:
    - AIMessage
    - plain string
    - dict
    - list content blocks
    - markdown fenced JSON
    - provider safety prefixes
    """

    # ---------------------------------------------------------
    # Direct dictionary
    # ---------------------------------------------------------

    if isinstance(response, dict):
        return response

    # ---------------------------------------------------------
    # LangChain AIMessage
    # ---------------------------------------------------------

    content = getattr(
        response,
        "content",
        response,
    )

    text = _content_to_text(content)

    if not text.strip():
        raise ValueError(
            "OpenRouter returned an empty response."
        )

    text = _remove_safety_prefixes(text)
    text = _strip_markdown_fences(text)

    # ---------------------------------------------------------
    # Direct JSON
    # ---------------------------------------------------------

    try:
        parsed = json.loads(text)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    # ---------------------------------------------------------
    # Extract balanced JSON object
    # ---------------------------------------------------------

    json_text = _extract_balanced_json_object(text)

    if json_text:

        try:
            parsed = json.loads(json_text)

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

    preview = text[:1000].replace("\n", "\\n")

    raise ValueError(
        "OpenRouter did not return a valid JSON object. "
        f"Response preview: {preview}"
    )


# =============================================================================
# NORMALIZATION HELPERS
# =============================================================================

def _first_value(
    data: Dict[str, Any],
    keys: List[str],
) -> Any:
    """
    Returns the first non-empty value from a list of possible keys.
    """

    for key in keys:

        if key not in data:
            continue

        value = data.get(key)

        if value is None:
            continue

        if isinstance(value, str) and not value.strip():
            continue

        return value

    return None


def _nested_language_value(
    value: Any,
    language: str,
) -> Any:
    """
    Extracts English/Hindi value from an object such as:

    {
        "english": "...",
        "hindi": "..."
    }
    """

    if not isinstance(value, dict):
        return None

    aliases = {
        "english": [
            "english",
            "en",
            "eng",
            "value_english",
        ],
        "hindi": [
            "hindi",
            "hi",
            "devanagari",
            "value_hindi",
        ],
    }

    for key in aliases.get(language, []):

        if key in value:

            result = value[key]

            if result is not None:
                return result

    return None


def _normalize_location_field(
    data: Dict[str, Any],
    base_name: str,
) -> None:
    """
    Converts nested location structures into the exact schema fields.

    Example:

        district: {
            english: "Rampur",
            hindi: "रामपुर"
        }

    becomes:

        district_english: "Rampur"
        district_hindi: "रामपुर"
    """

    nested = data.get(base_name)

    if isinstance(nested, dict):

        english = _nested_language_value(
            nested,
            "english",
        )

        hindi = _nested_language_value(
            nested,
            "hindi",
        )

        if (
            english is not None
            and not data.get(
                f"{base_name}_english"
            )
        ):
            data[f"{base_name}_english"] = english

        if (
            hindi is not None
            and not data.get(
                f"{base_name}_hindi"
            )
        ):
            data[f"{base_name}_hindi"] = hindi

        # Remove nested version because it is not part
        # of the Pydantic schema.
        data.pop(base_name, None)

    elif nested is not None:

        # If model returns a plain value for the location,
        # treat it as English only.
        english_key = f"{base_name}_english"

        if not data.get(english_key):
            data[english_key] = nested

        data.pop(base_name, None)


def normalize_extracted_data(
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Normalizes common LLM-generated field variations to the exact
    schema.py field names.

    IMPORTANT:
    This function NEVER invents values.

    It only renames or unwraps information already returned by
    the model.
    """

    if not isinstance(data, dict):
        raise ValueError(
            "Extracted AI result must be a JSON object."
        )

    normalized = dict(data)

    # ---------------------------------------------------------
    # Location fields
    # ---------------------------------------------------------

    _normalize_location_field(
        normalized,
        "district",
    )

    _normalize_location_field(
        normalized,
        "tehsil",
    )

    _normalize_location_field(
        normalized,
        "village",
    )

    # ---------------------------------------------------------
    # Direct location aliases
    # ---------------------------------------------------------

    location_aliases = {
        "district_english": [
            "district_english",
            "districtEnglish",
            "district_name_english",
            "district_name",
            "district_en",
        ],
        "district_hindi": [
            "district_hindi",
            "districtHindi",
            "district_name_hindi",
            "district_hi",
        ],
        "tehsil_english": [
            "tehsil_english",
            "tehsilEnglish",
            "tehsil_name_english",
            "tehsil_name",
            "tehsil_en",
        ],
        "tehsil_hindi": [
            "tehsil_hindi",
            "tehsilHindi",
            "tehsil_name_hindi",
            "tehsil_hi",
        ],
        "village_english": [
            "village_english",
            "villageEnglish",
            "village_name_english",
            "village_name",
            "village_en",
        ],
        "village_hindi": [
            "village_hindi",
            "villageHindi",
            "village_name_hindi",
            "village_hi",
        ],
    }

    for target_key, aliases in location_aliases.items():

        if normalized.get(target_key):
            continue

        value = _first_value(
            normalized,
            aliases,
        )

        if value is not None:
            normalized[target_key] = value

    # ---------------------------------------------------------
    # Khasra
    # ---------------------------------------------------------

    if not normalized.get("khasra_number"):

        value = _first_value(
            normalized,
            [
                "khasra_number",
                "khasra",
                "khasra_no",
                "khasraNo",
                "plot_number",
                "plot_no",
                "parcel_number",
            ],
        )

        if value is not None:
            normalized["khasra_number"] = value

    # ---------------------------------------------------------
    # Khata
    # ---------------------------------------------------------

    if not normalized.get("khata_number"):

        value = _first_value(
            normalized,
            [
                "khata_number",
                "khata",
                "khata_no",
                "khataNo",
                "khewat_number",
            ],
        )

        if value is not None:
            normalized["khata_number"] = value

    # ---------------------------------------------------------
    # Survey
    # ---------------------------------------------------------

    if not normalized.get("survey_number"):

        value = _first_value(
            normalized,
            [
                "survey_number",
                "survey",
                "survey_no",
                "surveyNo",
                "survey_id",
            ],
        )

        if value is not None:
            normalized["survey_number"] = value

    # ---------------------------------------------------------
    # Document type
    # ---------------------------------------------------------

    if not normalized.get("document_type"):

        value = _first_value(
            normalized,
            [
                "document_type",
                "record_type",
                "document_category",
                "type",
            ],
        )

        if value is not None:
            normalized["document_type"] = value

    # ---------------------------------------------------------
    # ROR record number
    # ---------------------------------------------------------

    if not normalized.get("record_entry_number"):

        value = _first_value(
            normalized,
            [
                "record_entry_number",
                "record_number",
                "entry_number",
                "ror_number",
                "ror_entry_number",
            ],
        )

        if value is not None:
            normalized["record_entry_number"] = value

    # ---------------------------------------------------------
    # Owner aliases
    # ---------------------------------------------------------

    if not normalized.get("owner_name_english"):

        value = _first_value(
            normalized,
            [
                "owner_name_english",
                "owner_english",
                "owner_name",
                "landowner_name",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "english",
            )

        if value is not None:
            normalized["owner_name_english"] = value

    if not normalized.get("owner_name_hindi"):

        value = _first_value(
            normalized,
            [
                "owner_name_hindi",
                "owner_hindi",
                "landowner_name_hindi",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "hindi",
            )

        if value is not None:
            normalized["owner_name_hindi"] = value

    # ---------------------------------------------------------
    # Father / husband aliases
    # ---------------------------------------------------------

    if not normalized.get(
        "father_husband_name_english"
    ):

        value = _first_value(
            normalized,
            [
                "father_husband_name_english",
                "father_name_english",
                "father_name",
                "father_husband_name",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "english",
            )

        if value is not None:
            normalized[
                "father_husband_name_english"
            ] = value

    if not normalized.get(
        "father_husband_name_hindi"
    ):

        value = _first_value(
            normalized,
            [
                "father_husband_name_hindi",
                "father_name_hindi",
                "father_husband_hindi",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "hindi",
            )

        if value is not None:
            normalized[
                "father_husband_name_hindi"
            ] = value

    # ---------------------------------------------------------
    # Nested parcel / khasra records
    # ---------------------------------------------------------
    # Some OpenRouter models naturally return cadastral data as:
    #
    #   "parcels": [{
    #       "khasra_number": "589/2",
    #       "area_hectares": 1.25,
    #       ...
    #   }]
    #
    # The application schema is intentionally flat for the primary
    # land-record row. Unwrap the FIRST parcel only when the flat field
    # is missing. Never invent or merge values that are not present.
    parcels = normalized.get("parcels")
    if isinstance(parcels, list) and parcels:
        first_parcel = parcels[0]

        if isinstance(first_parcel, dict):
            parcel_aliases = {
                "khasra_number": [
                    "khasra_number", "khasra", "khasra_no",
                    "khasraNo", "plot_number", "plot_no",
                    "parcel_number",
                ],
                "survey_number": [
                    "survey_number", "survey", "survey_no",
                    "surveyNo", "survey_id",
                ],
                "land_area_hectares": [
                    "land_area_hectares", "area_hectares",
                    "hectares", "area_ha",
                ],
                "land_area_acres": [
                    "land_area_acres", "area_acres",
                    "acres", "area_in_acres",
                ],
                "land_classification_english": [
                    "land_classification_english",
                    "classification_english",
                    "land_classification", "classification",
                ],
                "land_classification_hindi": [
                    "land_classification_hindi",
                    "classification_hindi",
                ],
                "ownership_share": [
                    "ownership_share", "share", "share_ratio",
                    "ownership_ratio",
                ],
            }

            for target_key, aliases in parcel_aliases.items():
                if normalized.get(target_key) not in (None, ""):
                    continue

                value = _first_value(first_parcel, aliases)

                if isinstance(value, dict):
                    language = (
                        "hindi"
                        if target_key.endswith("_hindi")
                        else "english"
                    )
                    value = _nested_language_value(value, language)

                if value is not None:
                    normalized[target_key] = value

    # ---------------------------------------------------------
    # Area aliases
    # ---------------------------------------------------------

    area_aliases = {
        "land_area_hectares": [
            "land_area_hectares",
            "area_hectares",
            "hectares",
            "area_ha",
        ],
        "land_area_acres": [
            "land_area_acres",
            "area_acres",
            "acres",
            "area_in_acres",
        ],
    }

    for target_key, aliases in area_aliases.items():

        if normalized.get(target_key) is not None:
            continue

        value = _first_value(
            normalized,
            aliases,
        )

        if value is not None:
            normalized[target_key] = (
                parse_numeric_area(value)
            )

    # ---------------------------------------------------------
    # Classification aliases
    # ---------------------------------------------------------

    if not normalized.get(
        "land_classification_english"
    ):

        value = _first_value(
            normalized,
            [
                "land_classification_english",
                "classification_english",
                "land_classification",
                "classification",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "english",
            )

        if value is not None:
            normalized[
                "land_classification_english"
            ] = value

    if not normalized.get(
        "land_classification_hindi"
    ):

        value = _first_value(
            normalized,
            [
                "land_classification_hindi",
                "classification_hindi",
            ],
        )

        if isinstance(value, dict):
            value = _nested_language_value(
                value,
                "hindi",
            )

        if value is not None:
            normalized[
                "land_classification_hindi"
            ] = value

    # ---------------------------------------------------------
    # Ownership share aliases
    # ---------------------------------------------------------

    if not normalized.get("ownership_share"):

        value = _first_value(
            normalized,
            [
                "ownership_share",
                "share",
                "share_ratio",
                "ownership_ratio",
            ],
        )

        if value is not None:
            normalized["ownership_share"] = value

    # ---------------------------------------------------------
    # Annual revenue aliases
    # ---------------------------------------------------------

    if not normalized.get(
        "annual_revenue_inr"
    ):

        value = _first_value(
            normalized,
            [
                "annual_revenue_inr",
                "annual_revenue",
                "land_revenue",
                "revenue",
            ],
        )

        if value is not None:
            normalized[
                "annual_revenue_inr"
            ] = value

    return normalized


# =============================================================================
# SANITIZATION
# =============================================================================

def sanitize_extracted_data(
    data: Dict[str, Any],
    raw_text: str,
) -> Dict[str, Any]:
    """
    Sanitizes extracted values while preserving source-grounded data.
    """

    import re

    date_fields = [
        "mutation_date",
        "registration_date",
        "record_date",
        "issue_date",
    ]

    for field in date_fields:

        if field not in data:
            continue

        if not data[field]:
            continue

        value = str(data[field]).strip()

        # Detect malformed ISO years.
        iso_match = re.match(
            r"^(\d{4})-(\d{2})-(\d{2})$",
            value,
        )

        if iso_match:

            year_int = int(
                iso_match.group(1)
            )

            if (
                year_int < 1900
                or year_int > 2050
            ):

                text_dates = re.findall(
                    r"\b"
                    r"(\d{1,2})"
                    r"[-/]"
                    r"([A-Za-z]{3}|\d{1,2})"
                    r"[-/]"
                    r"(\d{4})"
                    r"\b",
                    raw_text,
                )

                if text_dates:

                    matched_date = None

                    for (
                        day,
                        month,
                        year,
                    ) in text_dates:

                        if (
                            day.zfill(2)
                            == iso_match.group(3)
                        ):
                            matched_date = (
                                f"{day}-{month}-{year}"
                            )
                            break

                    if matched_date:
                        data[field] = matched_date
                    else:
                        data[field] = (
                            f"{text_dates[0][0]}-"
                            f"{text_dates[0][1]}-"
                            f"{text_dates[0][2]}"
                        )

        # Strip accidental whitespace.
        if isinstance(data[field], str):
            data[field] = data[field].strip()

    return data


# =============================================================================
# VALIDATION AGAINST TARGET SCHEMA
# =============================================================================

def validate_against_schema(
    data: Dict[str, Any],
    target_schema: Type[BaseModel],
) -> BaseModel:
    """
    Normalizes and validates AI output against the target Pydantic schema.
    """

    normalized = normalize_extracted_data(data)

    try:
        model = target_schema.model_validate(
            normalized
        )

        return model

    except Exception as exc:

        # Print normalized payload for debugging.
        print(
            "\n[AI DEBUG] Normalized extraction:\n"
            + json.dumps(
                normalized,
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr,
        )

        raise ValueError(
            "Extracted JSON is valid, but it does not "
            f"match the {target_schema.__name__} schema: "
            f"{exc}"
        ) from exc


# =============================================================================
# CORE DOCUMENT PARSER
# =============================================================================

def parse_document(
    document_source: Union[str, Path],
    schema_type: Union[
        str,
        Type[BaseModel],
        DocumentCategory,
        None,
    ] = "auto",
    llm: Optional[ChatOpenAI] = None,
) -> Tuple[
    BaseModel,
    DocumentCategory,
    str,
]:
    """
    Parses a land document using OpenRouter and validates the
    result using the appropriate Pydantic schema.
    """

    # ---------------------------------------------------------
    # 1. Load document
    # ---------------------------------------------------------

    raw_text, doc_stem = load_document_text(
        document_source
    )

    if not raw_text:
        raise ValueError(
            "No text could be extracted from "
            f"document source: {document_source}"
        )

    # ---------------------------------------------------------
    # 2. Resolve schema
    # ---------------------------------------------------------

    target_schema, category = resolve_schema(
        schema_type,
        raw_text=raw_text,
        filename=doc_stem,
    )

    # ---------------------------------------------------------
    # 3. LLM
    # ---------------------------------------------------------

    if llm is None:
        llm = get_llm()

    # ---------------------------------------------------------
    # 4. Generate schema field description
    # ---------------------------------------------------------

    try:
        schema_json = target_schema.model_json_schema()

        schema_text = json.dumps(
            schema_json,
            ensure_ascii=False,
            indent=2,
        )

    except Exception:
        schema_text = "{}"

    # ---------------------------------------------------------
    # 5. Build plain prompt
    #
    # IMPORTANT:
    # We intentionally DO NOT use ChatPromptTemplate here.
    # This avoids LangChain interpreting JSON braces as variables.
    # ---------------------------------------------------------

    prompt = f"""
{PARSER_SYSTEM_PROMPT}

TARGET DOCUMENT CATEGORY:
{category.value}

TARGET PYDANTIC SCHEMA:
{schema_text}

DOCUMENT TEXT:
-------------------------
{raw_text}
-------------------------

Now extract the document.

Return exactly one JSON object.

Do not include Markdown.
Do not include ```json.
Do not include explanations.
Do not include safety messages.
Do not include "User Safety".

Use exact schema field names whenever possible.

If the model internally represents a location as:
district -> english/hindi
tehsil -> english/hindi
village -> english/hindi

the final response MUST still use:
district_english
district_hindi
tehsil_english
tehsil_hindi
village_english
village_hindi

For missing information use null.

For cadastral records containing multiple parcel/plot entries, preserve
the parcel array if useful, but ALSO populate the flat primary fields
required by the target schema from the relevant parcel entry:
"khasra_number", "land_area_hectares", "land_area_acres",
"land_classification_english", "land_classification_hindi",
"ownership_share", and "survey_number" when present.

Do not create values that are not present in the document.

Return JSON only.
"""

    # ---------------------------------------------------------
    # 6. Call OpenRouter
    # ---------------------------------------------------------

    try:

        response = llm.invoke(prompt)

    except Exception as exc:

        raise RuntimeError(
            "OpenRouter extraction request failed: "
            f"{exc}"
        ) from exc

    # ---------------------------------------------------------
    # 7. Extract JSON
    # ---------------------------------------------------------

    try:

        extracted_dict = (
            extract_json_from_llm_response(
                response
            )
        )

    except Exception as exc:

        raise ValueError(
            "OpenRouter returned unprocessable "
            f"content: {exc}"
        ) from exc

    # ---------------------------------------------------------
    # 8. Normalize aliases / nested fields
    # ---------------------------------------------------------

    extracted_dict = normalize_extracted_data(
        extracted_dict
    )

    # ---------------------------------------------------------
    # 9. Sanitize
    # ---------------------------------------------------------

    extracted_dict = sanitize_extracted_data(
        extracted_dict,
        raw_text,
    )

    # ---------------------------------------------------------
    # 10. Validate with Pydantic
    # ---------------------------------------------------------

    extracted_model = validate_against_schema(
        extracted_dict,
        target_schema,
    )

    return (
        extracted_model,
        category,
        doc_stem,
    )


# =============================================================================
# SAVE PARSED RESULT
# =============================================================================

def parse_and_save(
    document_source: Union[str, Path],
    output_dir: Union[str, Path] = (
        "ai-service/trial_op_data"
    ),
    schema_type: Union[
        str,
        Type[BaseModel],
        DocumentCategory,
        None,
    ] = "auto",
    llm: Optional[ChatOpenAI] = None,
    custom_filename: Optional[str] = None,
) -> Tuple[BaseModel, Path]:
    """
    Parses a document and saves the extracted JSON.
    """

    model, category, doc_stem = parse_document(
        document_source=document_source,
        schema_type=schema_type,
        llm=llm,
    )

    # Resolve output directory
    out_path = Path(output_dir)

    if not out_path.is_absolute():

        project_candidate = (
            PROJECT_ROOT / out_path
        )

        ai_candidate = (
            AI_SERVICE_DIR / out_path
        )

        if project_candidate.parent.exists():
            out_path = project_candidate

        elif ai_candidate.parent.exists():
            out_path = ai_candidate

        else:
            out_path = (
                AI_SERVICE_DIR
                / "trial_op_data"
            )

    out_path.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        custom_filename
        or f"{doc_stem}_op.json"
    )

    target_file = out_path / filename

    data_dict = model.model_dump(
        mode="json"
    )

    json_content = json.dumps(
        data_dict,
        ensure_ascii=False,
        indent=2,
    )

    with open(
        target_file,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(json_content)

    print(
        f"[{category.value}] "
        f"Successfully parsed and saved to: "
        f"{target_file}"
    )

    return model, target_file


# =============================================================================
# BATCH PARSING
# =============================================================================

def batch_parse(
    input_dir: Union[str, Path] = (
        "sample-data/documents"
    ),
    output_dir: Union[str, Path] = (
        "ai-service/trial_op_data"
    ),
    schema_type: Union[
        str,
        Type[BaseModel],
        DocumentCategory,
        None,
    ] = "auto",
    llm: Optional[ChatOpenAI] = None,
) -> List[Tuple[BaseModel, Path]]:
    """
    Parses all PDF/TXT documents in a directory.
    """

    in_path = Path(input_dir)

    if not in_path.is_absolute():
        in_path = PROJECT_ROOT / in_path

    if not in_path.is_dir():
        raise FileNotFoundError(
            f"Input directory not found: {in_path}"
        )

    files = sorted(
        list(in_path.glob("**/*.pdf"))
        + list(in_path.glob("**/*.txt"))
    )

    results: List[
        Tuple[BaseModel, Path]
    ] = []

    print(
        f"Found {len(files)} documents "
        f"to parse in {in_path}..."
    )

    for file_path in files:

        print(
            f"\nProcessing: "
            f"{file_path.name}"
        )

        try:

            model, output_file = parse_and_save(
                document_source=file_path,
                output_dir=output_dir,
                schema_type=schema_type,
                llm=llm,
            )

            results.append(
                (model, output_file)
            )

        except Exception as exc:

            print(
                f"Error parsing "
                f"{file_path.name}: {exc}",
                file=sys.stderr,
            )

    return results


# =============================================================================
# CLI
# =============================================================================

if __name__ == "__main__":

    parser_cli = argparse.ArgumentParser(
        description=(
            "Universal Indian Land Record "
            "Parser using OpenRouter and "
            "Pydantic schemas."
        )
    )

    parser_cli.add_argument(
        "--file",
        "-f",
        type=str,
        default=(
            "sample-data/documents/"
            "handwritten/"
            "HANDWRITTEN_002.pdf"
        ),
        help=(
            "Path to land document."
        ),
    )

    parser_cli.add_argument(
        "--schema",
        "-s",
        type=str,
        default="auto",
        choices=[
            "auto",
            "mutation",
            "registration",
            "handwritten",
            "ror",
            "unified",
        ],
        help=(
            "Target schema."
        ),
    )

    parser_cli.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default=(
            "ai-service/trial_op_data"
        ),
        help=(
            "Directory for extracted JSON."
        ),
    )

    parser_cli.add_argument(
        "--all",
        "-a",
        action="store_true",
        help=(
            "Parse all sample documents."
        ),
    )

    parser_cli.add_argument(
        "--input-dir",
        type=str,
        default="sample-data/documents",
        help=(
            "Input directory for batch parsing."
        ),
    )

    args = parser_cli.parse_args()

    try:

        if args.all:

            batch_parse(
                input_dir=args.input_dir,
                output_dir=args.output_dir,
                schema_type=args.schema,
                llm=llm,
            )

        else:

            model, saved_path = parse_and_save(
                document_source=args.file,
                output_dir=args.output_dir,
                schema_type=args.schema,
                llm=llm,
            )

            print(
                "\nExtracted Document Data:"
            )

            print(
                json.dumps(
                    model.model_dump(
                        mode="json"
                    ),
                    ensure_ascii=False,
                    indent=2,
                )
            )

    except Exception as exc:

        print(
            f"\nParser Error: {exc}",
            file=sys.stderr,
        )

        sys.exit(1)
