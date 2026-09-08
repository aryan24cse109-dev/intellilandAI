"""
ai-service/tools/parser.py

Universal Land Record Extraction Engine for Indian Revenue Documents:
- Land Mutation Register / Orders (Namantaran Aadesh / नामांतरण आदेश)
- Property Registration Sale Deeds (Sub-Registrar / संपत्ति विक्रय विलेख)
- Record of Rights / Khatauni / Jamabandi (अधिकार अभिलेख / खतौनी)
- Legacy Handwritten Revenue Records (पुरातन राजस्व रजिस्टर प्रविष्टि)
- Unified Land Records (Cross-document general extraction)

Uses the Gemini Developer API (`gemini-2.5-flash`) with LangChain
and structured Pydantic schema enforcement from `schema.py`.
Stores extracted results in `trial_op_data/` with UTF-8 encoding.
"""

import os
from dotenv import load_dotenv
import sys
import json
import argparse
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Type, Union

# Ensure UTF-8 stdout/stderr encoding for Hindi text handling on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.prompts import ChatPromptTemplate

# Ensure parent directory (ai-service/) is in search path
CURRENT_DIR = Path(__file__).resolve().parent
AI_SERVICE_DIR = CURRENT_DIR.parent
PROJECT_ROOT = AI_SERVICE_DIR.parent

if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

    # Load environment variables from ai-service/.env
ENV_FILE = AI_SERVICE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

from schema import (
    BaseLandRecordSchema,
    MutationDocumentSchema,
    HandwrittenDocumentSchema,
    RegistrationDocumentSchema,
    RORDocumentSchema,
    UnifiedLandRecordSchema,
    DocumentCategory,
    detect_document_category,
    parse_land_document,
    parse_numeric_area,
)


# =============================================================================
# Schema Registry and Mappings
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
# LLM Initialization
# =============================================================================

def get_llm(
    model: str = "openrouter/free",
    temperature: float = 0.0,
) -> ChatOpenAI:

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OpenRouter API key is not configured. "
            "Set OPENROUTER_API_KEY in ai-service/.env."
        )

    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "IntelliLandAI",
        },
    )

# Default module-level LLM instance for drop-in compatibility
llm = get_llm()


# =============================================================================
# Extraction System Prompts
# =============================================================================

