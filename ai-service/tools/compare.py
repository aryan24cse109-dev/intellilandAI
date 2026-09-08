"""
ai-service/tools/compare.py

Comparison engine for comparing Ground Truth land records against extracted trial output data.
Uses LangChain with Google GenAI (Gemini) and Pydantic structured output parsing.

Features:
- Prioritizes land parcel area, khasra/khata numbers, and core ownership records.
- Ignores trailing zeros in area figures (e.g. '1.8500' == 1.85).
- Ignores fictional/sample placeholders (e.g. '(Fictional)', '(काल्पनिक)').
- Ignores bilingual translation expansions (e.g. 'Inheritance / वरासत (उत्तराधिकार)' vs 'Inheritance').
- Ignores cosmetic/OCR Hindi font encoding errors and minor spelling noise.
- Ignores date format variations representing the same calendar date (e.g. '22-Jul-2026' vs '2026-07-22').
- Flags genuine discrepancies (e.g. corrupted year '2226' vs '2026') as requiring human checking.
- Outputs structured Pydantic report including `human_checking_needed` and `evidence`.
- Automatically saves comparison results to JSON in the 'comparison_results' folder.
"""

import os
import sys
import json

# Ensure UTF-8 stdout/stderr encoding for Hindi text handling on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser


# Ensure parent directory (ai-service/) is in search path
CURRENT_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURRENT_DIR.parent
ROOT_DIR = PARENT_DIR.parent
if str(PARENT_DIR) not in sys.path:
    sys.path.insert(0, str(PARENT_DIR))

# Default paths for comparison files and output results
DEFAULT_RESULTS_DIR = PARENT_DIR / "comparison_results"
DEFAULT_GT_DIR = ROOT_DIR / "sample-data" / "ground-truth"
DEFAULT_TRIAL_DIR = PARENT_DIR / "trial_op_data"


# =============================================================================
# Pydantic Schemas for Comparison Output
# =============================================================================

class MatchStatus(str, Enum):
    """Status classification for individual field comparisons."""
    MATCH = "match"
    MISMATCH = "mismatch"
    PARTIAL_MATCH = "partial_match"
    IGNORED_VARIATION = "ignored_variation"
    NOT_FOUND = "not_found"


class FieldComparison(BaseModel):
    """Detailed comparison for a single field."""
    field_name: str = Field(
        description="Attribute name being compared, e.g. 'land_area_hectares', 'mutation_date'"
    )
    ground_truth_value: Optional[Any] = Field(
        default=None,
        description="Reference ground truth value"
    )
    extracted_value: Optional[Any] = Field(
        default=None,
        description="Extracted AI value from trial_op_data"
    )
    match_status: MatchStatus = Field(
        description="Category of match: match, mismatch, partial_match, ignored_variation, not_found"
    )
    is_match: bool = Field(
        description="True if values match or differences are negligible/ignorable (e.g. trailing zeros, date format, minor Hindi OCR noise)"
    )
    explanation: Optional[str] = Field(
        default=None,
        description="Explanation of comparison rationale or reason for mismatch/ignoring"
    )


class ComparisonResult(BaseModel):
    """
    Comprehensive structured comparison report between ground truth and extracted data.
    """
    document_name: Optional[str] = Field(
        default=None,
        description="Document identifier or filename (e.g. 'MUTATION_001')"
    )
    overall_match: bool = Field(
        description="True if all critical fields match satisfactorily without unresolved legal/area conflicts"
    )
    overall_similarity_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Overall concordance score between 0.0 (total mismatch) and 1.0 (exact match)"
    )
    human_checking_needed: bool = Field(
        description="Flag set to True if critical discrepancies or anomalies require manual revenue officer verification"
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Detailed bullet points of evidence, critical mismatches, or anomalies explaining why human checking is required"
    )
    critical_mismatches: List[str] = Field(
        default_factory=list,
        description="List of field names with critical, non-ignorable discrepancies"
    )
    ignored_discrepancies: List[str] = Field(
        default_factory=list,
        description="List of differences detected but safely ignored (e.g. trailing zeros, date formatting, Hindi OCR font artifacts)"
    )
    summary: str = Field(
        description="Executive summary of the comparison evaluation"
    )
    field_comparisons: List[FieldComparison] = Field(
        default_factory=list,
        description="Field-by-field comparison breakdown"
    )


