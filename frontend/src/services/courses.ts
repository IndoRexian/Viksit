import { apiRequest } from "./api";

export interface Course {
  id: number;
  image?: string | null;
  name: string;
  by?: string | null;
  duration?: number | null;
  difficulty_level?: string | null;
  tags?: string[];
  course_description?: string | null;
  enrollees?: number;
}

export interface EnrollmentResponse {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
  message?: string;
}

export interface RecommendedCourseItem {
  course: Course;
  reason: string;
  targeted_competency?: string | null;
  targeted_competency_code?: string | null;
  gap_severity: number;
  match_score: number;
  priority: number;
}

export interface CourseRecommendationsResponse {
  total_recommendations: number;
  identified_gaps_count: number;
  officer_designation: string;
  officer_department: string;
  recommendations: RecommendedCourseItem[];
}

export interface ElevatedCompetency {
  competency_id: number;
  code: string;
  name: string;
  department: string;
  previous_level: number;
  new_level: number;
  target_level: number;
  status: string;
}

export interface CourseCompletionResponse {
  message: string;
  course_id: number;
  course_name: string;
  status: string;
  progress: number;
  completed_at: string;
  certificate_id: string;
  badge_name: string;
  elevated_competencies: ElevatedCompetency[];
}

export interface EnrolledCourseDetail {
  course: Course;
  enrollment_id: number;
  enrolled_at: string;
  progress: number;
  status: "enrolled" | "in_progress" | "completed";
  completed_at?: string | null;
  certificate_id?: string | null;
  badge_name?: string | null;
}

export const courseService = {
  async getAllCourses(skip = 0, limit = 100): Promise<Course[]> {
    return apiRequest<Course[]>(`/courses/?skip=${skip}&limit=${limit}`, {
      method: "GET",
    });
  },

  async getRecommendedCourses(): Promise<CourseRecommendationsResponse> {
    return apiRequest<CourseRecommendationsResponse>(
      "/courses/recommendations",
      {
        method: "GET",
      },
    );
  },

  async getCourseById(id: number): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}`, {
      method: "GET",
    });
  },

  async getMyEnrolledCourses(): Promise<Course[]> {
    return apiRequest<Course[]>("/courses/user/my-courses", {
      method: "GET",
    });
  },

  async getMyEnrolledCoursesDetails(): Promise<EnrolledCourseDetail[]> {
    return apiRequest<EnrolledCourseDetail[]>(
      "/courses/user/enrolled-details",
      {
        method: "GET",
      },
    );
  },

  async enrollInCourse(courseId: number): Promise<EnrollmentResponse> {
    return apiRequest<EnrollmentResponse>(`/courses/${courseId}/enroll`, {
      method: "POST",
    });
  },

  async updateCourseProgress(
    courseId: number,
    progress: number,
  ): Promise<EnrolledCourseDetail> {
    return apiRequest<EnrolledCourseDetail>(`/courses/${courseId}/progress`, {
      method: "POST",
      body: JSON.stringify({ progress }),
    });
  },

  async completeCourse(courseId: number): Promise<CourseCompletionResponse> {
    return apiRequest<CourseCompletionResponse>(
      `/courses/${courseId}/complete`,
      {
        method: "POST",
      },
    );
  },

  async unenrollFromCourse(
    courseId: number,
  ): Promise<{ message: string; course_id: number }> {
    return apiRequest<{ message: string; course_id: number }>(
      `/courses/${courseId}/enroll`,
      {
        method: "DELETE",
      },
    );
  },
};
