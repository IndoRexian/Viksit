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
import { AIChatPill } from "../components/AIChatPill";

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
  ChevronDown,
  Check,
  Menu,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "matrix" | "pathways" | "quiz-studio"
  >("overview");
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

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
  const [isRosterDropdownOpen, setIsRosterDropdownOpen] =
    useState<boolean>(false);
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
  const [enrolledDetailsLoading, setEnrolledDetailsLoading] =
    useState<boolean>(true);
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
    await Promise.allSettled([
      fetchMatrix(),
      fetchRecommendations(),
      fetchEnrolledDetails(),
      refreshUser(),
    ]);
  };

  const handleAICourseEnrolled = async () => {
    await Promise.allSettled([
      fetchCourses(),
      fetchRecommendations(),
      fetchEnrolledDetails(),
      fetchMatrix(),
      refreshUser(),
    ]);
  };

  const fetchEnrolledDetails = async () => {
    try {
      setEnrolledDetailsLoading(true);
      const data = await courseService.getMyEnrolledCoursesDetails();
      setEnrolledDetails(data);
    } catch (err) {
      console.error("Failed to load enrolled course details:", err);
    } finally {
      setEnrolledDetailsLoading(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

      // Open enrollment modal immediately upon successful enrollment
      setEnrolledModalCourse(course);
      setIsModalOpen(true);

      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, enrollees: (c.enrollees || 0) + 1 } : c,
        ),
      );

      // Concurrently refresh user profile, recommendations and enrolled details
      await Promise.allSettled([
        refreshUser(),
        fetchRecommendations(),
        fetchEnrolledDetails(),
      ]);
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
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, enrollees: Math.max(0, (c.enrollees || 1) - 1) }
            : c,
        ),
      );
      await Promise.allSettled([
        refreshUser(),
        fetchRecommendations(),
        fetchEnrolledDetails(),
      ]);
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
        await Promise.allSettled([
          fetchMatrix(),
          fetchRecommendations(),
          refreshUser(),
        ]);
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
      await Promise.allSettled([
        fetchEnrolledDetails(),
        fetchMatrix(),
        fetchRecommendations(),
        refreshUser(),
      ]);
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

          {/* Mobile Navigation Dropdown Menu (< sm) */}
          <div className="sm:hidden relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs btn-press"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="Account and Navigation Menu"
            >
              <Menu size={16} />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-slate-900/98 backdrop-blur-md border border-slate-700 text-white rounded-xl shadow-2xl ring-1 ring-slate-800 p-1.5 space-y-1 animate-scale-in">
                  {/* User Identity Header */}
                  <div className="px-2.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 truncate">
                        @{user?.username}
                      </span>
                      {user?.role === "admin" && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold rounded uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin Console Option */}
                  {user?.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate("/admin");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <ShieldCheck
                        size={14}
                        className="text-amber-400 shrink-0"
                      />
                      <span>Admin Console</span>
                    </button>
                  )}

                  {/* Sign Out Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={14} className="shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop Action Buttons (>= sm) */}
          <div className="hidden sm:flex items-center gap-3">
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press hover:shadow-md"
                title="Switch to Ministry / Training Administrator Governance Dashboard"
              >
                <ShieldCheck size={13} />
                <span>Admin Console</span>
              </button>
            )}

            <button
              className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/80 border border-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 btn-press"
              onClick={handleLogout}
              title="End session"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="bg-white border border-slate-300 rounded shadow-xs mb-6 overflow-hidden transition-shadow duration-300 hover:shadow-sm">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 font-mono text-[11px] font-semibold uppercase rounded transition-colors">
                  {user.designation || "Statistical Officer"}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] rounded">
                  Cadre ID: @{user.username}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium ml-1">
                  <ShieldCheck size={14} className="animate-pulse-subtle" />{" "}
                  Verified Official
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
              <span className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-mono text-[11px] rounded transition-colors">
                iGOT • NSSTA Integrated
              </span>
            </div>
          </div>

          {/* Mobile Navigation Dropdown (< sm) - Custom shadcn-styled Dropdown */}
          <div className="sm:hidden px-3.5 py-2.5 bg-slate-50 border-t border-b border-slate-200 relative">
            {(() => {
              const navTabs = [
                {
                  id: "overview" as const,
                  label: "Service Dossier",
                  sublabel: "Cadre profile & verified credentials",
                  icon: User,
                  badge: null,
                },
                {
                  id: "matrix" as const,
                  label: "FRAC Competency Matrix",
                  sublabel: "Radar, heatmap & benchmark roster",
                  icon: Grid3X3,
                  badge: null,
                },
                {
                  id: "pathways" as const,
                  label: "Learning Pathways",
                  sublabel: "Targeted iGOT courses & catalog",
                  icon: BookOpen,
                  badge: null,
                },
                {
                  id: "quiz-studio" as const,
                  label: "Document Quiz Generator",
                  sublabel: "Calibrated MCQ assessment from PDFs",
                  icon: FileText,
                  badge: null,
                },
              ];

              const currentTab =
                navTabs.find((t) => t.id === activeTab) || navTabs[0];
              const CurrentIcon = currentTab.icon;

              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNavDropdownOpen((prev) => !prev)}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-900 text-slate-900 rounded-lg px-3 py-2 shadow-2xs flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer btn-press text-left"
                    aria-expanded={isNavDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 border border-blue-100">
                        <CurrentIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {currentTab.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {currentTab.sublabel}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={15}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isNavDropdownOpen ? "rotate-180 text-blue-900" : ""
                      }`}
                    />
                  </button>

                  {isNavDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNavDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl ring-1 ring-slate-900/10 p-1 space-y-1 animate-scale-in">
                        <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                          Select View
                        </div>
                        {navTabs.map((tab) => {
                          const isSelected = activeTab === tab.id;
                          const TabIcon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsNavDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                                  : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-slate-800 text-amber-400"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <TabIcon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold block truncate">
                                    {tab.label}
                                  </span>
                                  <span
                                    className={`text-[10px] block truncate ${
                                      isSelected
                                        ? "text-slate-300"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {tab.sublabel}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-amber-400 shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Desktop Navigation Tabs (>= sm) */}
          <div className="hidden sm:flex px-5 sm:px-6 py-2.5 bg-slate-50 border-t border-b border-slate-200 items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
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
                className={`px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
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

          <div className="p-3 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Composite Skill Index */}
            <div className="border border-slate-200 bg-slate-50/70 p-2.5 sm:p-3.5 rounded-lg card-interactive min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1 leading-snug">
                  Composite Skill Index
                </span>
                <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                  <span className="font-mono text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                    {matrixData
                      ? `${matrixData.composite_skill_index}%`
                      : matrixLoading
                        ? "..."
                        : "—"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 font-semibold shrink-0">
                    {matrixData && matrixData.gap_count === 0
                      ? "Target Met"
                      : "Active Gap"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-900 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${matrixData ? Math.min(100, matrixData.composite_skill_index) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2 leading-tight">
                Across {matrixData?.total_competencies || 0} mapped competencies
              </span>
            </div>

            {/* 2. FRAC Competencies */}
            <div className="border border-slate-200 bg-slate-50/70 p-2.5 sm:p-3.5 rounded-lg card-interactive min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1 leading-snug">
                  FRAC Competencies
                </span>
                <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                  <span className="font-mono text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                    {matrixData
                      ? `${matrixData.achieved_count} / ${matrixData.total_competencies}`
                      : matrixLoading
                        ? "..."
                        : "—"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-blue-700 font-semibold shrink-0">
                    Achieved
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2 leading-tight">
                Mapped to {user.designation || "Officer"} role
              </span>
            </div>

            {/* 3. Academic Qualifications */}
            <div className="border border-slate-200 bg-slate-50/70 p-2.5 sm:p-3.5 rounded-lg card-interactive min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1 leading-snug">
                  Academic Qualifications
                </span>
                <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                  <span className="font-mono text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                    {user.qualifications?.length || 0}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-600 shrink-0">
                    Verified
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2 leading-tight">
                Recorded in Service Book
              </span>
            </div>

            {/* 4. Curriculum Status */}
            <div className="border border-slate-200 bg-slate-50/70 p-2.5 sm:p-3.5 rounded-lg card-interactive min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1 leading-snug">
                  Curriculum Status
                </span>
                <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-lg xs:text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                      {enrolledIds.length}
                    </span>
                    <span className="text-xs font-sans font-medium text-slate-600">
                      Enrolled
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-amber-700 font-semibold shrink-0">
                    {enrolledIds.length > 0 ? "Active" : "None"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2 leading-tight">
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
              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 card-interactive">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                    <User size={18} className="shrink-0" />
                  </div>
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-snug">
                    Official Service Ledger
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500">Official Full Name</span>
                    <span className="font-semibold text-slate-900">
                      {user.name}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500">Cadre Username</span>
                    <span className="font-mono font-medium text-slate-900">
                      @{user.username}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500 shrink-0">
                      Cadre Designation
                    </span>
                    <span className="font-medium text-slate-900 text-right">
                      {user.designation || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500 shrink-0">
                      Department / Division
                    </span>
                    <span className="font-medium text-slate-900 text-right">
                      {user.department || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500">Official Email</span>
                    <span className="font-mono text-slate-800">
                      {user.email || "Not specified"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500">Registered Phone</span>
                    <span className="font-mono text-slate-800">
                      {user.phone}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1 rounded transition-colors">
                    <span className="text-slate-500">Gender</span>
                    <span className="text-slate-800">
                      {user.gender || "Not specified"}
                    </span>
                  </div>

                  {user.dob && (
                    <div className="flex justify-between py-1.5 hover:bg-slate-50 px-1 rounded transition-colors">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-mono text-slate-800">
                        {new Date(user.dob).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 card-interactive">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                    <GraduationCap size={18} className="shrink-0" />
                  </div>
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-snug">
                    Verified Qualifications
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.qualifications && user.qualifications.length > 0 ? (
                    user.qualifications.map((qual, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
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
              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 card-interactive">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                    <Briefcase size={18} className="shrink-0" />
                  </div>
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-snug">
                    Service Experience & Specialization History
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {user.experience && user.experience.length > 0 ? (
                    user.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded transition-all duration-200"
                      >
                        <span className="font-mono text-xs font-bold text-blue-900 bg-white border border-slate-300 px-2 py-0.5 rounded shrink-0 shadow-2xs">
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

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 space-y-4 card-interactive">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                    <Award size={18} className="shrink-0 text-amber-700" />
                  </div>
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-snug">
                    Verified Credentials & Micro-Badges
                  </h2>
                </div>

                {enrolledDetailsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50/80 border border-slate-200 rounded animate-pulse space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                            <div className="h-3.5 bg-amber-200/60 rounded w-10" />
                          </div>
                          <div className="h-2.5 bg-slate-200 rounded w-4/5" />
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-2.5 bg-slate-200 rounded w-28" />
                            <div className="h-2.5 bg-emerald-200/70 rounded w-12" />
                          </div>
                          <div className="h-7 bg-slate-200 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : enrolledDetails.filter((e) => e.status === "completed")
                    .length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {enrolledDetails
                      .filter((e) => e.status === "completed")
                      .map((item) => (
                        <div
                          key={item.enrollment_id}
                          className="p-3.5 bg-radial from-amber-50/70 to-slate-50 border border-amber-300 hover:border-amber-400 hover:shadow-md rounded flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
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
                              className="w-full py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-400/60 text-amber-950 rounded text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs btn-press"
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
                      className="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer transition-all duration-150"
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

              <div className="bg-white border border-slate-300 rounded shadow-xs p-5 space-y-4 card-interactive">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                      <Network size={18} className="shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-snug">
                        Cadre Competency Visual Intelligence
                      </h2>
                      <span className="text-[10.5px] text-slate-500 block truncate">
                        Interactive Radar Analytics & Division Heatmap
                      </span>
                    </div>
                  </div>
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
                          className="bg-blue-900 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${matrixData ? Math.min(100, matrixData.composite_skill_index) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded transition-transform duration-200 hover:scale-[1.02]">
                        <span className="text-[10px] uppercase text-emerald-800 font-bold block">
                          Benchmarks Met
                        </span>
                        <span className="text-sm font-bold text-emerald-950 block mt-0.5">
                          {matrixData?.achieved_count || 0} /{" "}
                          {matrixData?.total_competencies || 0}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded transition-transform duration-200 hover:scale-[1.02]">
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
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-between cursor-pointer transition-all duration-200 shadow-xs btn-press group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-slate-800 text-blue-400 flex items-center justify-center shrink-0 border border-slate-700 group-hover:rotate-12 transition-transform duration-300">
                          <Network size={15} className="shrink-0" />
                        </div>
                        <span className="truncate">
                          Open Spider Radar Chart
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0"
                      />
                    </button>

                    <button
                      onClick={() => {
                        setMatrixView("heatmap");
                        setActiveTab("matrix");
                      }}
                      className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center justify-between cursor-pointer transition-all duration-200 btn-press group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 group-hover:scale-110 transition-transform duration-300">
                          <Grid3X3 size={15} className="shrink-0" />
                        </div>
                        <span className="truncate">
                          View Division Skill Heatmap
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-500 group-hover:translate-x-1 transition-transform shrink-0"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const firstGap = matrixData?.items.find(
                  (i) => i.status === "Skill Gap Identified",
                );
                return (
                  <div className="bg-slate-900 text-white border border-slate-800 rounded p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">
                          Next Action Recommended
                        </span>
                        {firstGap && (
                          <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono rounded animate-pulse-subtle">
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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0 relative z-10">
                        <button
                          onClick={() => handleStartAssessment(firstGap)}
                          className="w-full sm:w-auto px-3 sm:px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press min-w-0"
                        >
                          <FileText size={13} className="shrink-0" />
                          <span className="truncate">Assess Competency</span>
                        </button>
                        <button
                          onClick={() => handleBridgeGap(firstGap)}
                          className="w-full sm:w-auto px-3 sm:px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press min-w-0"
                        >
                          <span className="truncate">Bridge Gap</span>
                          <ArrowUpRight size={14} className="shrink-0" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMatrixView("radar");
                          setActiveTab("matrix");
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shrink-0 btn-press relative z-10"
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

              <div className="flex items-center justify-center md:justify-end w-full md:w-auto shrink-0">
                <div className="inline-flex items-center bg-slate-100 p-1 border border-slate-300 rounded text-xs">
                  <button
                    onClick={() => setMatrixView("radar")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      matrixView === "radar"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                    title="Radar Spider Chart"
                    aria-label="Radar Spider Chart"
                  >
                    <Network size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Radar Spider Chart</span>
                  </button>
                  <button
                    onClick={() => setMatrixView("heatmap")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      matrixView === "heatmap"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                    title="Division Heatmap"
                    aria-label="Division Heatmap"
                  >
                    <Grid3X3 size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Division Heatmap</span>
                  </button>
                  <button
                    onClick={() => setMatrixView("table")}
                    className={`px-3 py-1.5 font-semibold rounded inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      matrixView === "table"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                    title="Tabular Matrix"
                    aria-label="Tabular Matrix"
                  >
                    <TableIcon size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Tabular Matrix</span>
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
                  <div className="bg-white border border-slate-300 rounded shadow-xs p-3 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-3 sm:pb-4">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                          Complete Competency Roster
                        </h3>
                        <p className="text-xs text-slate-600">
                          Showing {matrixData.items.length} mapped competencies
                        </p>
                      </div>

                      {/* Mobile Category Dropdown - Custom shadcn-styled Dropdown */}
                      <div className="sm:hidden w-full relative">
                        {(() => {
                          const rosterOptions = [
                            {
                              id: "all",
                              label: `All Competencies (${matrixData?.total_competencies || matrixData.items.length})`,
                            },
                            { id: "Domain", label: "Domain" },
                            { id: "Functional", label: "Functional" },
                            { id: "Behavioral", label: "Behavioral" },
                            {
                              id: "gaps",
                              label: `Skill Gaps (${matrixData?.gap_count || matrixData.items.filter((i) => i.status === "Skill Gap Identified").length})`,
                            },
                          ];

                          const curOpt =
                            rosterOptions.find(
                              (o) => o.id === categoryFilter,
                            ) || rosterOptions[0];

                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsRosterDropdownOpen((prev) => !prev)
                                }
                                className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-900 text-slate-900 rounded-lg px-3 py-2 text-xs font-semibold shadow-2xs flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer btn-press text-left"
                                aria-expanded={isRosterDropdownOpen}
                              >
                                <span className="truncate">{curOpt.label}</span>
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                    isRosterDropdownOpen
                                      ? "rotate-180 text-blue-900"
                                      : ""
                                  }`}
                                />
                              </button>

                              {isRosterDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() =>
                                      setIsRosterDropdownOpen(false)
                                    }
                                  />
                                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/98 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl ring-1 ring-slate-900/10 p-1 space-y-0.5 animate-scale-in">
                                    {rosterOptions.map((opt) => {
                                      const isSelected =
                                        categoryFilter === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => {
                                            setCategoryFilter(opt.id);
                                            setIsRosterDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-all duration-150 cursor-pointer ${
                                            isSelected
                                              ? "bg-slate-900 text-white font-semibold shadow-xs"
                                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                          }`}
                                        >
                                          <span className="truncate">
                                            {opt.label}
                                          </span>
                                          {isSelected && (
                                            <Check
                                              size={13}
                                              className="text-amber-400 shrink-0"
                                            />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Desktop / Tablet Category Tabs */}
                      <div className="hidden sm:flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 border border-slate-300 rounded text-xs">
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

                    {/* Mobile Row Cards View (< sm) */}
                    <div className="sm:hidden space-y-2.5">
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
                            <div
                              key={comp.id}
                              className="p-3 bg-slate-50/80 border border-slate-200 rounded space-y-2.5"
                            >
                              <div className="space-y-1.5">
                                <span className="font-mono font-bold text-blue-900 text-xs block">
                                  {comp.code}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded border uppercase shrink-0 ${
                                      comp.category === "Domain"
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : comp.category === "Functional"
                                          ? "bg-purple-100 text-purple-800 border-purple-200"
                                          : "bg-amber-100 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    {comp.category}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded border shrink-0 ${
                                      isAchieved
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                        : "bg-amber-50 border-amber-300 text-amber-800"
                                    }`}
                                  >
                                    {isAchieved ? "Met Benchmark" : "Skill Gap"}
                                  </span>
                                </div>

                                <h4 className="font-semibold text-slate-900 text-xs leading-snug pt-0.5">
                                  {comp.name}
                                </h4>
                              </div>

                              {comp.description && (
                                <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                                  {comp.description}
                                </p>
                              )}

                              {comp.mapped_course_names &&
                                comp.mapped_course_names.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {comp.mapped_course_names.map(
                                      (cName, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[10px] font-mono bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 break-words leading-tight"
                                        >
                                          📚 {cName}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                )}

                              <div className="pt-2.5 border-t border-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  <span className="text-slate-600 text-[11px]">
                                    Req: <strong>L{comp.target_level}</strong>
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600 text-[11px]">
                                    Score:{" "}
                                    <strong
                                      className={
                                        isAchieved
                                          ? "text-emerald-700 font-bold"
                                          : "text-amber-800 font-bold"
                                      }
                                    >
                                      L{comp.assessed_level}
                                    </strong>
                                  </span>
                                </div>

                                <div className="flex flex-row items-center gap-2 w-full pt-0.5">
                                  {isAchieved ? (
                                    <button
                                      onClick={() =>
                                        handleStartAssessment(comp)
                                      }
                                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs inline-flex items-center justify-center gap-1.5 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <FileText
                                        size={13}
                                        className="text-slate-500 shrink-0"
                                      />
                                      <span>Re-evaluate Competency</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleStartAssessment(comp)
                                        }
                                        className="flex-1 w-1/2 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                      >
                                        <FileText
                                          size={13}
                                          className="shrink-0"
                                        />
                                        <span>Assess</span>
                                      </button>
                                      <button
                                        onClick={() => handleBridgeGap(comp)}
                                        className="flex-1 w-1/2 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                        title="Browse linked iGOT courses"
                                      >
                                        <span>Pathways</span>
                                        <ArrowUpRight
                                          size={13}
                                          className="shrink-0"
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Desktop Table View (>= sm) */}
                    <div className="hidden sm:block overflow-x-auto border border-slate-300 rounded">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                          <tr>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
                              Domain Code
                            </th>
                            <th className="py-2 sm:py-3 px-2.5 sm:px-4 min-w-44 sm:min-w-0">
                              Competency Scope & Category
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
                              Cadre Target
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
                              Assessed Score
                            </th>
                            <th className="py-2 sm:py-3 px-2.5 sm:px-4 whitespace-nowrap">
                              Status & Action
                            </th>
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
                                  <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-mono font-bold text-blue-900 align-top whitespace-nowrap text-[11px] sm:text-xs">
                                    {comp.code}
                                  </td>
                                  <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 max-w-sm">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span className="font-semibold text-slate-900 text-xs">
                                        {comp.name}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase shrink-0 ${
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
                                      <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                                        {comp.description}
                                      </p>
                                    )}
                                    {comp.mapped_course_names &&
                                      comp.mapped_course_names.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {comp.mapped_course_names.map(
                                            (cName, idx) => (
                                              <span
                                                key={idx}
                                                className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 break-words leading-tight"
                                              >
                                                {cName}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      )}
                                  </td>
                                  <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-mono text-slate-700 align-top whitespace-nowrap text-[11px] sm:text-xs">
                                    <span className="font-semibold text-slate-900">
                                      Level {comp.target_level}
                                    </span>{" "}
                                    <span className="hidden sm:inline">
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
                                    </span>
                                  </td>
                                  <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 align-top whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[10px] sm:text-[11px] font-bold rounded border ${
                                        comp.assessed_level >= comp.target_level
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                          : "bg-amber-50 border-amber-300 text-amber-800"
                                      }`}
                                    >
                                      Level {comp.assessed_level}
                                    </span>
                                  </td>
                                  <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 align-top whitespace-nowrap">
                                    {isAchieved ? (
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                                          <CheckCircle2
                                            size={13}
                                            className="text-emerald-600 shrink-0"
                                          />
                                          <span>Met Benchmark</span>
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleStartAssessment(comp)
                                          }
                                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-[10px] sm:text-[11px] inline-flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                                          title="Take evaluation to advance level further"
                                        >
                                          <FileText
                                            size={11}
                                            className="text-slate-500 shrink-0"
                                          />
                                          <span>Re-evaluate</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="text-amber-800 font-semibold text-[10.5px] sm:text-[11px] flex items-center gap-1">
                                          <AlertCircle
                                            size={12}
                                            className="text-amber-600 shrink-0"
                                          />
                                          <span>Skill Gap</span>
                                        </span>
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <button
                                            onClick={() =>
                                              handleStartAssessment(comp)
                                            }
                                            className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded text-[10px] sm:text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          >
                                            <FileText
                                              size={11}
                                              className="shrink-0"
                                            />
                                            <span>Assess</span>
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleBridgeGap(comp)
                                            }
                                            className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-semibold rounded text-[10px] sm:text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                            title="Browse linked iGOT courses"
                                          >
                                            <span>Pathways</span>
                                            <ArrowUpRight
                                              size={11}
                                              className="shrink-0"
                                            />
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
            <div className="p-4 sm:p-5 rounded border border-slate-300 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-interactive">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 shrink-0">
                  <FileText size={20} className="animate-pulse-subtle" />
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
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all duration-200 btn-press"
              >
                <Upload size={14} />
                <span>Open Quiz Generator</span>
              </button>
            </div>

            <div className="bg-white border border-slate-300 rounded shadow-xs p-3 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5 mb-4 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      Mission Karmayogi Curriculum
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
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-all duration-200 w-56 sm:w-64"
                    />
                  </div>

                  <div className="flex items-center border border-slate-300 rounded overflow-hidden p-0.5 bg-slate-100 text-xs">
                    <button
                      onClick={() => setCourseFilter("all")}
                      className={`px-3 py-1 font-semibold rounded transition-all duration-200 cursor-pointer btn-press ${
                        courseFilter === "all"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({courses.length})
                    </button>
                    <button
                      onClick={() => setCourseFilter("enrolled")}
                      className={`px-3 py-1 font-semibold rounded transition-all duration-200 cursor-pointer btn-press ${
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
                    className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-all duration-200 btn-press"
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
                    className="px-2.5 py-1 bg-red-800 text-white rounded text-[11px] font-semibold cursor-pointer btn-press"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!coursesLoading &&
                courseFilter === "all" &&
                filteredRecommendations.length > 0 && (
                  <div className="mb-6 sm:mb-10 pb-5 sm:pb-8 border-b border-slate-200">
                    <div className="bg-slate-50 border border-slate-300 border-l-4 border-l-amber-600 p-3 sm:p-4 rounded-r mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs card-interactive">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1.5 sm:gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-semibold rounded uppercase tracking-wider w-fit">
                            <Compass
                              size={11}
                              className="text-amber-400 shrink-0"
                            />
                            Targeted Cadre Recommendations
                          </span>
                          <span className="text-[11px] font-mono text-amber-900 font-semibold pl-0.5 sm:pl-0">
                            {recommendationsData?.identified_gaps_count ||
                              filteredRecommendations.length}{" "}
                            Skill Gaps Identified
                          </span>
                        </div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
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
                        <span className="px-2.5 sm:px-3 py-1 bg-white border border-slate-300 text-slate-800 font-mono text-xs font-semibold rounded">
                          {filteredRecommendations.length} Targeted Courses
                        </span>
                      </div>
                    </div>

                    <div
                      key={`recs-${filteredRecommendations.length}`}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 animate-fade-in"
                    >
                      {filteredRecommendations.map((rec) => {
                        const course = rec.course;
                        const isActing = actionLoadingId === course.id;

                        return (
                          <div
                            key={`rec-${course.id}`}
                            className="flex flex-col justify-between h-full rounded border border-slate-300 bg-white hover:border-slate-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group card-interactive"
                          >
                            <div className="relative h-32 sm:h-36 bg-slate-900 overflow-hidden border-b border-slate-200 flex items-center justify-center">
                              {course.image ? (
                                <img
                                  src={course.image}
                                  alt={course.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                              <div className="absolute top-2.5 inset-x-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                                <span className="inline-flex items-center h-5 text-[10px] font-mono font-bold px-2 rounded bg-amber-500 text-slate-950 uppercase tracking-wider shadow-xs shrink-0">
                                  {rec.match_score}% Cadre Match
                                </span>
                                {rec.gap_severity > 0 && (
                                  <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded bg-slate-900/90 text-slate-200 border border-slate-700 uppercase tracking-wider shrink-0">
                                    L{rec.gap_severity} Gap
                                  </span>
                                )}
                                {course.difficulty_level && (
                                  <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded uppercase tracking-wider bg-slate-900/90 text-slate-200 border border-slate-700 shrink-0">
                                    {course.difficulty_level}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="bg-slate-50 border border-slate-200 rounded p-2 sm:p-2.5 mb-2 sm:mb-3 text-xs text-slate-800 transition-colors group-hover:bg-slate-100/70 min-w-0">
                                  <div className="flex items-start gap-1.5 font-bold text-[11px] text-blue-900 mb-0.5 min-w-0">
                                    <Target
                                      size={13}
                                      className="text-amber-600 shrink-0 mt-0.5"
                                    />
                                    <span className="break-words leading-tight">
                                      Target: {rec.targeted_competency}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans break-words">
                                    {rec.reason}
                                  </p>
                                </div>

                                {course.by && (
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5 break-words">
                                    {course.by}
                                  </span>
                                )}

                                <h4
                                  className="font-serif text-sm font-bold text-slate-900 mb-1 leading-snug group-hover:text-blue-900 transition-colors break-words"
                                  title={course.name}
                                >
                                  {course.name}
                                </h4>

                                {course.course_description && (
                                  <p className="text-xs text-slate-600 leading-relaxed mb-2 sm:mb-3 break-words">
                                    {course.course_description}
                                  </p>
                                )}

                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                                    {course.tags.slice(0, 3).map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors break-words"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 mt-2">
                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                  {course.duration != null && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={12} />
                                      {course.duration}h
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={12} />
                                    {course.enrollees || 0} Learners
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleEnroll(course)}
                                  disabled={isActing}
                                  className="w-full xs:w-auto px-3.5 py-2 xs:py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-1 disabled:opacity-50 shadow-xs btn-press"
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
                          className="mt-3 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded cursor-pointer transition-all duration-200 btn-press"
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
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 animate-fade-in"
                    >
                      {filteredCourses.map((course) => {
                        const isEnrolled = enrolledIds.includes(course.id);
                        const isActing = actionLoadingId === course.id;

                        return (
                          <div
                            key={course.id}
                            className={`flex flex-col justify-between h-full rounded border transition-all duration-300 hover:-translate-y-1 hover:shadow-md overflow-hidden group card-interactive ${
                              isEnrolled
                                ? "bg-white border-slate-300 border-t-4 border-t-emerald-700 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="relative h-32 sm:h-36 bg-slate-900 overflow-hidden border-b border-slate-200 flex items-center justify-center">
                              {course.image ? (
                                <img
                                  src={course.image}
                                  alt={course.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                              <div className="absolute top-2.5 inset-x-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                                {course.difficulty_level && (
                                  <span className="inline-flex items-center h-5 text-[10px] font-mono font-semibold px-2 rounded uppercase tracking-wider bg-slate-900/90 text-slate-200 border border-slate-700 shrink-0">
                                    {course.difficulty_level}
                                  </span>
                                )}

                                {isEnrolled && (
                                  <span className="inline-flex items-center gap-1 h-5 px-2 bg-emerald-700 text-white font-mono text-[10px] font-semibold rounded shadow-xs animate-badge-pop shrink-0">
                                    <CheckCircle2
                                      size={11}
                                      className="shrink-0"
                                    />
                                    Enrolled in Dossier
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                              <div>
                                {isEnrolled &&
                                  (() => {
                                    const enr = enrolledDetails.find(
                                      (e) => e.course.id === course.id,
                                    );
                                    const prog = enr?.progress || 0;
                                    const isComp = enr?.status === "completed";

                                    return (
                                      <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-2 mb-2.5 sm:mb-3 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-[10px] uppercase font-bold text-slate-700">
                                            Learning Progress
                                          </span>
                                          <span
                                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase transition-colors ${
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
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                              isComp
                                                ? "bg-emerald-600"
                                                : "bg-blue-900"
                                            }`}
                                            style={{ width: `${prog}%` }}
                                          />
                                        </div>

                                        {!isComp ? (
                                          <div className="space-y-2 pt-1 border-t border-slate-200">
                                            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                                              <span className="text-slate-600 font-medium">
                                                Track Progress:
                                              </span>
                                              <div className="flex items-center gap-1 shrink-0">
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
                                                    className={`px-2 py-0.5 rounded border transition-all duration-150 cursor-pointer btn-press ${
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
                                              className="w-full py-2 px-2.5 bg-radial from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-[11px] rounded inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all duration-200 btn-press text-center leading-tight"
                                            >
                                              <Award
                                                size={13}
                                                className="text-amber-300 shrink-0"
                                              />
                                              <span className="break-words">
                                                {progressUpdatingId ===
                                                course.id
                                                  ? "Elevating Competencies..."
                                                  : "Mark Completed & Auto-Upskill"}
                                              </span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="pt-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                                            <span className="text-emerald-800 font-bold inline-flex items-center gap-1">
                                              <CheckCircle2
                                                size={12}
                                                className="text-emerald-600 shrink-0"
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
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1 break-words">
                                    {course.by}
                                  </span>
                                )}

                                <h3
                                  className="font-serif text-sm font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-blue-900 transition-colors break-words"
                                  title={course.name}
                                >
                                  {course.name}
                                </h3>

                                {course.course_description && (
                                  <p className="text-xs text-slate-600 leading-relaxed mb-3 break-words">
                                    {course.course_description}
                                  </p>
                                )}

                                {course.tags && course.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {course.tags.slice(0, 3).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
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

                              <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 mt-2">
                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                  {course.duration != null && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={12} />
                                      {course.duration}h
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={12} />
                                    {course.enrollees || 0} Learners
                                  </span>
                                </div>

                                {isEnrolled ? (
                                  <div className="flex items-center gap-2 w-full xs:w-auto">
                                    <button
                                      onClick={() => handleUnenroll(course.id)}
                                      disabled={isActing}
                                      className="flex-1 xs:flex-initial px-2.5 py-1.5 border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold rounded cursor-pointer transition-all duration-200 disabled:opacity-50 btn-press text-center"
                                    >
                                      {isActing ? "Updating..." : "Unenroll"}
                                    </button>
                                    <a
                                      href="https://portal.igotkarmayogi.gov.in"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex-1 xs:flex-initial px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded inline-flex items-center justify-center gap-1 shadow-xs transition-all duration-200 btn-press"
                                    >
                                      <span>Launch</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEnroll(course)}
                                    disabled={isActing}
                                    className="w-full xs:w-auto px-3.5 py-2 xs:py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-1 disabled:opacity-50 shadow-xs btn-press"
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

      {/* Floating Karmayogi AI Learning Mentor Pill (Bottom Right) */}
      <AIChatPill onCourseEnrolled={handleAICourseEnrolled} />
    </div>
  );
};
