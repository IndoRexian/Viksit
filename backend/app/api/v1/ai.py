import logging
import os
import tempfile
from typing import List, Optional

from core.dependencies import get_current_user
from db import schema
from db.init_db import get_db
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from schemas.ai import (
    DocumentQuizResponse,
    SkillAssessmentQuery,
    SkillAssessmentResponse,
)
from services import competencies as competency_service
from services.ai import generate_document_quiz, get_competency_quiz
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/getquiz",
    response_model=SkillAssessmentResponse,
    summary="Get assessment quiz for competency",
)
def get_assessment_quiz(
    params: SkillAssessmentQuery = Query(),
    db: Session = Depends(get_db),
    current_user: schema.User = Depends(get_current_user),
):
    try:
        return get_competency_quiz(
            params.competency,
            params.description,
            params.category,
            params.department,
            params.level,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating competency assessment quiz: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate assessment quiz. Please try again later.",
        )


@router.post(
    "/generate-document-quiz",
    response_model=DocumentQuizResponse,
    summary="Generate assessment quiz directly from uploaded learning material",
)
async def generate_quiz_from_document(
    file: UploadFile = File(...),
    num_questions: int = Form(5),
    difficulty: str = Form("mixed"),
    competency_tags: Optional[str] = Form(None),
    current_user: schema.User = Depends(get_current_user),
):
    temp_file_path = None
    try:
        filename = file.filename or "document.pdf"
        _, ext = os.path.splitext(filename)

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            temp_file_path = tmp.name
            content = await file.read()
            tmp.write(content)

        return generate_document_quiz(
            file_path=temp_file_path,
            mime_type=file.content_type,
            num_questions=num_questions,
            difficulty=difficulty,
            competency_tag_list=competency_tags,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz from document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz from document. Please ensure the document is valid and try again.",
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
