import logging
from typing import Optional

from core.config import settings
from google import genai
from google.genai import types
from schemas.ai import DocumentQuizResponse, SkillAssessmentResponse

logger = logging.getLogger(__name__)


def get_gemini_client() -> genai.Client:
    """Safely retrieves or instantiates the Gemini API Client."""
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not api_key:
        logger.error("GEMINI_API_KEY is missing from environment/config.")
        raise RuntimeError(
            "AI services are temporarily unavailable: API key not configured."
        )
    return genai.Client(api_key=api_key)


def get_skill_assessment_prompt(
    competency_name, competency_description, category, department, level
):

    skill_assessment_prompt = f"""
    You are an expert assessment designer for India's Official Statistical System, creating training evaluation questions for government officials on the iGOT Karmayogi platform.

    Your task is to generate exactly 5 multiple-choice questions (MCQs) that assess a specific competency, calibrated to the officer's role and proficiency level.

    ## COMPETENCY DETAILS
    - Competency Name: {competency_name}
    - Description: {competency_description}
    - Category: {category}  // one of: Domain / Behavioural / Functional
    - Department: {department}
    - Proficiency Level: {level}  // e.g., Foundation / Intermediate / Advanced, or L1-L4

    ## INSTRUCTIONS

    1. Generate exactly 5 MCQs that test genuine understanding of "{{competency_name}}" as it applies to a "{{department}}" official at "{{level}}" proficiency.

    2. Calibrate difficulty strictly to the stated level:
    - Foundation/L1: definitions, basic concepts, "what is X"
    - Intermediate/L2: application, "how would you use X in situation Y"
    - Advanced/L3-L4: analysis, judgment, edge cases, trade-offs, "which approach is most appropriate when..."

    3. Tailor scenarios and terminology to the "{department}" context and the competency category:
    - Domain competencies: test conceptual/technical knowledge (e.g., statistical methods, survey design)
    - Functional competencies: test job-task application (e.g., tools, processes, workflows)
    - Behavioural competencies: use short realistic workplace scenarios and ask what the official should do, not abstract theory

    4. Each question must have exactly 4 options (A, B, C, D):
    - Exactly ONE correct answer
    - Three plausible distractors that reflect common misconceptions or partial understanding — avoid options that are obviously wrong or joke answers
    - Similar length and specificity across all 4 options (don't let the correct answer stand out by being longest/most detailed)
    - No "all of the above" / "none of the above" options

    5. For each question, provide a concise explanation (2-3 sentences) of why the correct answer is right and, briefly, why the most tempting distractor is wrong.

    6. Avoid:
    - Trick questions or ambiguous wording
    - Overly obscure trivia unrelated to real job performance
    - Repeating the same sub-topic across multiple questions — cover 5 distinct aspects of the competency
    - Copying phrasing directly from the description provided above

    7. Return ONLY valid JSON. No markdown code fences, no preamble, no commentary — the response must be parseable directly by JSON.parse().

    ## OUTPUT FORMAT (strict JSON schema)

    {{
    "competency": "{competency_name}",
    "category": "{category}",
    "department": "{department}",
    "level": "{level}",
    "questions": [
        {{
        "id": 1,
        "question": "string",
        "options": {{
            "A": "string",
            "B": "string",
            "C": "string",
            "D": "string"
        }},
        "correct_answer": "A",
        "explanation": "string"
        }}
    ]
    }}

    The "questions" array must contain exactly 5 objects, "id" values 1 through 5."""

    return skill_assessment_prompt


def get_competency_quiz(
    competency_name: str,
    competency_description: str,
    category: str,
    department: str,
    level: int,
):
    client = get_gemini_client()
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=get_skill_assessment_prompt(
            competency_name, competency_description, category, department, level
        ),
        config={
            "response_mime_type": "application/json",
            "response_schema": SkillAssessmentResponse,
        },
    )
    return SkillAssessmentResponse.model_validate_json(response.text)


