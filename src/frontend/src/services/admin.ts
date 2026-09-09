import { apiRequest } from "./api";
import { type User } from "./auth";
import { type CompetencyItem } from "./competencies";
import { type Course, type EnrolledCourseDetail } from "./courses";

export interface DivisionalReadinessItem {
  division: string;
  total_officers: number;
  average_skill_index: number;
  total_competencies: number;
  achieved_benchmarks: number;
  active_gaps: number;
  urgent_gaps: number;
  completion_rate: number;
}

export interface CadreStatItem {
  cadre_group: string;
  officer_count: number;
  average_skill_index: number;
  urgent_gaps_count: number;
}

export interface AdminSummaryResponse {
  total_officers: number;
  total_courses: number;
  total_enrollments: number;
  total_completions: number;
  completion_rate: number;
  ministry_skill_index: number;
  active_gaps_count: number;
  urgent_gaps_count: number;
  total_certifications_issued: number;
  divisional_readiness: DivisionalReadinessItem[];
  cadre_distribution: CadreStatItem[];
}

export interface OfficerCadreItem {
  id: number;
  username: string;
  name: string;
  gender: string;
  cadre_type: string;
  designation: string;
  department: string;
  composite_skill_index: number;
  achieved_count: number;
  gap_count: number;
  urgent_gap_count: number;
  enrolled_count: number;
  completed_count: number;
  role: string;
  created_at?: string;
}

export interface OfficerDrilldownResponse {
  officer: User;
  cadre_type: string;
  composite_skill_index: number;
  achieved_count: number;
  gap_count: number;
  urgent_gap_count: number;
  competencies: CompetencyItem[];
  enrolled_courses: EnrolledCourseDetail[];
  badges_earned: Array<{
    certificate_id: string;
    badge_name: string;
    course_name: string;
    completed_at: string;
  }>;
}

export interface AdminCoursePayload {
  name: string;
  by?: string;
  duration?: number;
  difficulty_level?: string;
  tags?: string[];
  course_description?: string;
  mapped_competency_ids?: number[];
}

export interface AdminCertificationItem {
  certificate_id: string;
  user_id: number;
  user_name: string;
  user_designation: string;
  user_department: string;
  course_id: number;
  course_name: string;
  badge_name: string;
  completed_at: string;
}

export const adminService = {
  async getSummary(): Promise<AdminSummaryResponse> {
    return apiRequest<AdminSummaryResponse>("/admin/summary", {
      method: "GET",
    });
  },

  async getCadreOfficers(params?: {
    search?: string;
    department?: string;
    cadre?: string;
    gap_filter?: string;
  }): Promise<OfficerCadreItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.department) query.set("department", params.department);
    if (params?.cadre) query.set("cadre", params.cadre);
    if (params?.gap_filter) query.set("gap_filter", params.gap_filter);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<OfficerCadreItem[]>(`/admin/officers${queryString}`, {
      method: "GET",
    });
  },

  async getOfficerDrilldown(id: number): Promise<OfficerDrilldownResponse> {
    return apiRequest<OfficerDrilldownResponse>(`/admin/officers/${id}`, {
      method: "GET",
    });
  },

  async updateOfficerCompetency(
    officerId: number,
    competencyId: number,
    level: number,
    remarks?: string
  ): Promise<{ message: string; competency_id: number; assessed_level: number; status: string }> {
    return apiRequest(`/admin/officers/${officerId}/competencies`, {
      method: "POST",
      body: JSON.stringify({
        competency_id: competencyId,
        assessed_level: level,
        remarks: remarks || "Manual accreditation by MoSPI Authority",
      }),
    });
  },

  async createCourse(payload: AdminCoursePayload): Promise<Course> {
    return apiRequest<Course>("/admin/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateCourse(id: number, payload: AdminCoursePayload): Promise<Course> {
    return apiRequest<Course>(`/admin/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async getCertificationsRegistry(): Promise<AdminCertificationItem[]> {
    return apiRequest<AdminCertificationItem[]>("/admin/certifications", {
      method: "GET",
    });
  },
};