# =============================================================================
# LLM & Prompt Configuration
# =============================================================================

def get_comparison_llm(
    model: str = "gemini-2.5-flash",
    project: str = "ai-api-2335",
    location: str = "us-central1",
    temperature: float = 0.0,
) -> ChatGoogleGenerativeAI:
    """
    Initializes and returns the ChatGoogleGenerativeAI LLM instance.
    """
    return ChatGoogleGenerativeAI(
        model=model,
        vertexai=True,
        project=project,
        location=location,
        temperature=temperature,
    )


COMPARISON_SYSTEM_PROMPT = """You are an expert revenue officer and land record verification auditor.
Your task is to perform an in-depth comparison between the authoritative Ground Truth data and the AI-extracted trial output data (`trial_op_data`).

Strictly follow these verification rules:

1. **Land Area Verification (Highest Priority)**:
   - Give top priority to parcel land area fields (`land_area_hectares`, `land_area_acres`, `land_area_bigha`).
   - If trailing zeros exist in the area string or float (e.g., ground truth "1.8500" vs extracted 1.85), but numerically they represent the EXACT same land area, mark them as a MATCH (`is_match: true`, `match_status: "match"`). Do NOT treat trailing zeros as a discrepancy.
   - Record trailing zero equivalences in `ignored_discrepancies`.

2. **Fictional / Sample Annotations & Placeholders (Not a Mismatch)**:
   - Qualifiers or parenthetical tags such as '(Fictional)', '(काल्पनिक)', '(Sample)', or '(Dummy)' in administrative names (e.g. `district_english`, `district_hindi`, `village_english`, `village_hindi`, `tehsil_english`, `tehsil_hindi`) are synthetic sample-data markers and are NOT substantive differences.
   - The identifier '(Fictional)' or '(काल्पनिक)' is NOT important and does NOT make the field a mismatch.
   - Ground Truth 'Surajpur (Fictional)' vs Extracted 'Surajpur' (and same in Hindi: 'सूरजपुर (काल्पनिक)' vs 'सूरजपुर' or 'सूरजपुर (काल्पɟनिक)') MUST be treated as a MATCH (`is_match: true`, `match_status: "match"` or `"ignored_variation"`).
   - The absence of '(Fictional)' / '(काल्पनिक)' does NOT indicate a loss of information and does NOT make the district or location a mismatch.
   - Record in `ignored_discrepancies` and do NOT treat as a critical mismatch or flag for human checking.

3. **Bilingual Translations & Expanded Legal Terms (e.g. `mutation_type`)**:
   - Fields representing legal transaction categories or record types (e.g. `mutation_type`, `relation_reason`, `document_type`) often contain bilingual pairings, Hindi translations, or explanatory parentheticals in Ground Truth (e.g. 'Inheritance / वरासत (उत्तराधिकार)', 'उत्तराधिकार (पुत्र) / विधिक वारिस', 'Inheritance (Son) / Legal Heir').
   - If the extracted data contains the core concept or English/Hindi term (e.g. Extracted 'Inheritance' vs Ground Truth 'Inheritance / वरासत (उत्तराधिकार)'), both represent the EXACT same legal classification.
   - The omission or inclusion of the bilingual translation / Hindi counterpart is NOT a discrepancy, does NOT represent a loss of information, and does NOT make `mutation_type` a mismatch.
   - You MUST mark such comparisons as a MATCH (`is_match: true`, `match_status: "match"` or `"ignored_variation"`).
   - Record in `ignored_discrepancies` and do NOT treat as a critical mismatch or flag for human checking.

4. **Hindi OCR & Orthographic Noise (Ignore Minor Font Errors)**:
   - Indian land records scanned through OCR often exhibit Unicode font glitches, broken matras, or minor typographical variations (e.g. 'सूरजपुर (काल्पɟनिक)' vs 'सूरजपुर (काल्पनिक)', 'स्व. रामप्रसाद शमार्ता' vs 'स्व. रामप्रसाद शर्मा', 'वाɝरस' vs 'वारिस').
   - Minor phonetic transliteration differences in English names (e.g. 'Suresh Kumaar' vs 'Suresh Kumar') where the corresponding Hindi name and entity match are also ignorable variations.
   - If the phonetic, semantic, or entity identity is clearly the same, mark as `is_match: true` or `match_status: "ignored_variation"`. Do NOT flag as a mismatch.
   - Record minor Hindi character artifacts or transliteration variations in `ignored_discrepancies`.

5. **Date Formats (Ignore Representation Differences)**:
   - If the date refers to the same calendar date despite formatting differences (e.g. "22-Jul-2026" vs "2026-07-22" or "22/07/2026"), mark as a MATCH (`is_match: true`, `match_status: "match"`).
   - CRITICAL EXCEPTION: If the calendar year, month, or day itself is wrong (e.g. extracted "2226-07-22" has year 2226 instead of 2026), this is a genuine mismatch that MUST be flagged!

6. **Document Type / Title Headers**:
   - Minor header phrasing differences (e.g., 'Land Mutation Register Entry / Namantaran Aadesh (नामांतरण आदेश)' vs 'LAND MUTATION REGISTER / ORDER ENTRY') should be treated as partial/acceptable matches unless the fundamental document type differs.

7. **Human Checking Needed & Evidence**:
   - Set `human_checking_needed: true` ONLY if there are genuine, substantive discrepancies:
     * Critical mismatch in parcel identifiers (khasra number, khata number, mutation number, survey number).
     * Actual numerical difference in land area.
     * Corrupted date/year (e.g. year 2226 vs 2026).
     * Substantively conflicting owner/buyer/seller names or entities (beyond minor spelling/transliteration differences).
   - Do NOT set `human_checking_needed: true` for:
     * Omission or presence of '(Fictional)' or '(काल्पनिक)' in district/village/tehsil names.
     * Omission or presence of bilingual Hindi translations in `mutation_type` (e.g. 'Inheritance / वरासत (उत्तराधिकार)' vs 'Inheritance').
     * Trailing zeros in area figures (e.g. '1.8500' vs 1.85).
     * Standard date format variations (e.g. '22-Jul-2026' vs '2026-07-22').
     * Minor OCR font noise or broken Unicode matras.
   - For every genuine discrepancy requiring human checking, provide clear, bulleted proof in the `evidence` field detailing the exact field, the ground truth value, the extracted value, and why it is problematic.
   - If all fields match or only have ignorable differences (trailing zeros, fictional annotations, bilingual translations, Hindi OCR font glitches, standard date formats), set `human_checking_needed: false` with empty/minimal evidence.
"""