def get_document_quiz_system_prompt(
    num_questions: int, competency_tag_list: str
) -> str:
    return f"""You are an expert assessment designer for India's Official Statistical System,
creating training quizzes for government officials.

You will be given an uploaded learning material as a file. Generate multiple-choice
questions strictly and only from the content of this file. Do not introduce outside
facts, statistics, or examples not present in the source material.

Return ONLY valid JSON — no preamble, no markdown code fences, no commentary before
or after. The response must be parseable directly by JSON.parse().

Output schema:
{{
  "quizTitle": string,
  "questions": [
    {{
      "text": string,
      "options": [
        {{"id": "a", "text": string}},
        {{"id": "b", "text": string}},
        {{"id": "c", "text": string}},
        {{"id": "d", "text": string}}
      ],
      "correctOptionId": "a" | "b" | "c" | "d",
      "explanation": string,
      "difficulty": "easy" | "medium" | "hard",
      "competencyTag": string
    }}
  ]
}}

Rules:
1. Generate exactly {num_questions} questions.
2. Mix difficulty levels unless a specific difficulty is requested: roughly
   40% easy, 40% medium, 20% hard.
3. Each question must have exactly 4 options with exactly one unambiguously
   correct answer. Distractors should be plausible, not silly or obviously wrong.
4. Explanations must justify the correct answer using only information from
   the source material, in 1-3 sentences.
5. Assign each question a competencyTag from this list where possible,
   choosing the closest match: {competency_tag_list}. If none fit well, infer
   a short, sensible tag from the material itself.
6. Avoid pure definition-recall questions where possible; prefer questions
   that test understanding or application of the concept.
7. Do not repeat the same underlying concept across multiple questions unless
   the material is very short.
8. If the material is too short or unsuitable to generate the requested number
   of quality questions, generate as many good ones as the content supports
   rather than padding with weak or repetitive questions."""


def get_document_quiz_user_message(
    num_questions: int, difficulty: str, competency_tag_list: str
) -> str:
    return f"Generate {num_questions} questions at {difficulty} difficulty level from the attached document. Relevant competency areas: {competency_tag_list}."


def generate_document_quiz(
    file_path: str,
    mime_type: Optional[str] = None,
    num_questions: int = 5,
    difficulty: str = "mixed",
    competency_tag_list: Optional[str] = None,
) -> DocumentQuizResponse:
    if not competency_tag_list:
        competency_tag_list = (
            "SNA 2008 & Macroeconomic Aggregates, Supply-Use Tables, Capital Stock & Depreciation, "
            "Consumer Price Index (CPI), Wholesale Price Index (WPI), Inflation Forecasting, "
            "NSSO Multi-Stage Stratified Sampling, CAPI Field Interviewing, Field Scrutiny & Audits, "
            "PLFS & Household Consumption, Sampling Frame Design, Questionnaire Formulation, "
            "Sampling Variance Estimation, IMF DQAF Compliance, Automated Anomaly Detection, "
            "Administrative Big Data Integration, IIP Compilation, Annual Survey of Industries (ASI), "
            "Economic Census, UN SDG Indicator Tracking, Gender Statistics, UN SEEA Environmental Accounting, "
            "Statistical Programming in Python, Inferential Statistics in R, Power BI & Dashboards, "
            "Generative AI for Governance, DPDP Act & Data Ethics, Policy Briefing & Cabinet Notes, Cyber Defense"
        )

    client = get_gemini_client()
    upload_config = types.UploadFileConfig(mime_type=mime_type) if mime_type else None
    uploaded_file = client.files.upload(file=file_path, config=upload_config)

    system_prompt = get_document_quiz_system_prompt(num_questions, competency_tag_list)
    user_prompt = get_document_quiz_user_message(
        num_questions, difficulty, competency_tag_list
    )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            uploaded_file,
            user_prompt,
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=DocumentQuizResponse,
        ),
    )

    return DocumentQuizResponse.model_validate_json(response.text)
