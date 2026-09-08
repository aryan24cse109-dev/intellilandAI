from fastapi import FastAPI

from api.routes.document import router as document_router


app = FastAPI(
    title="IntelliLandAI AI Service",
    description="AI service for land record digitization and extraction",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "IntelliLandAI AI Service is running",
    }


app.include_router(document_router)