COMPARISON_PROMPT_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", COMPARISON_SYSTEM_PROMPT),
    ("human", """Compare the following Ground Truth reference data with the AI-extracted trial output data.

Document Identifier: {document_name}

=== GROUND TRUTH DATA ===
{ground_truth_json}

=== EXTRACTED DATA (trial_op_data) ===
{extracted_json}
"""),
])


# =============================================================================
# Helper & Save Functions
# =============================================================================

def get_default_comparison_filename(doc_name: Optional[str] = None) -> str:
    """
    Generates a clean, standardized filename for comparison results JSON.
    Example: 'MUTATION_001' -> 'MUTATION_001_comparison.json'
    """
    if not doc_name or not str(doc_name).strip() or str(doc_name).strip() == "UNSPECIFIED":
        return "comparison_result.json"

    base = Path(str(doc_name).strip()).stem
    base = base.replace("_GROUND_TRUTH", "").replace("_op", "")

    safe_base = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in base).strip("_")
    if not safe_base:
        return "comparison_result.json"

    if safe_base.endswith("_comparison") or safe_base.endswith("_comparison_result"):
        return f"{safe_base}.json"

    return f"{safe_base}_comparison.json"


def save_comparison_result(
    result: Union[ComparisonResult, Dict[str, Any]],
    output_dir: Optional[Union[str, Path]] = None,
    filename: Optional[str] = None,
) -> Path:
    """
    Saves a comparison report (ComparisonResult model or dict) as a formatted JSON file
    in the comparison_results folder.

    Args:
        result: ComparisonResult model instance or dictionary to save.
        output_dir: Target directory path. Defaults to ai-service/comparison_results.
        filename: Optional custom filename. If not provided, an appropriate
                  name like '{document_name}_comparison.json' is generated.

    Returns:
        Path: Path to the saved JSON file.
    """
    target_dir = Path(output_dir) if output_dir else DEFAULT_RESULTS_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    if isinstance(result, BaseModel):
        result_data = result.model_dump(mode="json")
        doc_name = getattr(result, "document_name", None)
    elif isinstance(result, dict):
        result_data = result
        doc_name = result.get("document_name")
    else:
        raise TypeError(f"Expected ComparisonResult or dict, got {type(result).__name__}")

    if filename:
        target_filename = filename if filename.lower().endswith(".json") else f"{filename}.json"
    else:
        target_filename = get_default_comparison_filename(doc_name)

    output_path = (target_dir / target_filename).resolve()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    return output_path


