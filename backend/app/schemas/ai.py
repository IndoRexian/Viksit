from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class QuestionOptions(BaseModel):
    A: str = Field(..., description="Option A")
    B: str = Field(..., description="Option B")
    C: str = Field(..., description="Option C")
    D: str = Field(..., description="Option D")


class AssessmentQuestion(BaseModel):
    id: int = Field(..., description="Question ID or sequence number")
    question: str = Field(..., description="The multiple choice question text")
    options: QuestionOptions = Field(
        ..., description="Dictionary containing options A, B, C, and D"
    )
    correct_answer: Literal["A", "B", "C", "D"] = Field(
        ..., description="The correct option key (A, B, C, or D)"
    )
    explanation: str = Field(
        ..., description="Detailed explanation of the correct answer"
    )


class SkillAssessmentResponse(BaseModel):
    competency: str = Field(..., description="Name of the competency")
    category: str = Field(..., description="Category of the competency")
    department: str = Field(..., description="Target department")
    level: int = Field(..., description="Proficiency level")
    questions: List[AssessmentQuestion] = Field(
        ..., description="List of multiple-choice assessment questions"
    )


class SkillAssessmentQuery(BaseModel):
    competency: str = Field(..., description="Name of the competency")
    description: str = Field(..., description="Description of the category")
    category: str = Field(..., description="Category of the competency")
    department: str = Field(..., description="Target department")
    level: int = Field(..., description="Proficiency level")


class QuizOption(BaseModel):
    id: Literal["a", "b", "c", "d"] = Field(
        ..., description="Option identifier (a, b, c, or d)"
    )
    text: str = Field(..., description="Option text")


class DocumentQuizQuestion(BaseModel):
    text: str = Field(..., description="The multiple choice question text")
    options: List[QuizOption] = Field(
        ..., description="Array of 4 options (a, b, c, d)"
    )
    correctOptionId: Literal["a", "b", "c", "d"] = Field(
        ..., description="The correct option identifier"
    )
    explanation: str = Field(
        ..., description="Explanation for why the correct answer is right"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        ..., description="Difficulty level"
    )
    competencyTag: str = Field(..., description="Associated competency area tag")


class DocumentQuizResponse(BaseModel):
    quizTitle: str = Field(..., description="Title of the generated quiz")
    questions: List[DocumentQuizQuestion] = Field(
        ..., description="List of generated quiz questions"
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "model", "system"] = Field(
        ..., description="Role of the message sender"
    )
    content: str = Field(
        ..., min_length=1, max_length=10000, description="Message text content"
    )


class AIChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(
        ..., min_length=1, description="Conversation history with the user"
    )
    uploaded_material_text: Optional[str] = Field(
        None, max_length=20000, description="Optional active document context"
    )


class ActionExecuted(BaseModel):
    type: Literal["enroll_course"]
    courseId: str
    courseTitle: Optional[str] = None
    officialId: str


class AIChatResponse(BaseModel):
    reply: str = Field(..., description="Conversational reply text")
    action_executed: Optional[ActionExecuted] = None
    action_status: Optional[
        Literal["success", "already_enrolled", "not_found", "error"]
    ] = None
    action_message: Optional[str] = None
