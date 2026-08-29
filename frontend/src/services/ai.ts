import { apiRequest } from "./api";

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: QuestionOptions;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface SkillAssessmentResponse {
  competency: string;
  category: string;
  department: string;
  level: number;
  questions: AssessmentQuestion[];
}

export interface SkillAssessmentQuery {
  competency: string;
  description: string;
  category: string;
  department: string;
  level: number;
}

export interface QuizOption {
  id: "a" | "b" | "c" | "d";
  text: string;
}

export interface DocumentQuizQuestion {
  text: string;
  options: QuizOption[];
  correctOptionId: "a" | "b" | "c" | "d";
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  competencyTag: string;
}

export interface DocumentQuizResponse {
  quizTitle: string;
  questions: DocumentQuizQuestion[];
}

export const aiService = {
  async getCompetencyQuiz(
    query: SkillAssessmentQuery,
  ): Promise<SkillAssessmentResponse> {
    const params = new URLSearchParams({
      competency: query.competency,
      description: query.description || "",
      category: query.category,
      department: query.department,
      level: query.level.toString(),
    });

    return apiRequest<SkillAssessmentResponse>(
      `/ai/getquiz?${params.toString()}`,
      {
        method: "GET",
      },
    );
  },

  async generateDocumentQuiz(
    file: File,
    numQuestions: number = 5,
    difficulty: string = "mixed",
    competencyTags?: string[],
  ): Promise<DocumentQuizResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("num_questions", numQuestions.toString());
    formData.append("difficulty", difficulty);
    if (competencyTags && competencyTags.length > 0) {
      formData.append("competency_tags", competencyTags.join(", "));
    }

    return apiRequest<DocumentQuizResponse>("/ai/generate-document-quiz", {
      method: "POST",
      body: formData,
    });
  },
};