# =============================================================================
# Comparison Functions
# =============================================================================

def compare_data(
    ground_truth_data: Union[Dict[str, Any], str],
    extracted_data: Union[Dict[str, Any], str],
    document_name: Optional[str] = None,
    llm: Optional[ChatGoogleGenerativeAI] = None,
    save_result: bool = False,
    output_dir: Optional[Union[str, Path]] = None,
    filename: Optional[str] = None,
) -> ComparisonResult:
    """
    Compares Ground Truth data dictionary against AI-extracted trial output data.

    Args:
        ground_truth_data: Reference ground truth dictionary or JSON string.
        extracted_data: Extracted AI trial data dictionary or JSON string.
        document_name: Optional name/ID of document being audited (e.g. 'MUTATION_001').
        llm: Optional ChatGoogleGenerativeAI instance. If None, default Gemini instance is created.
        save_result: If True, saves comparison result to JSON in comparison_results directory.
        output_dir: Directory to save the result. Defaults to ai-service/comparison_results.
        filename: Optional custom filename for the saved JSON file.

    Returns:
        ComparisonResult: Pydantic model containing verification analysis,
                          `human_checking_needed`, `evidence`, and field-by-field differences.
    """
    # Normalize inputs to JSON strings
    if isinstance(ground_truth_data, dict):
        gt_json_str = json.dumps(ground_truth_data, ensure_ascii=False, indent=2)
    else:
        gt_json_str = str(ground_truth_data).strip()

    if isinstance(extracted_data, dict):
        op_json_str = json.dumps(extracted_data, ensure_ascii=False, indent=2)
    else:
        op_json_str = str(extracted_data).strip()

    # Initialize LLM if not provided
    if llm is None:
        llm = get_comparison_llm()

    # Create structured output chain with Pydantic model
    structured_chain = COMPARISON_PROMPT_TEMPLATE | llm.with_structured_output(ComparisonResult)

    # Invoke LLM
    result: ComparisonResult = structured_chain.invoke({
        "document_name": document_name or "UNSPECIFIED",
        "ground_truth_json": gt_json_str,
        "extracted_json": op_json_str,
    })

    if document_name and not result.document_name:
        result.document_name = document_name

    if save_result:
        saved_file = save_comparison_result(
            result=result,
            output_dir=output_dir,
            filename=filename,
        )
        print(f"Saved Comparison Result: {saved_file}")

    return result