PARSER_SYSTEM_PROMPT = """You are an expert Indian land records and revenue documentation extraction engine (Bhulekh / Jamabandi / RoR / Sub-Registrar / Namantaran).
Your mission is to parse unstructured text, OCR transcriptions, or typed Indian land records and extract high-fidelity structured entities strictly matching the target schema.

Follow these strict operational guidelines:

1. **Groundedness & Zero Hallucination**:
   - Extract ONLY information explicitly present in the document.
   - If an attribute (such as a Hindi name, order reference, or witness) is not mentioned or illegible in the text, set it to null / None.
   - Do NOT extrapolate, invent, or assume details not grounded in the source text.

2. **Dates & Calendar Years (CRITICAL)**:
   - Extract dates accurately (e.g. '22-Jul-2026', '14-Aug-2026', '15-Oct-1984', '12-May-2026').
   - Return the EXACT textual date string as written in the record (e.g. '22-Jul-2026', '14-Aug-2026') or standard ISO format 'YYYY-MM-DD'.
   - NEVER corrupt the calendar year (for instance, do NOT merge day '22' and year '2026' into '2226'; do NOT turn '14' and '2026' into '1414-08-20'; do NOT turn '1984' into '19884'). Double-check that the year is strictly accurate to the document.

3. **Cadastral Numbers & Legal Identifiers**:
   - Extract parcel numbers faithfully: Khasra number (e.g. '741/3', '589/2'), Khata number (e.g. '96/B', '142/A'), Survey number (e.g. 'SV-402'). Preserve slashes and sub-parcel notations.
   - Extract official registration, mutation, or entry numbers (e.g. 'MUT-2026-88319', 'REG-2026-004812', 'LEGACY-1984/8892', 'ROR-2026-90812', 'REV-ORD/2026/0914').

4. **Land Area & Measurement Units**:
   - Extract metric area in hectares (`land_area_hectares`) as a floating-point number (e.g. 1.85, 1.25). Strip unit labels like 'Ha', 'hectares'.
   - Extract acre area (`land_area_acres`) as a floating-point number (e.g. 4.571, 3.088).
   - Extract traditional vernacular area (`land_area_bigha`) as the exact string representation (e.g. '2 बीघा 4 बिस्वा').

5. **Bilingual Fidelity (English and Devanagari Hindi)**:
   - Indian land records commonly contain bilingual or Devanagari Hindi entries.
   - For schemas with separate English and Hindi fields (Mutation, Handwritten, RoR):
     Extract English text into English fields (`village_english`, `tehsil_english`, `district_english`, `owner_name_english`, etc.) and Devanagari Hindi into Hindi fields (`village_hindi`, `tehsil_hindi`, `district_hindi`, `owner_name_hindi`, etc.).
   - If a standardized revenue term (such as land classification like 'कृषि भूमि (नहरी)' or 'कृषि भूमि (सिंचित / दोफसली)') appears only in Hindi, provide the corresponding standard English classification in `land_classification_english` (e.g. 'Agricultural Land (Canal Irrigated)' or 'Agricultural Land (Irrigated / Double-cropped)') along with the Hindi in `land_classification_hindi`.
   - For Property Registration Sale Deeds (where fields like seller_name, buyer_name are combined):
     Include both English and Hindi names in bilingual format as present in the document, e.g. 'Ramesh Chandra Verma (रमेश चंद्र वर्मा)'.
   - If Hindi OCR contains minor font artifact noise (e.g. broken matras or glyph substitutions like 'काल्पɟनिक', 'वाɝरस', 'शमार्ष'), reconstruct or transcribe the clean Devanagari word ('काल्पनिक', 'वारिस', 'शर्मा') if clearly identifiable. If uncertain, transcribe as close to original as possible.

6. **Parties, Roles & Relations**:
   - Differentiate clearly between:
     * Previous owner / Transferor (पूर्व भू-स्वामी / मूल खातेदार / विक्रेता / seller)
     * New owner / Transferee / Heir (नवीन भू-स्वामी / आवेदक / क्रेता / buyer / वारिस)
     * Primary landholder / Khatadar (खातेदार / स्वामी)
     * Father / Husband / Spouse names (पिता / पति का नाम).
   - In bilingual tables (such as Mutation records showing both English and Hindi lines for names), be sure to extract the English line into `previous_owner_english` and `new_owner_english`, and the Devanagari line into `previous_owner_hindi` and `new_owner_hindi`.
   - Capture transaction values (consideration value, stamp duty, annual revenue) and legal remarks accurately.
"""

PARSER_HUMAN_PROMPT = """Extract the structured land record information matching the schema from the following document text.
Ensure all parcel numbers, areas, dates, and bilingual names are extracted faithfully:

=== DOCUMENT TEXT ===
{raw_text}
"""


# =============================================================================
# Extraction Sanitization Helper
# =============================================================================

