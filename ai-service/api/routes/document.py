from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.document_processor import process_document


router = APIRouter(
    prefix="/ai",
    tags=["AI Processing"],
)


class DocumentProcessRequest(BaseModel):
    document_id: str
    file_path: str
    document_type: str | None = None
    language: str | None = None


@router.post("/process-document")
def process_document_endpoint(request: DocumentProcessRequest):

    try:
        result = process_document(
            document_id=request.document_id,
            file_path=request.file_path,
            document_type=request.document_type,
            language=request.language,
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