def compare_files(
    ground_truth_path: Union[str, Path],
    trial_output_path: Union[str, Path],
    llm: Optional[ChatGoogleGenerativeAI] = None,
    save_result: bool = True,
    output_dir: Optional[Union[str, Path]] = None,
    filename: Optional[str] = None,
) -> ComparisonResult:
    """
    Compares a ground truth JSON file against an extracted trial output JSON file.

    Args:
        ground_truth_path: Filepath to ground truth JSON file.
        trial_output_path: Filepath to trial output JSON file in trial_op_data.
        llm: Optional ChatGoogleGenerativeAI instance.
        save_result: Whether to automatically save comparison result to comparison_results JSON file (default: True).
        output_dir: Directory to save the result. Defaults to ai-service/comparison_results.
        filename: Optional custom filename for the saved JSON file.

    Returns:
        ComparisonResult: Parsed comparison report.
    """
    gt_path = Path(ground_truth_path)
    op_path = Path(trial_output_path)

    if not gt_path.is_file():
        raise FileNotFoundError(f"Ground truth file not found: {gt_path}")
    if not op_path.is_file():
        raise FileNotFoundError(f"Trial output file not found: {op_path}")

    with open(gt_path, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    with open(op_path, "r", encoding="utf-8") as f:
        op_data = json.load(f)

    doc_name = op_path.stem.replace("_op", "").replace("_GROUND_TRUTH", "")

    result = compare_data(
        ground_truth_data=gt_data,
        extracted_data=op_data,
        document_name=doc_name,
        llm=llm,
        save_result=False,
    )

    if save_result:
        saved_file = save_comparison_result(
            result=result,
            output_dir=output_dir,
            filename=filename,
        )
        print(f"Saved Comparison Result: {saved_file}")

    return result


def compare_ground_truth_and_trial(
    doc_name: str = "MUTATION_001",
    ground_truth_dir: Optional[Union[str, Path]] = None,
    trial_op_dir: Optional[Union[str, Path]] = None,
    llm: Optional[ChatGoogleGenerativeAI] = None,
    save_result: bool = True,
    output_dir: Optional[Union[str, Path]] = None,
    filename: Optional[str] = None,
) -> ComparisonResult:
    """
    Locates matching ground truth and trial output files for a document code,
    then executes the comparison and saves the report to JSON.

    Args:
        doc_name: Document identifier (e.g. 'MUTATION_001', 'REGISTRATION_001', 'ROR_001').
        ground_truth_dir: Root directory containing ground truth JSON files.
        trial_op_dir: Directory containing extracted trial output JSON files.
        llm: Optional ChatGoogleGenerativeAI instance.
        save_result: Whether to automatically save comparison result to comparison_results JSON file (default: True).
        output_dir: Directory to save the result. Defaults to ai-service/comparison_results.
        filename: Optional custom filename for the saved JSON file.

    Returns:
        ComparisonResult: Parsed comparison report.
    """
    # Resolve ground truth directory path
    if ground_truth_dir is not None:
        gt_dir = Path(ground_truth_dir)
        if not gt_dir.is_dir() and (ROOT_DIR / ground_truth_dir).is_dir():
            gt_dir = ROOT_DIR / ground_truth_dir
    else:
        gt_dir = DEFAULT_GT_DIR

    # Resolve trial output directory path
    if trial_op_dir is not None:
        op_dir = Path(trial_op_dir)
        if not op_dir.is_dir() and (PARENT_DIR / trial_op_dir).is_dir():
            op_dir = PARENT_DIR / trial_op_dir
        elif not op_dir.is_dir() and (ROOT_DIR / trial_op_dir).is_dir():
            op_dir = ROOT_DIR / trial_op_dir
    else:
        op_dir = DEFAULT_TRIAL_DIR

    # Search for matching ground truth file
    gt_matches = list(gt_dir.glob(f"**/{doc_name}*GROUND_TRUTH*.json"))
    if not gt_matches:
        # Fallback to general pattern
        gt_matches = list(gt_dir.glob(f"**/{doc_name}*.json"))

    if not gt_matches:
        raise FileNotFoundError(
            f"No ground truth JSON found for '{doc_name}' in '{gt_dir}'"
        )
    gt_file = gt_matches[0]

    # Search for matching trial output file
    op_matches = list(op_dir.glob(f"*{doc_name}*.json"))
    if not op_matches:
        raise FileNotFoundError(
            f"No trial output JSON found for '{doc_name}' in '{op_dir}'"
        )
    op_file = op_matches[0]

    print(f"Comparing:")
    print(f"  Ground Truth: {gt_file}")
    print(f"  Trial Output: {op_file}")

    return compare_files(
        ground_truth_path=gt_file,
        trial_output_path=op_file,
        llm=llm,
        save_result=save_result,
        output_dir=output_dir,
        filename=filename,
    )


# =============================================================================
# CLI / Quick Test Execution
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser_cli = argparse.ArgumentParser(
        description="Compare ground truth land records with AI trial output."
    )
    parser_cli.add_argument(
        "--doc",
        type=str,
        default="MUTATION_001",
        help="Document ID to compare (default: MUTATION_001)",
    )
    parser_cli.add_argument(
        "--gt-dir",
        type=str,
        default=str(DEFAULT_GT_DIR),
        help=f"Path to ground truth directory (default: {DEFAULT_GT_DIR})",
    )
    parser_cli.add_argument(
        "--op-dir",
        type=str,
        default=str(DEFAULT_TRIAL_DIR),
        help=f"Path to trial_op_data directory (default: {DEFAULT_TRIAL_DIR})",
    )
    parser_cli.add_argument(
        "--output-dir",
        type=str,
        default=str(DEFAULT_RESULTS_DIR),
        help=f"Directory to save comparison result JSON (default: {DEFAULT_RESULTS_DIR})",
    )
    parser_cli.add_argument(
        "--output-file",
        type=str,
        default=None,
        help="Custom filename for comparison result JSON (default: {doc_name}_comparison.json)",
    )
    parser_cli.add_argument(
        "--no-save",
        action="store_true",
        default=False,
        help="Disable saving comparison results to JSON",
    )

    args = parser_cli.parse_args()

    try:
        report = compare_ground_truth_and_trial(
            doc_name=args.doc,
            ground_truth_dir=args.gt_dir,
            trial_op_dir=args.op_dir,
            save_result=not args.no_save,
            output_dir=args.output_dir,
            filename=args.output_file,
        )

        print("\n" + "=" * 60)
        print(f"COMPARISON REPORT: {report.document_name}")
        print("=" * 60)
        print(f"Overall Match:            {'YES' if report.overall_match else 'NO'}")
        print(f"Similarity Score:         {report.overall_similarity_score:.2%}")
        print(f"Human Checking Needed:    {'YES [!] ' if report.human_checking_needed else 'NO'}")
        print(f"Summary:                  {report.summary}")

        if report.evidence:
            print("\nEvidence / Discrepancies Requiring Review:")
            for item in report.evidence:
                print(f"  * {item}")

        if report.ignored_discrepancies:
            print("\nIgnored Discrepancies (Area Trailing Zeros, Date Formats, Hindi OCR Noise):")
            for item in report.ignored_discrepancies:
                print(f"  - {item}")

        if report.critical_mismatches:
            print("\nCritical Mismatches:")
            for field in report.critical_mismatches:
                print(f"  ! {field}")

        print("\nField Breakdown:")
        for fc in report.field_comparisons:
            status_symbol = "[OK]" if fc.is_match else "[MISMATCH]"
            print(f"  {status_symbol:<10} {fc.field_name}:")
            print(f"             Ground Truth : {fc.ground_truth_value}")
            print(f"             Extracted    : {fc.extracted_value}")
            if fc.explanation:
                print(f"             Note         : {fc.explanation}")

    except Exception as err:
        print(f"\nError running comparison: {err}", file=sys.stderr)
        raise err

    
