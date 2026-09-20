from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services.document_processor import process_document


router = APIRouter(
    prefix="/ai",
    tags=["AI Processing"],
)


@router.post("/process-document")
async def process_document_endpoint(
    document_id: str = Form(...),
    document_type: str | None = Form(None),
    language: str | None = Form(None),
    file: UploadFile = File(...),
):
    temp_path: Path | None = None

    try:
        # Keep the original extension so PDF/image detection continues
        # to work exactly as it does locally.
        suffix = Path(file.filename or "").suffix

        with NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:
            temp_path = Path(temp_file.name)

            while chunk := await file.read(1024 * 1024):
                temp_file.write(chunk)

        result = process_document(
            document_id=document_id,
            file_path=str(temp_path),
            document_type=document_type,
            language=language,
        )

        return {
            "success": True,
            "data": result,
        }

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    finally:
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                pass

        await file.close()