def sanitize_extracted_data(data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    """
    Sanitizes extracted land record data dictionary:
    - Fixes corrupted date years (e.g. '2226-07-22' or '1414-08-20' caused by day-year inversions)
      by matching authentic dates in the raw source text.
    - Strips inadvertent whitespace.
    """
    import re

    date_fields = ["mutation_date", "registration_date", "record_date", "issue_date"]
    for field in date_fields:
        if field in data and data[field]:
            s_val = str(data[field]).strip()
            # Check for inverted or bogus ISO year like 1414-08-20 or 2226-07-22
            iso_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", s_val)
            if iso_match:
                year_int = int(iso_match.group(1))
                if year_int < 1900 or year_int > 2050:
                    # Look for date pattern in raw text: DD-Mon-YYYY or DD/MM/YYYY or DD-MM-YYYY
                    text_dates = re.findall(
                        r"\b(\d{1,2})[-/]([A-Za-z]{3}|\d{1,2})[-/](\d{4})\b",
                        raw_text
                    )
                    if text_dates:
                        # Match closest candidate
                        matched_date = None
                        for d_day, d_mon, d_yr in text_dates:
                            if d_day.zfill(2) == iso_match.group(3) or d_yr[-2:] == iso_match.group(3):
                                matched_date = f"{d_day}-{d_mon}-{d_yr}"
                                break
                        data[field] = matched_date or f"{text_dates[0][0]}-{text_dates[0][1]}-{text_dates[0][2]}"

    return data


# =============================================================================
# Document Loading & Preprocessing
# =============================================================================

def load_document_text(source: Union[str, Path]) -> Tuple[str, str]:
    """
    Extracts text and identifies document stem from a PDF, text file, JSON, or raw string.

    Args:
        source: Filepath (str/Path) or raw text string.

    Returns:
        Tuple[str, str]: (extracted_raw_text, document_identifier_stem)
    """
    source_path = Path(source) if isinstance(source, (str, Path)) else None
    resolved_path: Optional[Path] = None

    if source_path:
        # Check direct path, project root relative, or ai-service relative
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

        if suffix == ".pdf":
            try:
                loader = PyMuPDFLoader(str(resolved_path))
                pages = loader.load()
                raw_text = "\n\n".join(p.page_content for p in pages)
                return raw_text.strip(), doc_stem
            except Exception:
                import fitz
                doc = fitz.open(str(resolved_path))
                text_list = [page.get_text() for page in doc]
                return "\n\n".join(text_list).strip(), doc_stem

        elif suffix in (".txt", ".json", ".csv"):
            with open(resolved_path, "r", encoding="utf-8") as f:
                content = f.read()
            if suffix == ".json":
                try:
                    data = json.loads(content)
                    if isinstance(data, dict):
                        if "ocr" in data:
                            return str(data["ocr"]).strip(), doc_stem
                        if "raw_text" in data:
                            return str(data["raw_text"]).strip(), doc_stem
                except Exception:
                    pass
            return content.strip(), doc_stem

        elif suffix in (".png", ".jpg", ".jpeg", ".webp", ".tiff"):
            try:
                from main import process_image
                res = process_image(str(resolved_path))
                return str(res.get("ocr", "")).strip(), doc_stem
            except Exception as e:
                raise ValueError(f"Could not extract text from image {resolved_path}: {e}")

        else:
            with open(resolved_path, "r", encoding="utf-8") as f:
                return f.read().strip(), doc_stem

    # If not a file, treat source as raw text string directly
    raw_str = str(source).strip()
    return raw_str, "extracted_document"


# =============================================================================
# Document Classification & Schema Resolution
# =============================================================================

def detect_document_category_from_text(
    text: str,
    filename: str = "",
) -> DocumentCategory:
    """
    Detects the land record category (MUTATION, REGISTRATION, HANDWRITTEN, ROR, or UNKNOWN)
    by analyzing document headers, keyword patterns, and filename.
    """
    combined = (filename + " " + text[:1200]).lower()
    full_lower = text.lower()

    # 1. High-confidence header detection
    # Mutation (नामांतरण आदेश / Namantaran Aadesh / Mutation Register)
    if any(k in combined for k in [
        "mutation", "namantaran", "नामांतरण", "वरासत", "उत्तराधिकार", "mutation no"
    ]):
        return DocumentCategory.MUTATION

    # Sub-Registrar Office Property Sale Deed (संपत्ति विक्रय विलेख)
    if any(k in combined for k in [
        "sub-registrar", "sale deed", "विक्रय विलेख", "उप-पंजीयक", "deed registration",
        "consideration value", "stamp duty"
    ]):
        return DocumentCategory.REGISTRATION

    # Legacy Handwritten Revenue Record (पुरातन राजस्व रजिस्टर प्रविष्टि)
    if any(k in combined for k in [
        "legacy revenue", "handwritten", "पुरातन राजस्व", "पुरातन भू-अभिलेख",
        "भू-अभिलेख रजिस्टर", "bigha", "बीघा"
    ]):
        return DocumentCategory.HANDWRITTEN

    # Record of Rights / Khatauni / Jamabandi (अधिकार अभिलेख / खतौनी)
    if any(k in combined for k in [
        "record of rights", "khatauni", "खतौनी", "अधिकार अभिलेख", "jamabandi",
        "जमाबंदी", "प्रपत्र 10", "form 10"
    ]):
        return DocumentCategory.ROR

    # 2. Broader text scan fallbacks
    if "mutation" in full_lower or "नामांतरण" in full_lower:
        return DocumentCategory.MUTATION
    if "sale deed" in full_lower or "विक्रय विलेख" in full_lower or "sub-registrar" in full_lower:
        return DocumentCategory.REGISTRATION
    if "khatauni" in full_lower or "खतौनी" in full_lower or "record of rights" in full_lower:
        return DocumentCategory.ROR
    if "legacy" in full_lower or "पुरातन" in full_lower or "bigha" in full_lower or "बीघा" in full_lower:
        return DocumentCategory.HANDWRITTEN

    return DocumentCategory.UNKNOWN


def resolve_schema(
    schema_type: Union[str, Type[BaseModel], DocumentCategory, None],
    raw_text: str = "",
    filename: str = "",
) -> Tuple[Type[BaseModel], DocumentCategory]:
    """
    Resolves the target Pydantic schema model and DocumentCategory.
    If schema_type is 'auto' or None, automatically detects from text and filename.
    """
    if isinstance(schema_type, type) and issubclass(schema_type, BaseModel):
        category = DocumentCategory.UNKNOWN
        for cat, s_cls in SCHEMA_REGISTRY.items():
            if s_cls == schema_type:
                category = cat
                break
        return schema_type, category

    if isinstance(schema_type, DocumentCategory):
        return SCHEMA_REGISTRY.get(schema_type, UnifiedLandRecordSchema), schema_type

    if isinstance(schema_type, str):
        cleaned_key = schema_type.strip().lower()
        if cleaned_key in SCHEMA_ALIAS_MAP:
            target_cls = SCHEMA_ALIAS_MAP[cleaned_key]
            for cat, s_cls in SCHEMA_REGISTRY.items():
                if s_cls == target_cls:
                    return target_cls, cat
            return target_cls, DocumentCategory.UNKNOWN
        if cleaned_key != "auto":
            for cat in DocumentCategory:
                if cat.value.lower() == cleaned_key:
                    return SCHEMA_REGISTRY[cat], cat

    # Auto-detection
    detected_cat = detect_document_category_from_text(raw_text, filename)
    target_schema = SCHEMA_REGISTRY.get(detected_cat, UnifiedLandRecordSchema)
    return target_schema, detected_cat


# =============================================================================
# Core Parser Functions
# =============================================================================

def parse_document(
    document_source: Union[str, Path],
    schema_type: Union[str, Type[BaseModel], DocumentCategory, None] = "auto",
    llm: Optional[ChatGoogleGenerativeAI] = None,
) -> Tuple[BaseModel, DocumentCategory, str]:
    """
    Parses any land document (PDF, TXT, JSON, or raw string) using the Gemini LLM
    and extracts structured entities matching the appropriate schema from schema.py.

    Args:
        document_source: Filepath or raw text string of the land record document.
        schema_type: 'auto', schema name ('mutation', 'registration', 'handwritten', 'ror', 'unified'),
                     DocumentCategory enum, or Pydantic schema class.
        llm: Optional ChatGoogleGenerativeAI instance. Defaults to configured Gemini instance.

    Returns:
        Tuple[BaseModel, DocumentCategory, str]: (extracted_pydantic_model, category, doc_stem)
    """
    raw_text, doc_stem = load_document_text(document_source)
    if not raw_text:
        raise ValueError(f"No text could be extracted from document source: {document_source}")

    target_schema, category = resolve_schema(schema_type, raw_text=raw_text, filename=doc_stem)

    if llm is None:
        llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", PARSER_SYSTEM_PROMPT),
        ("human", PARSER_HUMAN_PROMPT),
    ])

    structured_chain = prompt | llm.with_structured_output(target_schema)
    extracted_model = structured_chain.invoke({"raw_text": raw_text})

    # Sanitize dates and format irregularities using raw document context
    sanitized_dict = sanitize_extracted_data(extracted_model.model_dump(), raw_text)
    try:
        extracted_model = target_schema.model_validate(sanitized_dict)
    except Exception:
        pass

    return extracted_model, category, doc_stem


