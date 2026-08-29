import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  courseService,
  type Course,
  type CourseRecommendationsResponse,
  type EnrolledCourseDetail,
  type CourseCompletionResponse,
} from "../services/courses";
import {
  competencyService,
  type CompetencyItem,
  type CompetencyMatrixResponse,
} from "../services/competencies";
import { EnrollmentModal } from "../components/EnrollmentModal";
import { AssessmentQuizModal } from "../components/AssessmentQuizModal";
import { DocumentQuizGeneratorModal } from "../components/DocumentQuizGeneratorModal";
import { DocumentQuizStudio } from "../components/DocumentQuizStudio";
import { CompetencyRadarChart } from "../components/CompetencyRadarChart";
import { SkillGapHeatmap } from "../components/SkillGapHeatmap";
import { CourseCompletionCelebrationModal } from "../components/CourseCompletionCelebrationModal";
import {
  CertificateModal,
  type CertificateDetails,
} from "../components/CertificateModal";
import {
  LogOut,
  CheckCircle2,
  ShieldCheck,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
  Search,
  RotateCw,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Target,
  FileText,
  Compass,
  Grid3X3,
  Network,
  Table as TableIcon,
  Upload,
  Award,
  Download,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "matrix" | "pathways" | "quiz-studio"
  >("overview");

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<"all" | "enrolled">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [recommendationsData, setRecommendationsData] =
    useState<CourseRecommendationsResponse | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);

  const [matrixData, setMatrixData] = useState<CompetencyMatrixResponse | null>(
    null,
  );
  const [matrixLoading, setMatrixLoading] = useState<boolean>(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [matrixView, setMatrixView] = useState<"radar" | "heatmap" | "table">(
    "radar",
  );

  const [enrolledModalCourse, setEnrolledModalCourse] = useState<Course | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [enrolledDetails, setEnrolledDetails] = useState<
    EnrolledCourseDetail[]
  >([]);
  const [progressUpdatingId, setProgressUpdatingId] = useState<number | null>(
    null,
  );

  const [completionModalData, setCompletionModalData] =
    useState<CourseCompletionResponse | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] =
    useState<boolean>(false);

  const [assessmentModalComp, setAssessmentModalComp] =
    useState<CompetencyItem | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] =
    useState<boolean>(false);

  const [isDocQuizModalOpen, setIsDocQuizModalOpen] = useState<boolean>(false);

  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateDetails | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartAssessment = (comp: CompetencyItem) => {
    setAssessmentModalComp(comp);
    setIsAssessmentModalOpen(true);
  };

  const handleAssessmentCompleted = async () => {
    await fetchMatrix();
    await fetchRecommendations();
    await fetchEnrolledDetails();
    await refreshUser();
  };

  const fetchEnrolledDetails = async () => {
    try {
      const data = await courseService.getMyEnrolledCoursesDetails();
      setEnrolledDetails(data);
    } catch (err) {
      console.error("Failed to load enrolled course details:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err: unknown) {
      console.error("Failed to load courses:", err);
      setCoursesError(
        err instanceof Error ? err.message : "Failed to load courses.",
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      const data = await courseService.getRecommendedCourses();
      setRecommendationsData(data);
    } catch (err: unknown) {
      console.error("Failed to load course recommendations:", err);
      setRecommendationsError(
        err instanceof Error
          ? err.message
          : "Failed to load course recommendations.",
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchMatrix = async () => {
    try {
      setMatrixLoading(true);
      setMatrixError(null);
      const data = await competencyService.getUserMatrix("department");
      setMatrixData(data);
    } catch (err: unknown) {
      console.error("Failed to load competency matrix:", err);
      setMatrixError(
        err instanceof Error
          ? err.message
          : "Failed to load competency matrix.",
      );
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchRecommendations();
    fetchMatrix();
    fetchEnrolledDetails();
  }, []);

  const handleBridgeGap = (comp: CompetencyItem) => {
    setActiveTab("pathways");
    if (comp.mapped_course_names && comp.mapped_course_names.length > 0) {
      setSearchQuery(comp.mapped_course_names[0]);
    } else {
      setSearchQuery(comp.name);
    }
  };

  const handleEnroll = async (course: Course) => {
    try {
      setActionLoadingId(course.id);
      await courseService.enrollInCourse(course.id);
      await refreshUser();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, enrollees: (c.enrollees || 0) + 1 } : c,
        ),
      );
      await fetchRecommendations();
      await fetchEnrolledDetails();
      setEnrolledModalCourse(course);
      setIsModalOpen(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to enroll in course.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnenroll = async (courseId: number) => {
    try {
      setActionLoadingId(courseId);
      await courseService.unenrollFromCourse(courseId);
      await refreshUser();
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, enrollees: Math.max(0, (c.enrollees || 1) - 1) }
            : c,
        ),
      );
      await fetchRecommendations();
      await fetchEnrolledDetails();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to unenroll from course.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateProgress = async (courseId: number, progress: number) => {
    try {
      setProgressUpdatingId(courseId);
      await courseService.updateCourseProgress(courseId, progress);
      await fetchEnrolledDetails();
      if (progress >= 100) {
        await fetchMatrix();
        await fetchRecommendations();
        await refreshUser();
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setProgressUpdatingId(null);
    }
  };

  const handleCompleteCourse = async (courseId: number) => {
    try {
      setProgressUpdatingId(courseId);
      const result = await courseService.completeCourse(courseId);
      setCompletionModalData(result);
      setIsCompletionModalOpen(true);
      await fetchEnrolledDetails();
      await fetchMatrix();
      await fetchRecommendations();
      await refreshUser();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to complete course.");
    } finally {
      setProgressUpdatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-700 bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-900 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Loading Official Profile...
        </p>
      </div>
    );
  }

  const enrolledIds = user.enrolled_courses || [];

  const filteredCourses = courses.filter((course) => {
    const isEnrolled = enrolledIds.includes(course.id);
    if (courseFilter === "enrolled" && !isEnrolled) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = course.name.toLowerCase().includes(q);
      const inBy = (course.by || "").toLowerCase().includes(q);
      const inDesc = (course.course_description || "")
        .toLowerCase()
        .includes(q);
      const inTags = (course.tags || []).some((t) =>
        t.toLowerCase().includes(q),
      );
      return inName || inBy || inDesc || inTags;
    }
    return true;
  });

  const recommendedItems = recommendationsData?.recommendations || [];
  const filteredRecommendations = recommendedItems.filter((item) => {
    const isEnrolled = enrolledIds.includes(item.course.id);
    if (isEnrolled) return false;
    if (courseFilter === "enrolled") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = item.course.name.toLowerCase().includes(q);
      const inBy = (item.course.by || "").toLowerCase().includes(q);
      const inDesc = (item.course.course_description || "")
        .toLowerCase()
        .includes(q);
      const inComp = (item.targeted_competency || "").toLowerCase().includes(q);
      const inReason = (item.reason || "").toLowerCase().includes(q);
      const inTags = (item.course.tags || []).some((t) =>
        t.toLowerCase().includes(q),
      );
      return inName || inBy || inDesc || inComp || inReason || inTags;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900">
      <header className="bg-slate-900 text-white border-b-2 border-amber-600 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="National Emblem"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400">
                Government of India • भारत सरकार
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Switch to Ministry / Training Administrator Governance Dashboard"
            >
              <ShieldCheck size={13} />
              <span>Admin Console</span>
            </button>

            <button
              className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/80 border border-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              onClick={handleLogout}
              title="End session"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="bg-white border border-slate-300 rounded shadow-xs mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 font-mono text-[11px] font-semibold uppercase">
                  {user.designation || "Statistical Officer"}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                  Cadre ID: @{user.username}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium ml-1">
                  <ShieldCheck size={14} /> Verified Official
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {user.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Posting:{" "}
                <strong className="text-slate-800 font-medium">
                  {user.department || "National Accounts Division"}
                </strong>{" "}
                • Integrated with iGOT Karmayogi & NSSTA TPAC Framework
              </p>
            </div>

            <div className="shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] rounded">
                iGOT • NSSTA Integrated
              </span>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-t border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "overview"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                }`}
              >
                <User
                  size={13}
                  className={
                    activeTab === "overview"
                      ? "text-slate-200"
                      : "text-slate-500"
                  }
                />
                <span>Service Dossier</span>
              </button>
              <button
                onClick={() => setActiveTab("matrix")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "matrix"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                }`}
              >
                <Grid3X3
                  size={13}
                  className={
                    activeTab === "matrix" ? "text-slate-200" : "text-slate-500"
                  }
                />
                <span>FRAC Competency Matrix</span>
              </button>
              <button
                onClick={() => setActiveTab("pathways")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "pathways"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                }`}
              >
                <BookOpen
                  size={13}
                  className={
                    activeTab === "pathways"
                      ? "text-slate-200"
                      : "text-slate-500"
                  }
                />
                <span>Learning Pathways</span>
              </button>
              <button
                onClick={() => setActiveTab("quiz-studio")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-all duration-150 shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "quiz-studio"
                    ? "bg-blue-900 text-white border-2 border-blue-950 shadow-sm ring-2 ring-blue-900/30"
                    : "bg-blue-50/80 text-blue-950 border-2 border-blue-800 hover:bg-blue-100 hover:border-blue-900 shadow-2xs ring-1 ring-blue-900/20"
                }`}
              >
                <FileText
                  size={13}
                  className={
                    activeTab === "quiz-studio"
                      ? "text-blue-200"
                      : "text-blue-900"
                  }
                />
                <span>Document Quiz Generator</span>
              </button>
            </div>

            <span className="hidden lg:inline-block text-[11px] font-mono text-slate-500">
              MoSPI Statistical Human Resource System
            </span>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-slate-200 bg-slate-50/70 p-3.5 rounded">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Composite Skill Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {matrixData
                    ? `${matrixData.composite_skill_index}%`
                    : matrixLoading
                      ? "..."
                      : "—"}
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  {matrixData && matrixData.gap_count === 0
                    ? "Target Met"
                    : "Active Gap"}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-900 h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${matrixData ? Math.min(100, matrixData.composite_skill_index) : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1.5">
                Across {matrixData?.total_competencies || 0} mapped competencies
              </span>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 p-3.5 rounded">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                FRAC Competencies
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {matrixData
                    ? `${matrixData.achieved_count} / ${matrixData.total_competencies}`
                    : matrixLoading
                      ? "..."
                      : "—"}
                </span>
                <span className="text-[11px] font-mono text-blue-700 font-semibold">
                  Achieved
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Mapped to {user.designation || "JSO"} role
              </span>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 p-3.5 rounded">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Academic Qualifications
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {user.qualifications?.length || 0}
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Verified
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Recorded in Service Book
              </span>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 p-3.5 rounded">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Curriculum Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {enrolledIds.length} Enrolled
                </span>
                <span className="text-[11px] font-mono text-amber-700 font-semibold">
                  {enrolledIds.length > 0 ? "Active" : "None"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                iGOT / NSSTA Accredited
              </span>
            </div>
          </div>
        </section>

        {activeTab === "overview" && (
          <div
            key="tab-overview"
            className="animate-tab-enter grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-300 rounded shadow-xs p-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                  <User size={16} className="text-blue-900" />
                  <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900">
                    Official Service Ledger
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Official Full Name</span>
                    <span className="font-semibold text-slate-900">
                      {user.name}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Cadre Username</span>
                    <span className="font-mono font-medium text-slate-900">
                      @{user.username}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Cadre Designation</span>
                    <span className="font-medium text-slate-900">
                      {user.designation || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">
                      Department / Division
                    </span>
                    <span className="font-medium text-slate-900">
                      {user.department || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Official Email</span>
                    <span className="font-mono text-slate-800">
                      {user.email || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Registered Phone</span>
                    <span className="font-mono text-slate-800">
                      {user.phone}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Gender</span>
                    <span className="text-slate-800">
                      {user.gender || "Not specified"}
                    </span>
                  </div>

                  {user.dob && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-mono text-slate-800">
                        {new Date(user.dob).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-blue-900" />
                    <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900">
                      Verified Qualifications
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">
                    {user.qualifications?.length || 0} Listed
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.qualifications && user.qualifications.length > 0 ? (
                    user.qualifications.map((qual, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-medium"
                      >
                        <CheckCircle2 size={12} className="text-emerald-700" />
                        <span>{qual}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No academic qualifications recorded.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-300 rounded shadow-xs p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-900" />
                    <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900">
                      Service Experience & Specialization History
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">
                    {user.experience?.length || 0} Entries
                  </span>
                </div>

                <div className="space-y-2.5">
                  {user.experience && user.experience.length > 0 ? (
                    user.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded"
                      >
                        <span className="font-mono text-xs font-bold text-blue-900 bg-white border border-slate-300 px-2 py-0.5 rounded shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-normal">
                          {exp}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No service record entries logged.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-600" />
                    <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900">
                      Verified Credentials & Micro-Badges
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded">
                    {
                      enrolledDetails.filter((e) => e.status === "completed")
                        .length
                    }{" "}
                    Verified Badges
                  </span>
                </div>

                {enrolledDetails.filter((e) => e.status === "completed")
                  .length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {enrolledDetails
                      .filter((e) => e.status === "completed")
                      .map((item) => (
                        <div
                          key={item.enrollment_id}
                          className="p-3.5 bg-radial from-amber-50/70 to-slate-50 border border-amber-300 rounded flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Award
                                  size={15}
                                  className="text-amber-600 shrink-0"
                                />
                                <span className="font-bold text-xs text-slate-900 line-clamp-1">
                                  {item.badge_name ||
                                    `Verified Specialist: ${item.course.name}`}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                              {item.course.name}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-amber-200/70 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-500 select-all">
                                {item.certificate_id}
                              </span>
                              <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                                <CheckCircle2 size={11} /> Verified
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedCertificate({
                                  certificateId:
                                    item.certificate_id ||
                                    "iGOT-MOSPI-2026-VERIFIED",
                                  officerName: user.name,
                                  officerDesignation:
                                    user.designation || "Statistical Officer",
                                  officerDepartment:
                                    user.department ||
                                    "National Accounts Division",
                                  cadreId: user.username,
                                  courseName: item.course.name,
                                  badgeName:
                                    item.badge_name ||
                                    `Verified Specialist: ${item.course.name}`,
                                  completedAt: item.completed_at || new Date(),
                                });
                                setIsCertModalOpen(true);
                              }}
                              className="w-full py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-400/60 text-amber-950 rounded text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Download size={12} />
                              <span>View & Download Certificate (PDF)</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 text-center">
                    <p className="mb-1">
                      No completed course badges issued yet.
                    </p>
                    <button
                      onClick={() => setActiveTab("pathways")}
                      className="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>
                        Complete an enrolled pathway to earn verified
                        micro-credentials
                      </span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Network size={16} className="text-blue-900" />
                    <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900">
                      Cadre Competency Visual Intelligence
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded">
                    FRAC Framework
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-6 space-y-3">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs text-slate-600 font-medium">
                          Cadre Benchmark Alignment
                        </span>
                        <span className="font-mono text-base font-bold text-slate-900">
                          {matrixData
                            ? `${matrixData.composite_skill_index}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-900 h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${matrixData ? Math.min(100, matrixData.composite_skill_index) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                        <span className="text-[10px] uppercase text-emerald-800 font-bold block">
                          Benchmarks Met
                        </span>
                        <span className="text-sm font-bold text-emerald-950 block mt-0.5">
                          {matrixData?.achieved_count || 0} /{" "}
                          {matrixData?.total_competencies || 0}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded">
                        <span className="text-[10px] uppercase text-rose-800 font-bold block">
                          Active Gaps
                        </span>
                        <span className="text-sm font-bold text-rose-950 block mt-0.5">
                          {matrixData?.gap_count || 0} Identified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setMatrixView("radar");
                        setActiveTab("matrix");
                      }}
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Network size={14} className="text-blue-400" />
                        <span>Open Spider Radar Chart</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setMatrixView("heatmap");
                        setActiveTab("matrix");
                      }}
                      className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded text-xs font-semibold inline-flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Grid3X3 size={14} className="text-rose-600" />
                        <span>View Division Skill Heatmap</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const firstGap = matrixData?.items.find(
                  (i) => i.status === "Skill Gap Identified",
                );
                return (
                  <div className="bg-slate-900 text-white border border-slate-800 rounded p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                          Next Action Recommended
                        </span>
                        {firstGap && (
                          <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono rounded">
                            Gap Identified
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base font-bold text-white">
                        {firstGap
                          ? `Upskill: ${firstGap.name}`
                          : "All Cadre Benchmarks Achieved"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {firstGap
                          ? `Current level ${firstGap.assessed_level} vs required Level ${firstGap.target_level}. Take linked iGOT courses to meet cadre expectation.`
                          : "Your profile meets all benchmark requirements for your role. Browse elective iGOT courses to advance further."}
                      </p>
                    </div>
                    {firstGap ? (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => handleStartAssessment(firstGap)}
                          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 shadow-xs"
                        >
                          <FileText size={13} />
                          <span>Assess Competency</span>
                        </button>
                        <button
                          onClick={() => handleBridgeGap(firstGap)}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150"
                        >
                          <span>Bridge Gap</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMatrixView("radar");
                          setActiveTab("matrix");
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 shrink-0"
                      >
                        <span>View Visual Matrix</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "matrix" && (
          <div key="tab-matrix" className="animate-tab-enter space-y-6">
            <div className="bg-white border border-slate-300 rounded shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-0.5">
                  Framework for Roles, Activities and Competencies (FRAC)
                </span>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Official Cadre Competency Matrix & Analytics
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Benchmarks mapped for{" "}
                  <strong className="text-slate-800 font-semibold">
                    {user.designation || "Statistical Officer"}
                  </strong>{" "}
                  in{" "}
                  <strong className="text-slate-800 font-semibold">
                    {user.department || "MoSPI"}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded text-xs">
                  <button
                    onClick={() => setMatrixView("radar")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
                      matrixView === "radar"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <Network size={14} />
                    <span>Radar Spider Chart</span>
                  </button>
                  <button
                    onClick={() => setMatrixView("heatmap")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
                      matrixView === "heatmap"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <Grid3X3 size={14} />
                    <span>Division Heatmap</span>
                  </button>
                  <button
                    onClick={() => setMatrixView("table")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
                      matrixView === "table"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <TableIcon size={14} />
                    <span>Tabular Matrix</span>
                  </button>
                </div>
              </div>
            </div>

            {matrixLoading && (
              <div className="bg-white border border-slate-300 rounded p-6 shadow-xs overflow-hidden divide-y divide-slate-200 animate-pulse">
                <div className="h-10 bg-slate-100 flex items-center px-4 gap-6">
                  <div className="w-20 h-4 bg-slate-300 rounded" />
                  <div className="w-48 h-4 bg-slate-300 rounded" />
                  <div className="w-28 h-4 bg-slate-300 rounded" />
                  <div className="w-24 h-4 bg-slate-300 rounded" />
                </div>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between gap-6"
                  >
                    <div className="w-16 h-4 bg-slate-200 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-3/5 h-4 bg-slate-200 rounded" />
                      <div className="w-4/5 h-3 bg-slate-100 rounded" />
                    </div>
                    <div className="w-24 h-4 bg-slate-200 rounded" />
                    <div className="w-20 h-6 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {matrixError && !matrixLoading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3 text-red-800 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold">
                    Unable to load competency matrix:
                  </span>{" "}
                  {matrixError}
                </div>
                <button
                  onClick={fetchMatrix}
                  className="px-2.5 py-1 bg-red-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!matrixLoading && !matrixError && matrixData && (
              <>
                {matrixView === "radar" && (
                  <CompetencyRadarChart
                    items={matrixData.items}
                    userDesignation={user.designation}
                    onAssessCompetency={handleStartAssessment}
                    onBridgeGap={handleBridgeGap}
                  />
                )}

                {matrixView === "heatmap" && (
                  <SkillGapHeatmap
                    items={matrixData.items}
                    divisionSummaries={matrixData.division_summaries}
                    userDepartment={user.department}
                    userDesignation={user.designation}
                    onAssessCompetency={handleStartAssessment}
                    onBridgeGap={handleBridgeGap}
                  />
                )}

                {matrixView === "table" && (
                  <div className="bg-white border border-slate-300 rounded shadow-xs p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-slate-900">
                          Complete Competency Roster
                        </h3>
                        <p className="text-xs text-slate-600">
                          Showing {matrixData.items.length} mapped competencies
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 border border-slate-300 rounded text-xs">
                        {[
                          "all",
                          "Domain",
                          "Functional",
                          "Behavioral",
                          "gaps",
                        ].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1 font-semibold rounded transition-all duration-150 cursor-pointer capitalize ${
                              categoryFilter === cat
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {cat === "all"
                              ? `All (${matrixData?.total_competencies || 0})`
                              : cat === "gaps"
                                ? `Skill Gaps (${matrixData?.gap_count || 0})`
                                : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                          <tr>
                            <th className="py-3 px-4">Domain Code</th>
                            <th className="py-3 px-4">
                              Competency Scope & Category
                            </th>
                            <th className="py-3 px-4">Cadre Target</th>
                            <th className="py-3 px-4">Assessed Score</th>
                            <th className="py-3 px-4">Status & Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-normal">
                          {matrixData.items
                            .filter((comp) => {
                              if (categoryFilter === "all") return true;
                              if (categoryFilter === "gaps")
                                return comp.status === "Skill Gap Identified";
                              return comp.category === categoryFilter;
                            })
                            .map((comp) => {
                              const isAchieved =
                                comp.status === "Benchmark Achieved";

                              return (
                                <tr
                                  key={comp.id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="py-3.5 px-4 font-mono font-bold text-blue-900 align-top">
                                    {comp.code}
                                  </td>
                                  <td className="py-3.5 px-4 max-w-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-slate-900 text-xs">
                                        {comp.name}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase ${
                                          comp.category === "Domain"
                                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                                            : comp.category === "Functional"
                                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                                              : "bg-amber-100 text-amber-800 border border-amber-200"
                                        }`}
                                      >
                                        {comp.category}
                                      </span>
                                    </div>
                                    {comp.description && (
                                      <p className="text-slate-500 text-[11px] leading-relaxed">
                                        {comp.description}
                                      </p>
                                    )}
                                    {comp.mapped_course_names &&
                                      comp.mapped_course_names.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {comp.mapped_course_names
                                            .slice(0, 2)
                                            .map((cName, idx) => (
                                              <span
                                                key={idx}
                                                className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                                              >
                                                {cName}
                                              </span>
                                            ))}
                                        </div>
                                      )}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-700 align-top">
                                    <span className="font-semibold text-slate-900">
                                      Level {comp.target_level}
                                    </span>{" "}
                                    •{" "}
                                    {comp.target_level === 1
                                      ? "Beginner"
                                      : comp.target_level === 2
                                        ? "Intermediate"
                                        : comp.target_level === 3
                                          ? "Proficient"
                                          : comp.target_level === 4
                                            ? "Advanced"
                                            : "Expert"}
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 font-mono text-[11px] font-bold rounded border ${
                                        comp.assessed_level >= comp.target_level
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                          : "bg-amber-50 border-amber-300 text-amber-800"
                                      }`}
                                    >
                                      Level {comp.assessed_level}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    {isAchieved ? (
                                      <div className="flex flex-col items-start gap-1.5">
                                        <span className="text-emerald-700 font-medium flex items-center gap-1.5 text-xs">
                                          <CheckCircle2
                                            size={14}
                                            className="text-emerald-600"
                                          />
                                          <span>Benchmark Achieved</span>
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleStartAssessment(comp)
                                          }
                                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-[11px] inline-flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                                          title="Take evaluation to advance level further"
                                        >
                                          <FileText
                                            size={11}
                                            className="text-slate-500"
                                          />
                                          <span>Re-evaluate</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-start gap-1.5">
                                        <span className="text-amber-800 font-semibold text-[11px] flex items-center gap-1">
                                          <AlertCircle
                                            size={13}
                                            className="text-amber-600"
                                          />
                                          <span>Skill Gap</span>
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <button
                                            onClick={() =>
                                              handleStartAssessment(comp)
                                            }
                                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          >
                                            <FileText size={11} />
                                            <span>Assess</span>
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleBridgeGap(comp)
                                            }
                                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-semibold rounded text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                            title="Browse linked iGOT courses"
                                          >
                                            <span>Pathways</span>
                                            <ArrowUpRight size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="border border-slate-200 bg-slate-50/80 rounded p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-2 font-semibold">
                Capacity Building Commission (CBC) • FRAC 5-Level Competency
                Scale
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-left">
                <div className="bg-white border border-slate-200 p-2 rounded">
                  <span className="font-mono text-[11px] font-bold text-slate-700 block">
                    Level 1 • Beginner
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Foundational concepts with direct assistance.
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded">
                  <span className="font-mono text-[11px] font-bold text-amber-700 block">
                    Level 2 • Intermediate
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Executes routine procedures with periodic review.
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded">
                  <span className="font-mono text-[11px] font-bold text-blue-700 block">
                    Level 3 • Proficient
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Independent execution of standard official tasks.
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded">
                  <span className="font-mono text-[11px] font-bold text-indigo-700 block">
                    Level 4 • Advanced
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Complex analysis, supervisory auditing & design.
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 block">
                    Level 5 • Expert
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    Strategic policy leadership & national methodology.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded text-xs text-slate-600 flex items-start gap-2.5">
              <Layers size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold block">
                  Cadre Competency Guidance:
                </strong>
                Officers in the{" "}
                <span className="font-medium text-slate-900">
                  {user.designation || "Statistical Officer"}
                </span>{" "}
                cadre are required to achieve{" "}
                <strong className="text-slate-900">Level 3 (Proficient)</strong>{" "}
                or higher across all foundational statistical domains to qualify
                for regular cadre progression, deputation postings, and
                specialized UN/World Bank statistical mission nominations.
              </div>
            </div>
          </div>
        )}

        {activeTab === "pathways" && (
          <div key="tab-pathways" className="animate-tab-enter space-y-6">
            <div className="p-4 sm:p-5 rounded border border-slate-300 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
                      Self-Paced Assessment Module
                    </span>
                  </div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    Generate Quizzes Directly From Learning Materials
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                    Upload statistical manuals, survey guidelines, or policy
                    PDFs to generate 5, 10, or 15 calibrated MCQs with
                    source-based explanations and competency scoring.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("quiz-studio")}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Upload size={14} />
                <span>Open Quiz Generator</span>
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded shadow-xs p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      Mission Karmayogi Curriculum
                    </span>
                    <span className="px-2 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-semibold rounded">
                      Live Catalog
                    </span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">
                    Official Statistical Learning Pathways
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search courses, tags, institutions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 w-56 sm:w-64"
                    />
                  </div>

                  <div className="flex items-center border border-slate-300 rounded overflow-hidden p-0.5 bg-slate-100 text-xs">
                    <button
                      onClick={() => setCourseFilter("all")}
                      className={`px-3 py-1 font-semibold rounded transition-all duration-150 cursor-pointer ${
                        courseFilter === "all"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({courses.length})
                    </button>
                    <button
                      onClick={() => setCourseFilter("enrolled")}
                      className={`px-3 py-1 font-semibold rounded transition-all duration-150 cursor-pointer ${
                        courseFilter === "enrolled"
                          ? "bg-white text-blue-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Enrolled ({enrolledIds.length})
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      fetchCourses();
                      fetchRecommendations();
                    }}
                    disabled={coursesLoading || recommendationsLoading}
                    title="Refresh course list and recommendations"
                    className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw
                      size={14}
                      className={
                        coursesLoading || recommendationsLoading
                          ? "animate-spin"
                          : ""
                      }
                    />
                  </button>
                </div>
              </div>

              {(coursesLoading || recommendationsLoading) &&
                courses.length === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="rounded border border-slate-200 overflow-hidden bg-white"
                      >
                        <div className="h-36 bg-slate-200" />
                        <div className="p-4 space-y-3">
                          <div className="h-3 w-1/3 bg-slate-200 rounded" />
                          <div className="h-4 w-3/4 bg-slate-300 rounded" />
                          <div className="h-3 w-full bg-slate-100 rounded" />
                          <div className="h-3 w-5/6 bg-slate-100 rounded" />
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                            <div className="h-7 w-24 bg-slate-300 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {(coursesError || recommendationsError) && !coursesLoading && (
                <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3 text-red-800 text-xs mb-6">
                  <AlertCircle size={16} className="shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">
                      Unable to load courses or recommendations:
                    </span>{" "}
                    {coursesError || recommendationsError}
                  </div>
                  <button
                    onClick={() => {
                      fetchCourses();
                      fetchRecommendations();
                    }}
                    className="px-2.5 py-1 bg-red-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!coursesLoading &&
                courseFilter === "all" &&
                filteredRecommendations.length > 0 && (
                  <div className="mb-10 pb-8 border-b border-slate-200">
                    <div className="bg-slate-50 border border-slate-300 border-l-4 border-l-amber-600 p-4 rounded-r mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-semibold rounded uppercase tracking-wider">
                            <Compass size={11} className="text-amber-400" />
                            Targeted Cadre Recommendations
                          </span>
                          <span className="text-[11px] font-mono text-amber-900 font-semibold">
                            {recommendationsData?.identified_gaps_count ||
                              filteredRecommendations.length}{" "}
                            Skill Gaps Identified
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-slate-900">
                          Role-Aligned Competency Pathways
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Directly calibrated for{" "}
                          <strong className="text-slate-800">
                            {user.designation || "Statistical Officer"}
                          </strong>{" "}
                          in{" "}
                          <strong className="text-slate-800">
                            {user.department || "MoSPI"}
                          </strong>{" "}
                          to achieve mandatory benchmark proficiency.
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-3 py-1 bg-white border border-slate-300 text-slate-800 font-mono text-xs font-semibold rounded">
                          {filteredRecommendations.length} Targeted Courses
                        </span>
                      </div>
                    </div>

                    <div
                      key={`recs-${filteredRecommendations.length}`}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
                    >
                      {filteredRecommendations.map((rec) => {
                        const course = rec.course;
                        const isActing = actionLoadingId === course.id;

                        return (
                          <div
                            key={`rec-${course.id}`}
                            className="flex flex-col justify-between h-full rounded border border-slate-300 bg-white hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 overflow-hidden group"
                          >
                            <div className="relative h-36 bg-slate-900 overflow-hidden border-b border-slate-200 flex items-center justify-center">
                              {course.image ? (
                                <img
                                  src={course.image}
                                  alt={course.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <BookOpen size={24} />
                                  <span className="text-[10px] font-mono uppercase">
                                    MoSPI • iGOT Module
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center h-5 text-[10px] font-mono font-bold px-2 rounded bg-amber-500 text-slate-950 uppercase tracking-wider shadow-xs">
                                    {rec.match_score}% Cadre Match
                                  </span>
                                  {rec.gap_severity > 0 && (
                                    <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded bg-slate-900/90 text-slate-200 border border-slate-700 uppercase tracking-wider">
                                      L{rec.gap_severity} Gap
                                    </span>
                                  )}
                                </div>

                                {course.difficulty_level && (
                                  <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded uppercase tracking-wider bg-slate-900/90 text-slate-200 border border-slate-700 shrink-0">
                                    {course.difficulty_level}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 mb-3 text-xs text-slate-800">
                                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-blue-900 mb-0.5">
                                    <Target
                                      size={13}
                                      className="text-amber-600 shrink-0"
                                    />
                                    <span className="line-clamp-1">
                                      Target: {rec.targeted_competency}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-2">
                                    {rec.reason}
                                  </p>
                                </div>

                                {course.by && (
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider line-clamp-1 block mb-1">
                                    {course.by}
                                  </span>
                                )}

                                <h4
                                  className="font-serif text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors"
                                  title={course.name}
                                >
                                  {course.name}
                                </h4>

                                {course.course_description && (
                                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                    {course.course_description}
                                  </p>
                                )}

                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {course.tags.slice(0, 3).map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 border border-slate-200 text-slate-700"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                  {course.duration != null && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={12} />
                                      {course.duration}h
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={12} />
                                    {course.enrollees || 0}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleEnroll(course)}
                                  disabled={isActing}
                                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded cursor-pointer transition-colors inline-flex items-center gap-1 disabled:opacity-50 shadow-xs"
                                >
                                  {isActing ? (
                                    "Enrolling..."
                                  ) : (
                                    <>
                                      <span>Enroll in Course</span>
                                      <ChevronRight size={13} />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div>
                {courseFilter === "all" && (
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-serif text-base font-bold text-slate-900">
                        {filteredRecommendations.length > 0
                          ? "All Statistical Curriculum Modules"
                          : "Curriculum Pathways"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {filteredCourses.length} official courses registered in
                        the iGOT national repository.
                      </p>
                    </div>
                  </div>
                )}

                {!coursesLoading &&
                  !coursesError &&
                  filteredCourses.length === 0 && (
                    <div className="py-16 text-center border border-dashed border-slate-300 rounded p-6">
                      <BookOpen
                        size={28}
                        className="mx-auto text-slate-400 mb-2"
                      />
                      <h3 className="font-serif text-sm font-bold text-slate-800">
                        No Courses Found
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {courseFilter === "enrolled"
                          ? "You haven't enrolled in any courses yet. Browse the 'All' tab to enroll in official pathways."
                          : "No courses matched your current search filters. Try adjusting your query."}
                      </p>
                      {courseFilter === "enrolled" && (
                        <button
                          onClick={() => setCourseFilter("all")}
                          className="mt-3 px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Browse All Courses
                        </button>
                      )}
                    </div>
                  )}

                {!coursesLoading &&
                  !coursesError &&
                  filteredCourses.length > 0 && (
                    <div
                      key={`grid-${courseFilter}-${searchQuery ? "filtered" : "all"}`}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
                    >
                      {filteredCourses.map((course) => {
                        const isEnrolled = enrolledIds.includes(course.id);
                        const isActing = actionLoadingId === course.id;

                        return (
                          <div
                            key={course.id}
                            className={`flex flex-col justify-between h-full rounded border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md overflow-hidden group ${
                              isEnrolled
                                ? "bg-white border-slate-300 border-t-4 border-t-emerald-700 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="relative h-36 bg-slate-900 overflow-hidden border-b border-slate-200 flex items-center justify-center">
                              {course.image ? (
                                <img
                                  src={course.image}
                                  alt={course.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <BookOpen size={24} />
                                  <span className="text-[10px] font-mono uppercase">
                                    MoSPI • iGOT Module
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
                                <div>
                                  {course.difficulty_level && (
                                    <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded uppercase tracking-wider bg-slate-900/90 text-slate-200 border border-slate-700">
                                      {course.difficulty_level}
                                    </span>
                                  )}
                                </div>

                                {isEnrolled && (
                                  <span className="inline-flex items-center gap-1.5 h-5 px-2.5 bg-emerald-700 text-white font-mono text-[10px] font-semibold rounded shadow-sm">
                                    <CheckCircle2 size={11} />
                                    Enrolled in Dossier
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                {isEnrolled &&
                                  (() => {
                                    const enr = enrolledDetails.find(
                                      (e) => e.course.id === course.id,
                                    );
                                    const prog = enr?.progress || 0;
                                    const isComp = enr?.status === "completed";

                                    return (
                                      <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-2.5 mb-3">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-[10px] uppercase font-bold text-slate-700">
                                            Learning Progress
                                          </span>
                                          <span
                                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                              isComp
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                : "bg-blue-100 text-blue-900 border border-blue-200"
                                            }`}
                                          >
                                            {isComp
                                              ? "Completed"
                                              : `${prog}% Done`}
                                          </span>
                                        </div>

                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              isComp
                                                ? "bg-emerald-600"
                                                : "bg-blue-900"
                                            }`}
                                            style={{ width: `${prog}%` }}
                                          />
                                        </div>

                                        {!isComp ? (
                                          <div className="space-y-2 pt-1 border-t border-slate-200">
                                            <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                                              <span className="text-slate-500">
                                                Track Progress:
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {[25, 50, 75].map((pVal) => (
                                                  <button
                                                    key={pVal}
                                                    disabled={
                                                      progressUpdatingId ===
                                                      course.id
                                                    }
                                                    onClick={() =>
                                                      handleUpdateProgress(
                                                        course.id,
                                                        pVal,
                                                      )
                                                    }
                                                    className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                                      prog === pVal
                                                        ? "bg-blue-900 text-white border-blue-950 font-bold"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                    }`}
                                                  >
                                                    {pVal}%
                                                  </button>
                                                ))}
                                              </div>
                                            </div>

                                            <button
                                              disabled={
                                                progressUpdatingId === course.id
                                              }
                                              onClick={() =>
                                                handleCompleteCourse(course.id)
                                              }
                                              className="w-full py-1.5 bg-radial from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-[11px] rounded inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all duration-150 active:scale-[0.98]"
                                            >
                                              <Award
                                                size={13}
                                                className="text-amber-300"
                                              />
                                              <span>
                                                {progressUpdatingId ===
                                                course.id
                                                  ? "Elevating Competencies..."
                                                  : "Mark Completed & Auto-Upskill"}
                                              </span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                                            <span className="text-emerald-800 font-bold inline-flex items-center gap-1">
                                              <CheckCircle2
                                                size={12}
                                                className="text-emerald-600"
                                              />
                                              Verified Credential Issued
                                            </span>
                                            <span className="text-slate-500 select-all font-semibold">
                                              {enr?.certificate_id}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                {course.by && (
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider line-clamp-1 block mb-1">
                                    {course.by}
                                  </span>
                                )}

                                <h3
                                  className="font-serif text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors"
                                  title={course.name}
                                >
                                  {course.name}
                                </h3>

                                {course.course_description && (
                                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                                    {course.course_description}
                                  </p>
                                )}

                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {course.tags.slice(0, 3).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 border border-slate-200 text-slate-700"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {course.tags.length > 3 && (
                                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-mono rounded">
                                        +{course.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                  {course.duration != null && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={12} />
                                      {course.duration}h
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={12} />
                                    {course.enrollees || 0}
                                  </span>
                                </div>

                                {isEnrolled ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUnenroll(course.id)}
                                      disabled={isActing}
                                      className="px-2.5 py-1 border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold rounded cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      {isActing ? "Updating..." : "Unenroll"}
                                    </button>
                                    <a
                                      href="https://portal.igotkarmayogi.gov.in"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded inline-flex items-center gap-1 shadow-xs transition-colors"
                                    >
                                      <span>Launch</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEnroll(course)}
                                    disabled={isActing}
                                    className="px-3.5 py-1 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded cursor-pointer transition-colors inline-flex items-center gap-1 disabled:opacity-50 shadow-xs"
                                  >
                                    {isActing ? (
                                      "Enrolling..."
                                    ) : (
                                      <>
                                        <span>Enroll</span>
                                        <ChevronRight size={13} />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "quiz-studio" && (
          <div key="tab-quiz-studio" className="animate-tab-enter">
            <DocumentQuizStudio
              availableCompetencies={
                matrixData?.items?.map((c: CompetencyItem) => c.name) || []
              }
            />
          </div>
        )}
      </main>

      <EnrollmentModal
        isOpen={isModalOpen}
        course={enrolledModalCourse}
        onClose={() => setIsModalOpen(false)}
      />

      <AssessmentQuizModal
        isOpen={isAssessmentModalOpen}
        competency={assessmentModalComp}
        userDepartment={user.department || "MoSPI"}
        onClose={() => setIsAssessmentModalOpen(false)}
        onAssessmentCompleted={handleAssessmentCompleted}
      />

      <DocumentQuizGeneratorModal
        isOpen={isDocQuizModalOpen}
        onClose={() => setIsDocQuizModalOpen(false)}
        availableCompetencies={
          matrixData?.items?.map((c: CompetencyItem) => c.name) || []
        }
      />

      <CourseCompletionCelebrationModal
        isOpen={isCompletionModalOpen}
        completionData={completionModalData}
        onClose={() => setIsCompletionModalOpen(false)}
        onViewDossier={() => setActiveTab("overview")}
        onDownloadCertificate={() => {
          if (completionModalData && user) {
            setSelectedCertificate({
              certificateId:
                completionModalData.certificate_id ||
                "iGOT-MOSPI-2026-VERIFIED",
              officerName: user.name,
              officerDesignation: user.designation || "Statistical Officer",
              officerDepartment:
                user.department || "National Accounts Division",
              cadreId: user.username,
              courseName: completionModalData.course_name,
              badgeName: `Verified Specialist: ${completionModalData.course_name}`,
              completedAt: completionModalData.completed_at,
              elevatedCompetencies:
                completionModalData.elevated_competencies.map((c) => ({
                  name: c.name,
                  code: c.code,
                  newLevel: c.new_level,
                })),
            });
            setIsCompletionModalOpen(false);
            setIsCertModalOpen(true);
          }
        }}
      />

      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        details={selectedCertificate}
      />

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-3 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Ministry of Statistics and Programme
            Implementation (MoSPI), Government of India.
          </span>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>Session: Official Cadre Console</span>
            <span>•</span>
            <span>Secured Government Network</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
