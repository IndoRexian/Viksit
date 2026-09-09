import { apiRequest } from "./api";

export interface CompetencyItem {
  id: number;
  code: string;
  name: string;
  department: string;
  category: string;
  description?: string | null;
  target_level: number;
  target_levels: Record<string, number>;
  assessed_level: number;
  status: string;
  gap: number;
  mapped_course_ids: number[];
  mapped_course_names: string[];
  last_assessed_at?: string | null;
}

export interface DivisionSummary {
  division: string;
  total_competencies: number;
  achieved_count: number;
  gap_count: number;
  urgent_gap_count: number;
  average_fulfillment_pct: number;
  items: CompetencyItem[];
}

export interface CompetencyMatrixResponse {
  composite_skill_index: number;
  total_competencies: number;
  achieved_count: number;
  gap_count: number;
  urgent_gap_count?: number;
  user_designation: string;
  user_department: string;
  items: CompetencyItem[];
  division_summaries?: DivisionSummary[];
}

export interface AssessmentUpdateResponse {
  message: string;
  competency_id: number;
  assessed_level: number;
  status: string;
}

export const competencyService = {
  async getUserMatrix(
    scope: "department" | "all" = "department",
  ): Promise<CompetencyMatrixResponse> {
    return apiRequest<CompetencyMatrixResponse>(
      `/competencies/matrix?scope=${scope}`,
      {
        method: "GET",
      },
    );
  },

  async updateAssessment(
    competencyId: number,
    assessedLevel: number,
  ): Promise<AssessmentUpdateResponse> {
    return apiRequest<AssessmentUpdateResponse>("/competencies/assess", {
      method: "POST",
      body: JSON.stringify({
        competency_id: competencyId,
        assessed_level: assessedLevel,
      }),
    });
  },
};