def parse_and_save(
    document_source: Union[str, Path],
    output_dir: Union[str, Path] = "ai-service/trial_op_data",
    schema_type: Union[str, Type[BaseModel], DocumentCategory, None] = "auto",
    llm: Optional[ChatGoogleGenerativeAI] = None,
    custom_filename: Optional[str] = None,
) -> Tuple[BaseModel, Path]:
    """
    Parses any land document, extracts structured data according to the schema,
    and stores the resulting JSON in trial_op_data with UTF-8 encoding.

    Args:
        document_source: Path to document or raw text.
        output_dir: Directory where trial output JSON will be stored.
        schema_type: Schema selection ('auto', specific schema name, or class).
        llm: Optional ChatGoogleGenerativeAI instance.
        custom_filename: Optional explicit output file name.

    Returns:
        Tuple[BaseModel, Path]: (parsed_model, output_file_path)
    """
    model, category, doc_stem = parse_document(
        document_source=document_source,
        schema_type=schema_type,
        llm=llm,
    )

    # Resolve output directory
    out_path = Path(output_dir)
    if not out_path.is_absolute():
        if (PROJECT_ROOT / out_path).parent.exists():
            out_path = PROJECT_ROOT / out_path
        elif (AI_SERVICE_DIR / out_path).parent.exists():
            out_path = AI_SERVICE_DIR / out_path
        else:
            out_path = AI_SERVICE_DIR / "trial_op_data"

    out_path.mkdir(parents=True, exist_ok=True)

    filename = custom_filename or f"{doc_stem}_op.json"
    target_file = out_path / filename

    # Format JSON with proper indentation and UTF-8 characters
    data_dict = model.model_dump(mode="json")
    json_content = json.dumps(data_dict, ensure_ascii=False, indent=2)

    # Explicitly write with UTF-8 encoding
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(json_content)

    print(f"[{category.value}] Successfully parsed and saved to: {target_file}")
    return model, target_file


