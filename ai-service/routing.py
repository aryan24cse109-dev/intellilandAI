from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from pathlib import Path
from typing import Optional
import json
import sys

# Ensure UTF-8 stdout/stderr encoding for Hindi text handling on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

app = FastAPI()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Anchors the path relative to this script's directory
CURRENT_FILE_DIR = Path(__file__).resolve().parent

# If this script is directly inside 'ai-service':
# Target: D:\intellilandAI\ai-service\trial_op_data
BASE_OP_DIR = CURRENT_FILE_DIR / "trial_op_data"
if not BASE_OP_DIR.exists():
    BASE_OP_DIR = CURRENT_FILE_DIR / "ai-service" / "trial_op_data"

# Target: D:\intellilandAI\ai-service\comparison_results
BASE_COMPARISON_DIR = CURRENT_FILE_DIR / "comparison_results"
if not BASE_COMPARISON_DIR.exists():
    BASE_COMPARISON_DIR = CURRENT_FILE_DIR / "ai-service" / "comparison_results"


def find_json_file(keyword: str, op_dir: Path | str = BASE_OP_DIR) -> str | None:
    directory = Path(op_dir).resolve()
    
    if not directory.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")

    pattern = f"*{keyword}*.json"
    matches = list(directory.rglob(pattern))
    
    return str(matches[0]) if matches else None

def return_json(filename: str):
    filepath = find_json_file(filename)
    if not filepath:
        return None
    with open(filepath, 'r', encoding='utf8') as f:
        data = f.read()
    return json.loads(data)


def find_comparison_file(keyword: str, comp_dir: Path | str = BASE_COMPARISON_DIR) -> str | None:
    """
    Finds a comparison result JSON file in comparison_results based upon file-name matching.
    Supports file stems, full filenames (.pdf, .json), and case-insensitive matching.
    """
    directory = Path(comp_dir).resolve()
    
    if not directory.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")

    target = Path(keyword).name

    # Remove extensions if present
    for ext in [".pdf", ".PDF", ".json", ".JSON"]:
        if target.endswith(ext):
            target = target[:-len(ext)]
            break

    # Strip known suffixes if passed (e.g. MUTATION_001_comparison or MUTATION_001_op)
    clean_target = target
    for suffix in ["_comparison", "_op", "_GROUND_TRUTH"]:
        if clean_target.endswith(suffix):
            clean_target = clean_target[:-len(suffix)]
            break

    # 1. Match specific pattern: *clean_target*_comparison*.json
    pattern_direct = f"*{clean_target}*_comparison*.json"
    matches = list(directory.rglob(pattern_direct))
    if matches:
        return str(matches[0])

    # 2. Match broader pattern: *clean_target*.json
    pattern = f"*{clean_target}*.json"
    matches = list(directory.rglob(pattern))
    if matches:
        return str(matches[0])

    # 3. Case-insensitive search across json files
    lower_target = clean_target.lower()
    for file in directory.rglob("*.json"):
        if lower_target in file.stem.lower():
            return str(file)

    return None


def get_comparison_data(filename: str, comp_dir: Path | str = BASE_COMPARISON_DIR):
    """
    Retrieves and parses comparison JSON data from comparison_results based upon file-name matching.
    Defined outside of the main API route definitions for modularity and reuse.
    """
    filepath = find_comparison_file(filename, comp_dir=comp_dir)
    if not filepath:
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        data = f.read()
    return json.loads(data)


def return_comparison_json(filename: str, comp_dir: Path | str = BASE_COMPARISON_DIR):
    """
    Alias for get_comparison_data, consistent with return_json naming.
    """
    return get_comparison_data(filename, comp_dir=comp_dir)


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    # Check that it's a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Create a path for the uploaded file
    file_path = UPLOAD_DIR / file.filename
    target = str(file.filename)
    target = target.removesuffix(".pdf")
    print(target)
    result_path = find_json_file(target)
    # Save the file
    if result_path:
        print(result_path)

    data = None
    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)
    if result_path:
        print(f"Found: {result_path}")
        with open(result_path, 'r', encoding='utf8') as f:
            data = f.read()
            data = json.loads(data)

    return {
        "filename": file.filename,
        "message": "PDF uploaded successfully",
        'data': data
    }


@app.post("/compare-pdf")
@app.get("/compare-pdf")
async def compare_pdf(
    request: Request,
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Query(None)
):
    """
    Endpoint to retrieve comparison results from comparison_results based upon file-name matching.
    Accepts:
      - Multipart PDF file upload (file: UploadFile)
      - Query parameter (?filename=MUTATION_001.pdf)
      - JSON body ({"filename": "MUTATION_001.pdf"})
      - Form field (filename="MUTATION_001.pdf")
    """
    target_name = None

    # Handle file upload if provided
    if file and file.filename:
        if file.content_type and file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )
        target_name = file.filename
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)
    elif filename:
        target_name = filename
    else:
        # Check JSON body if available
        try:
            body = await request.json()
            if isinstance(body, dict):
                target_name = body.get("filename") or body.get("file_name") or body.get("document_name")
        except Exception:
            pass

        # Check form data if available
        if not target_name:
            try:
                form = await request.form()
                target_name = form.get("filename") or form.get("file_name")
            except Exception:
                pass

    if not target_name:
        raise HTTPException(
            status_code=400,
            detail="A PDF file, filename query parameter, or JSON body containing 'filename' is required"
        )

    # Retrieve comparison data using the function defined outside the main API definition
    data = get_comparison_data(target_name)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Comparison result for '{target_name}' not found."
        )

    return {
        "filename": target_name,
        "message": "Comparison data retrieved successfully",
        "data": data
    }


# Example usage:
if __name__ == "__main__":
    target = "REGISTRATION_001_POOR_QUALITY.pdf"
    target_clean = target.removesuffix(".pdf")
    print(f"Target: {target_clean}")
    result_path = find_json_file(target_clean)
    
    if result_path:
        print(f"Found trial output: {result_path}")
    else:
        print("No matching trial output file found.")

    comp_path = find_comparison_file(target)
    if comp_path:
        print(f"Found comparison result: {comp_path}")
        comp_data = get_comparison_data(target)
        print(f"Comparison document_name: {comp_data.get('document_name') if comp_data else None}")
    else:
        print("No matching comparison result found.")