def batch_parse(
    input_dir: Union[str, Path] = "sample-data/documents",
    output_dir: Union[str, Path] = "ai-service/trial_op_data",
    schema_type: Union[str, Type[BaseModel], DocumentCategory, None] = "auto",
    llm: Optional[ChatGoogleGenerativeAI] = None,
) -> List[Tuple[BaseModel, Path]]:
    """
    Parses all land document files in the specified directory and saves outputs to trial_op_data.
    """
    in_path = Path(input_dir)
    if not in_path.is_absolute():
        in_path = PROJECT_ROOT / in_path

    if not in_path.is_dir():
        raise FileNotFoundError(f"Input directory not found: {in_path}")

    files = sorted(list(in_path.glob("**/*.pdf")) + list(in_path.glob("**/*.txt")))
    results = []

    print(f"Found {len(files)} documents to parse in {in_path}...")
    for file_path in files:
        print(f"\nProcessing: {file_path.name}")
        try:
            model, out_file = parse_and_save(
                document_source=file_path,
                output_dir=output_dir,
                schema_type=schema_type,
                llm=llm,
            )
            results.append((model, out_file))
        except Exception as e:
            print(f"Error parsing {file_path.name}: {e}", file=sys.stderr)

    return results


# =============================================================================
# CLI / Direct Execution
# =============================================================================

if __name__ == "__main__":
    parser_cli = argparse.ArgumentParser(
        description="Universal Indian Land Record Parser using Gemini LLM and Pydantic Schemas."
    )
    parser_cli.add_argument(
        "--file", "-f",
        type=str,
        default="sample-data/documents/handwritten/HANDWRITTEN_002.pdf",
        help="Path to land document (PDF, TXT, JSON) to parse (default: sample-data/documents/mutation/MUTATION_001.pdf)",
    )
    parser_cli.add_argument(
        "--schema", "-s",
        type=str,
        default="auto",
        choices=["auto", "mutation", "registration", "handwritten", "ror", "unified"],
        help="Target schema: 'auto' (default), 'mutation', 'registration', 'handwritten', 'ror', or 'unified'",
    )
    parser_cli.add_argument(
        "--output-dir", "-o",
        type=str,
        default="ai-service/trial_op_data",
        help="Directory to save trial output JSON files (default: ai-service/trial_op_data)",
    )
    parser_cli.add_argument(
        "--all", "-a",
        action="store_true",
        help="Batch parse all documents in sample-data/documents/",
    )
    parser_cli.add_argument(
        "--input-dir",
        type=str,
        default="sample-data/documents",
        help="Directory containing documents for batch parsing (used with --all)",
    )

    args = parser_cli.parse_args()

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
        print("\nExtracted Document Data:")
        print(json.dumps(model.model_dump(mode="json"), ensure_ascii=False, indent=2))
