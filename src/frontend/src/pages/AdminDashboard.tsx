import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AdminSummaryResponse,
  type OfficerCadreItem,
  type OfficerDrilldownResponse,
  type AdminCertificationItem,
  type AdminCoursePayload,
} from "../services/admin";
import {
  competencyService,
  type CompetencyItem,
} from "../services/competencies";
import {
  CertificateModal,
  type CertificateDetails,
} from "../components/CertificateModal";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  ShieldCheck,
  Building2,
  Users,
  Award,
  Search,
  CheckCircle2,
  ChevronRight,
  Plus,
  RotateCw,
  LogOut,
  User,
  BarChart3,
  X,
  Download,
  Menu,
  ChevronDown,
  Check,
} from "lucide-react";

const AnimatedDots: React.FC<{ color?: string }> = ({
  color = "bg-slate-400",
}) => (
  <span className="inline-flex items-center gap-1 py-1.5 px-0.5">
    <span
      className={`w-1.5 h-1.5 ${color} rounded-full animate-bounce [animation-delay:-0.3s]`}
    />
    <span
      className={`w-1.5 h-1.5 ${color} rounded-full animate-bounce [animation-delay:-0.15s]`}
    />
    <span className={`w-1.5 h-1.5 ${color} rounded-full animate-bounce`} />
  </span>
);

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "overview" | "roster" | "certifications"
  >("overview");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState<boolean>(false);

  const [summaryData, setSummaryData] = useState<AdminSummaryResponse | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [officers, setOfficers] = useState<OfficerCadreItem[]>([]);
  const [officersLoading, setOfficersLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedCadre, setSelectedCadre] = useState<string>("all");
  const [gapFilter, setGapFilter] = useState<string>("all");
  const [openRosterDropdown, setOpenRosterDropdown] = useState<
    "cadre" | "dept" | "gap" | null
  >(null);

  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(
    null,
  );
  const [officerDetail, setOfficerDetail] =
    useState<OfficerDrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);

  const [overrideCompId, setOverrideCompId] = useState<number | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<number>(3);
  const [overrideRemarks, setOverrideRemarks] = useState<string>("");
  const [overrideSaving, setOverrideSaving] = useState<boolean>(false);

  const [certifications, setCertifications] = useState<
    AdminCertificationItem[]
  >([]);
  const [certsLoading, setCertsLoading] = useState<boolean>(false);
  const [certSearch, setCertSearch] = useState<string>("");

  const [selectedCertDetails, setSelectedCertDetails] =
    useState<CertificateDetails | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  const [masterCompetencies, setMasterCompetencies] = useState<
    CompetencyItem[]
  >([]);
  const [masterCompetenciesLoading, setMasterCompetenciesLoading] =
    useState<boolean>(false);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [courseFormData, setCourseFormData] = useState<AdminCoursePayload>({
    name: "",
    by: "National Statistical Systems Training Academy (NSSTA)",
    duration: 10,
    difficulty_level: "Intermediate",
    tags: ["Official Statistics", "FRAC"],
    course_description: "",
    mapped_competency_ids: [],
  });
  const [courseSaving, setCourseSaving] = useState<boolean>(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [compSearchQuery, setCompSearchQuery] = useState<string>("");
  const [createdCourseSuccess, setCreatedCourseSuccess] = useState<{
    id: number;
    name: string;
    by?: string;
    duration?: number;
    difficulty_level?: string;
    mapped_count: number;
  } | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await adminService.getSummary();
      setSummaryData(data);
    } catch (err: unknown) {
      console.error("Failed to load admin summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchOfficers = useCallback(async () => {
    try {
      setOfficersLoading(true);
      const data = await adminService.getCadreOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    } finally {
      setOfficersLoading(false);
    }
  }, []);

  const filteredOfficers = officers.filter((officer) => {
    if (
      selectedDept !== "all" &&
      officer.department.toLowerCase() !== selectedDept.toLowerCase()
    ) {
      return false;
    }
    if (
      selectedCadre !== "all" &&
      officer.cadre_type.toLowerCase() !== selectedCadre.toLowerCase()
    ) {
      return false;
    }
    if (gapFilter === "gaps_only" && officer.gap_count === 0) return false;
    if (gapFilter === "urgent_only" && officer.urgent_gap_count === 0)
      return false;
    if (gapFilter === "achieved_only" && officer.gap_count > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = officer.name.toLowerCase().includes(q);
      const inUser = officer.username.toLowerCase().includes(q);
      const inDesig = (officer.designation || "").toLowerCase().includes(q);
      const inDept = (officer.department || "").toLowerCase().includes(q);
      return inName || inUser || inDesig || inDept;
    }
    return true;
  });

  const fetchCertifications = useCallback(async () => {
    try {
      setCertsLoading(true);
      const data = await adminService.getCertificationsRegistry();
      setCertifications(data);
    } catch (err) {
      console.error("Failed to load certifications:", err);
    } finally {
      setCertsLoading(false);
    }
  }, []);

  const fetchMasterCompetencies = useCallback(async () => {
    if (masterCompetencies.length > 0) return;
    try {
      setMasterCompetenciesLoading(true);
      const data = await competencyService.getUserMatrix("all");
      if (data && data.items) {
        setMasterCompetencies(data.items);
      }
    } catch (err) {
      console.error("Failed to load master competencies:", err);
    } finally {
      setMasterCompetenciesLoading(false);
    }
  }, [masterCompetencies.length]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchSummary(), fetchOfficers()]);
    };
    loadInitialData();
  }, [fetchSummary, fetchOfficers]);

  useEffect(() => {
    if (activeTab === "certifications" && certifications.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCertifications();
    }
  }, [activeTab, certifications.length, fetchCertifications]);

  const handleOpenOfficerDrilldown = async (officerId: number) => {
    try {
      setSelectedOfficerId(officerId);
      setDrilldownLoading(true);
      const detail = await adminService.getOfficerDrilldown(officerId);
      setOfficerDetail(detail);
    } catch (err) {
      console.error("Failed to load officer drilldown:", err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleSaveCompetencyOverride = async () => {
    if (!selectedOfficerId || !overrideCompId) return;
    try {
      setOverrideSaving(true);
      await adminService.updateOfficerCompetency(
        selectedOfficerId,
        overrideCompId,
        overrideLevel,
        overrideRemarks,
      );
      const updated = await adminService.getOfficerDrilldown(selectedOfficerId);
      setOfficerDetail(updated);
      setOverrideCompId(null);
      fetchSummary();
      fetchOfficers();
    } catch (err) {
      console.error("Failed to override competency:", err);
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError(null);
    try {
      setCourseSaving(true);
      const created = await adminService.createCourse(courseFormData);
      setCreatedCourseSuccess({
        id: created.id,
        name: created.name || courseFormData.name,
        by:
          created.by ||
          courseFormData.by ||
          "National Statistical Systems Training Academy (NSSTA)",
        duration: created.duration || courseFormData.duration || 10,
        difficulty_level:
          created.difficulty_level ||
          courseFormData.difficulty_level ||
          "Intermediate",
        mapped_count: courseFormData.mapped_competency_ids?.length || 0,
      });
      setIsCourseModalOpen(false);
      setCourseFormData({
        name: "",
        by: "National Statistical Systems Training Academy (NSSTA)",
        duration: 10,
        difficulty_level: "Intermediate",
        tags: ["Official Statistics", "FRAC"],
        course_description: "",
        mapped_competency_ids: [],
      });
      fetchSummary();
      fetchOfficers();
    } catch (err: unknown) {
      console.error("Failed to create course:", err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setCourseError(
        axiosErr?.response?.data?.detail ||
          "Failed to publish course. Please check all fields and try again.",
      );
    } finally {
      setCourseSaving(false);
    }
  };

  const filteredCerts = certifications.filter((cert) => {
    if (!certSearch.trim()) return true;
    const q = certSearch.toLowerCase();
    return (
      cert.certificate_id.toLowerCase().includes(q) ||
      cert.user_name.toLowerCase().includes(q) ||
      cert.course_name.toLowerCase().includes(q) ||
      cert.user_department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <header className="bg-slate-950 text-white border-b-2 border-amber-600 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-3">
            <img
              src="/favicon.svg"
              alt="National Emblem"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400 truncate">
                  Government of India{" "}
                  <span className="hidden md:inline">• भारत सरकार</span>
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[9px] uppercase font-bold rounded shrink-0">
                  Admin Console
                </span>
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-slate-200 truncate">
                Ministry of Statistics & Programme Implementation{" "}
                <span className="hidden md:inline">• Cadre Governance</span>
              </span>
            </div>
          </div>

          {/* Mobile Navigation Dropdown Menu (< sm) */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs btn-press"
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
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-slate-950/98 backdrop-blur-md border border-slate-800 text-white rounded-xl shadow-2xl ring-1 ring-slate-800 p-1.5 space-y-1 animate-scale-in">
                    {/* Admin User Header */}
                    <div className="px-2.5 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">
                        {user?.name || "Administrator"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400 truncate">
                          @{user?.username || "admin"}
                        </span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold rounded uppercase">
                          Admin
                        </span>
                      </div>
                    </div>

                    {/* Switch to Officer Portal */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-300 hover:bg-slate-900 transition-colors cursor-pointer text-left"
                    >
                      <User size={14} className="text-blue-400 shrink-0" />
                      <span>Officer Portal</span>
                    </button>

                    {/* Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        navigate("/login");
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
          </div>

          {/* Desktop Action Buttons (>= sm) */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 border border-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <User size={13} />
              <span>Officer Portal</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/80 border border-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium ml-1">
                  <ShieldCheck size={14} /> NSSTA / DoPT Synchronized
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                MoSPI Human Resource & Training Governance
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Macro-level competency analytics, divisional skill readiness
                heatmaps, cadre directory, and iGOT Karmayogi learning loop
                enforcement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => {
                  fetchSummary();
                  fetchOfficers();
                  fetchCertifications();
                }}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs btn-press"
                title="Refresh Analytics"
              >
                <RotateCw
                  size={14}
                  className={`shrink-0 ${summaryLoading ? "animate-spin text-blue-900 dark:text-blue-400" : ""}`}
                />
                <span>Sync Data</span>
              </button>

              <button
                onClick={() => {
                  setCourseError(null);
                  setCompSearchQuery("");
                  fetchMasterCompetencies();
                  setIsCourseModalOpen(true);
                }}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press"
              >
                <Plus size={15} className="shrink-0" />
                <span>Curate Course</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown (< sm) - Custom shadcn-styled Dropdown */}
          <div className="sm:hidden px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-b border-slate-200 dark:border-slate-800 relative">
            {(() => {
              const adminTabs = [
                {
                  id: "overview" as const,
                  label: "Macro Overview & Heatmap",
                  sublabel: "National skill metrics & division heatmap",
                  icon: BarChart3,
                },
                {
                  id: "roster" as const,
                  label: "Cadre Officers Roster",
                  sublabel: "Individual officer competency scores",
                  icon: Users,
                },
                {
                  id: "certifications" as const,
                  label: "Credentials & Badge Registry",
                  sublabel: "Verified certifications & micro-credentials",
                  icon: Award,
                },
              ];

              const currentTab =
                adminTabs.find((t) => t.id === activeTab) || adminTabs[0];
              const CurrentIcon = currentTab.icon;

              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNavDropdownOpen((prev) => !prev)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 shadow-2xs flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer btn-press text-left"
                    aria-expanded={isNavDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                        <CurrentIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight">
                          {currentTab.label}
                        </span>
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                          {currentTab.sublabel}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isNavDropdownOpen
                          ? "rotate-180 text-amber-900 dark:text-amber-400"
                          : ""
                      }`}
                    />
                  </button>

                  {isNavDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNavDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-800 p-1.5 space-y-1 animate-scale-in">
                        <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                          Select Admin View
                        </div>
                        {adminTabs.map((tab) => {
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
                              className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 shadow-xs font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-slate-800 dark:bg-slate-700 text-amber-400 border border-slate-700"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  <TabIcon size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-bold block leading-tight">
                                    {tab.label}
                                  </span>
                                  <span
                                    className={`text-[10.5px] block leading-snug mt-0.5 ${
                                      isSelected
                                        ? "text-slate-300 dark:text-slate-400"
                                        : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    {tab.sublabel}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <Check
                                  size={15}
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
          <div className="hidden sm:flex px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-b border-slate-200 dark:border-slate-800 items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
                  activeTab === "overview"
                    ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 border-slate-900 dark:border-slate-700 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 size={13} />
                <span>Macro Overview & Heatmap</span>
              </button>

              <button
                onClick={() => setActiveTab("roster")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
                  activeTab === "roster"
                    ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 border-slate-900 dark:border-slate-700 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Users size={13} />
                <span>Cadre Officers Roster</span>
              </button>

              <button
                onClick={() => setActiveTab("certifications")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all duration-200 shrink-0 inline-flex items-center gap-1.5 btn-press ${
                  activeTab === "certifications"
                    ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 border-slate-900 dark:border-slate-700 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Award size={13} />
                <span>Credentials & Badge Registry</span>
              </button>
            </div>

            <span className="hidden lg:inline-block text-[11px] font-mono text-slate-500 dark:text-slate-400">
              National Statistical Systems Training Academy (NSSTA)
            </span>
          </div>

          <div className="p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 bg-slate-50/40 dark:bg-slate-950/40">
            {/* 1. Ministry Skill Index */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-lg shadow-2xs card-interactive min-w-0 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 leading-snug">
                Ministry Skill Index
              </span>
              <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                  {summaryData ? (
                    `${summaryData.ministry_skill_index}%`
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-slate-500" />
                  ) : (
                    "78.4%"
                  )}
                </span>
              </div>
            </div>

            {/* 2. Total Officers */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-lg shadow-2xs card-interactive min-w-0 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 leading-snug">
                Total Officers
              </span>
              <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                  {summaryData ? (
                    summaryData.total_officers
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-slate-500" />
                  ) : (
                    "0"
                  )}
                </span>
              </div>
            </div>

            {/* 3. Training Velocity */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-lg shadow-2xs card-interactive min-w-0 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 leading-snug">
                Training Velocity
              </span>
              <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 leading-none">
                  {summaryData ? (
                    `${summaryData.completion_rate}%`
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-emerald-600" />
                  ) : (
                    "0%"
                  )}
                </span>
              </div>
            </div>

            {/* 4. Verified Badges Issued */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-lg shadow-2xs card-interactive min-w-0 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 leading-snug">
                Verified Badges
              </span>
              <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-400 leading-none">
                  {summaryData ? (
                    summaryData.total_certifications_issued
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-blue-700" />
                  ) : (
                    "0"
                  )}
                </span>
              </div>
            </div>

            {/* 5. Urgent Deficits */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-lg shadow-2xs card-interactive min-w-0 col-span-2 sm:col-span-1 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 leading-snug">
                Urgent Deficits
              </span>
              <div className="flex items-baseline justify-between gap-1 flex-wrap pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 leading-none">
                  {summaryData ? (
                    summaryData.urgent_gaps_count
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-amber-600" />
                  ) : (
                    "0"
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {activeTab === "overview" && (
          <div key="admin-tab-overview" className="animate-tab-enter space-y-6">
            {summaryLoading && !summaryData ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-8" />
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-6" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
                    <div className="space-y-1.5">
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-64" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-80" />
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48 hidden sm:block" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                        <tr>
                          <th className="p-3.5">Division / Department</th>
                          <th className="p-3.5 text-center">Officers</th>
                          <th className="p-3.5">Readiness Index</th>
                          <th className="p-3.5 text-center">
                            Achieved Benchmarks
                          </th>
                          <th className="p-3.5 text-center">Active Gaps</th>
                          <th className="p-3.5 text-center">Urgent Deficits</th>
                          <th className="p-3.5 text-center">
                            Course Completion
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {[1, 2, 3, 4, 5].map((row) => (
                          <tr key={row}>
                            <td className="p-3.5">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-44" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-10" />
                                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-10 mx-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {summaryData?.cadre_distribution.map((cadre, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 rounded shadow-2xs flex flex-col justify-between card-interactive"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">
                            {cadre.cadre_group}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] rounded font-semibold">
                            {cadre.officer_count} Officers
                          </span>
                        </div>
                        <div className="space-y-2 mt-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600 dark:text-slate-400">
                                Average Readiness:
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {cadre.average_skill_index}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-900 dark:bg-blue-500 rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${cadre.average_skill_index}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400">
                              Urgent Gaps:
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                cadre.urgent_gaps_count > 0
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-emerald-700 dark:text-emerald-400"
                              }`}
                            >
                              {cadre.urgent_gaps_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden card-interactive">
                  <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                        <Building2 size={18} className="shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          Divisional Competency Readiness Matrix
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Skill fulfillment indices and training velocity across
                          MoSPI operating divisions.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <div className="w-2.5 h-2.5 bg-emerald-600 rounded-xs shrink-0" />
                        <span>&ge; 80% Benchmark</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-xs shrink-0" />
                        <span>60-79% Moderate</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-xs shrink-0" />
                        <span>&lt; 60% Critical</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Row Cards View (< md) */}
                  <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                    {summaryData?.divisional_readiness.map((div, idx) => {
                      const isHigh = div.average_skill_index >= 80;
                      const isMedium =
                        div.average_skill_index >= 60 &&
                        div.average_skill_index < 80;
                      const badgeColor = isHigh
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : isMedium
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800";
                      const barColor = isHigh
                        ? "bg-emerald-600 dark:bg-emerald-500"
                        : isMedium
                          ? "bg-amber-500 dark:bg-amber-400"
                          : "bg-red-600 dark:bg-red-500";

                      return (
                        <div
                          key={idx}
                          className="p-4 space-y-3 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          {/* Row 1: Division Name & Readiness Index Badge */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Division
                              </span>
                              <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-white leading-snug wrap-break-word">
                                {div.division}
                              </h4>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${badgeColor}`}
                              >
                                {div.average_skill_index}%
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                Readiness
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                              style={{ width: `${div.average_skill_index}%` }}
                            />
                          </div>

                          {/* Stats Grid Rows */}
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                            <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                Officers:
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {div.total_officers}
                              </span>
                            </div>

                            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                              <span className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                                Achieved:
                              </span>
                              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                                {div.achieved_benchmarks}
                              </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                Active Gaps:
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {div.active_gaps}
                              </span>
                            </div>

                            <div
                              className={`p-2 rounded border flex items-center justify-between ${
                                div.urgent_gaps > 0
                                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300"
                                  : "bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <span className="text-[11px]">
                                Urgent Deficits:
                              </span>
                              <span className="font-bold">
                                {div.urgent_gaps}
                              </span>
                            </div>
                          </div>

                          {/* Row 4: Course Completion */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                              iGOT Course Completion:
                            </span>
                            <span className="font-bold text-blue-900 dark:text-blue-400">
                              {div.completion_rate}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                        <tr>
                          <th className="p-3.5">Division / Department</th>
                          <th className="p-3.5 text-center">Officers</th>
                          <th className="p-3.5">Readiness Index</th>
                          <th className="p-3.5 text-center">
                            Achieved Benchmarks
                          </th>
                          <th className="p-3.5 text-center">Active Gaps</th>
                          <th className="p-3.5 text-center">Urgent Deficits</th>
                          <th className="p-3.5 text-center">
                            Course Completion
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {summaryData?.divisional_readiness.map((div, idx) => {
                          const badgeColor =
                            div.average_skill_index >= 80
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : div.average_skill_index >= 60
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800";

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150"
                            >
                              <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                                {div.division}
                              </td>
                              <td className="p-3.5 text-center font-mono font-medium">
                                {div.total_officers}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5 min-w-[180px]">
                                  <span
                                    className={`w-14 text-center px-1.5 py-0.5 rounded border font-mono font-bold text-xs shadow-2xs shrink-0 ${badgeColor}`}
                                  >
                                    {div.average_skill_index}%
                                  </span>
                                  <div className="w-28 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                                        div.average_skill_index >= 80
                                          ? "bg-emerald-600 dark:bg-emerald-500"
                                          : div.average_skill_index >= 60
                                            ? "bg-amber-500 dark:bg-amber-400"
                                            : "bg-red-600 dark:bg-red-500"
                                      }`}
                                      style={{
                                        width: `${div.average_skill_index}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-center font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                                {div.achieved_benchmarks}
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-700 dark:text-slate-300">
                                {div.active_gaps}
                              </td>
                              <td className="p-3.5 text-center font-mono">
                                {div.urgent_gaps > 0 ? (
                                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-bold rounded animate-pulse-subtle">
                                    {div.urgent_gaps}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    0
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-center font-mono font-semibold text-blue-900 dark:text-blue-400">
                                {div.completion_rate}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "roster" && (
          <div
            key="admin-tab-roster"
            className="animate-tab-enter bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search officers by name, cadre ID, designation, or division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchOfficers()}
                  className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-blue-900 dark:focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* 3 Custom Shadcn-Styled Dropdowns */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                {/* 1. Cadre Dropdown */}
                <div className="relative w-full sm:w-auto">
                  {(() => {
                    const cadreOptions = [
                      { id: "all", label: "All Cadres" },
                      {
                        id: "ISS (Indian Statistical Service)",
                        label: "ISS Cadre",
                      },
                      {
                        id: "SSS (Subordinate Statistical Service)",
                        label: "SSS Cadre",
                      },
                      {
                        id: "DES (State Statistical Cadre)",
                        label: "State DES Cadre",
                      },
                    ];
                    const cur =
                      cadreOptions.find((c) => c.id === selectedCadre) ||
                      cadreOptions[0];

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRosterDropdown((prev) =>
                              prev === "cadre" ? null : "cadre",
                            )
                          }
                          className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-900 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer btn-press text-left"
                          aria-expanded={openRosterDropdown === "cadre"}
                        >
                          <span className="truncate">{cur.label}</span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                              openRosterDropdown === "cadre"
                                ? "rotate-180 text-blue-900 dark:text-blue-400"
                                : ""
                            }`}
                          />
                        </button>

                        {openRosterDropdown === "cadre" && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenRosterDropdown(null)}
                            />
                            <div className="absolute top-full left-0 right-0 sm:right-auto sm:min-w-[190px] mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-800 p-1 space-y-0.5 animate-scale-in">
                              {cadreOptions.map((opt) => {
                                const isSelected = selectedCadre === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCadre(opt.id);
                                      setOpenRosterDropdown(null);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                      </>
                    );
                  })()}
                </div>

                {/* 2. Department / Division Dropdown */}
                <div className="relative w-full sm:w-auto">
                  {(() => {
                    const deptOptions = [
                      { id: "all", label: "All Divisions" },
                      {
                        id: "National Accounts Division (NAD)",
                        label: "National Accounts (NAD)",
                      },
                      {
                        id: "Field Operations Division (FOD)",
                        label: "Field Operations (FOD)",
                      },
                      {
                        id: "Economic Statistics Division (ESD)",
                        label: "Economic Statistics (ESD)",
                      },
                      {
                        id: "Data Quality & Assurance (DQAD)",
                        label: "Data Quality (DQAD)",
                      },
                      {
                        id: "Social Statistics Division (SSD)",
                        label: "Social Statistics (SSD)",
                      },
                    ];
                    const cur =
                      deptOptions.find((d) => d.id === selectedDept) ||
                      deptOptions[0];

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRosterDropdown((prev) =>
                              prev === "dept" ? null : "dept",
                            )
                          }
                          className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-900 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer btn-press text-left"
                          aria-expanded={openRosterDropdown === "dept"}
                        >
                          <span className="truncate">{cur.label}</span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                              openRosterDropdown === "dept"
                                ? "rotate-180 text-blue-900 dark:text-blue-400"
                                : ""
                            }`}
                          />
                        </button>

                        {openRosterDropdown === "dept" && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenRosterDropdown(null)}
                            />
                            <div className="absolute top-full left-0 right-0 sm:right-auto sm:min-w-[210px] mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-800 p-1 space-y-0.5 animate-scale-in">
                              {deptOptions.map((opt) => {
                                const isSelected = selectedDept === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDept(opt.id);
                                      setOpenRosterDropdown(null);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                      </>
                    );
                  })()}
                </div>

                {/* 3. Gap Filter Dropdown */}
                <div className="relative w-full sm:w-auto">
                  {(() => {
                    const gapOptions = [
                      { id: "all", label: "All Gap Statuses" },
                      { id: "urgent_only", label: "Urgent Deficits Only" },
                      { id: "gaps_only", label: "Has Active Gaps" },
                      { id: "achieved_only", label: "Benchmark Achieved" },
                    ];
                    const cur =
                      gapOptions.find((g) => g.id === gapFilter) ||
                      gapOptions[0];

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRosterDropdown((prev) =>
                              prev === "gap" ? null : "gap",
                            )
                          }
                          className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-900 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer btn-press text-left"
                          aria-expanded={openRosterDropdown === "gap"}
                        >
                          <span className="truncate">{cur.label}</span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                              openRosterDropdown === "gap"
                                ? "rotate-180 text-blue-900 dark:text-blue-400"
                                : ""
                            }`}
                          />
                        </button>

                        {openRosterDropdown === "gap" && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenRosterDropdown(null)}
                            />
                            <div className="absolute top-full left-0 right-0 sm:right-auto sm:min-w-[190px] mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-800 p-1 space-y-0.5 animate-scale-in">
                              {gapOptions.map((opt) => {
                                const isSelected = gapFilter === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setGapFilter(opt.id);
                                      setOpenRosterDropdown(null);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Mobile Row Cards View (< md) */}
            <div className="md:hidden p-2.5 space-y-2.5 bg-slate-100/50 dark:bg-slate-950/50">
              {officersLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3 space-y-2 animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs"
                  >
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-blue-100 dark:bg-blue-950 rounded w-12" />
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    <div className="space-y-1.5 pt-1">
                      <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </div>
                ))
              ) : filteredOfficers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  No officers matching current search/filter criteria.
                </div>
              ) : (
                filteredOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    className="p-3 space-y-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xs hover:border-slate-400 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Row 1: Officer Name, Username & Skill Index Badge */}
                    <div className="flex items-start justify-between gap-2.5 min-w-0 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug wrap-break-word">
                          {officer.name}
                        </h4>
                        <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400 block truncate">
                          @{officer.username}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-mono font-bold text-xs rounded shadow-2xs">
                          {officer.composite_skill_index}%
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          Skill Index
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Cadre, Designation & Department (Clean Text) */}
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {officer.designation || "Statistical Officer"}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          •
                        </span>
                        <span className="font-mono text-[11px] text-blue-900 dark:text-blue-400 font-semibold">
                          {officer.cadre_type}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-[11.5px] wrap-break-word">
                        {officer.department}
                      </div>
                    </div>

                    {/* Row 3: Stacked Metrics (Skill Gaps and Courses Done one below another) */}
                    <div className="space-y-1.5 text-xs font-mono">
                      <div
                        className={`px-2.5 py-1.5 rounded border flex items-center justify-between shadow-2xs ${
                          officer.urgent_gap_count > 0
                            ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-300"
                            : officer.gap_count > 0
                              ? "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                              : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        <span className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          Skill Gaps:
                        </span>
                        <span className="font-bold text-[11px]">
                          {officer.urgent_gap_count > 0
                            ? `${officer.gap_count} (${officer.urgent_gap_count} Urgent)`
                            : officer.gap_count > 0
                              ? `${officer.gap_count} Gaps Identified`
                              : "All Benchmarks Met"}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded flex items-center justify-between shadow-2xs">
                        <span className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          iGOT Courses:
                        </span>
                        <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                          {officer.completed_count} Done /{" "}
                          {officer.enrolled_count} Enrolled
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Action Button */}
                    <button
                      onClick={() => handleOpenOfficerDrilldown(officer.id)}
                      className="w-full py-1.5 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs btn-press"
                    >
                      <span>Inspect & Audit Officer Dossier</span>
                      <ChevronRight size={13} className="shrink-0" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">Officer Name & Cadre ID</th>
                    <th className="p-3.5">Cadre & Designation</th>
                    <th className="p-3.5">Division / Department</th>
                    <th className="p-3.5 text-center">Skill Index</th>
                    <th className="p-3.5 text-center">Gaps (Urgent)</th>
                    <th className="p-3.5 text-center">Courses (Completed)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {officersLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5 space-y-1.5">
                          <div className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded w-36" />
                          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                        </td>
                        <td className="p-3.5 space-y-1.5">
                          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-32" />
                          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                        </td>
                        <td className="p-3.5 space-y-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-40" />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                            <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full hidden sm:block" />
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto" />
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredOfficers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono"
                      >
                        No officers matching current search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOfficers.map((officer) => (
                      <tr
                        key={officer.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150"
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {officer.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            @{officer.username}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {officer.designation}
                          </span>
                          <span className="font-mono text-[10px] text-blue-900 dark:text-blue-400 font-semibold">
                            {officer.cadre_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300">
                          {officer.department}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-mono font-bold text-xs rounded shadow-2xs whitespace-nowrap">
                            {officer.composite_skill_index}%
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {officer.urgent_gap_count > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold rounded text-xs whitespace-nowrap shadow-2xs">
                              {officer.gap_count} ({officer.urgent_gap_count}{" "}
                              urgent)
                            </span>
                          ) : officer.gap_count > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold rounded text-xs whitespace-nowrap shadow-2xs">
                              {officer.gap_count} gaps
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold rounded text-xs whitespace-nowrap shadow-2xs">
                              All Met
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-medium rounded text-xs whitespace-nowrap shadow-2xs">
                            {officer.enrolled_count} ({officer.completed_count}{" "}
                            done)
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() =>
                              handleOpenOfficerDrilldown(officer.id)
                            }
                            className="px-3 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-xs btn-press whitespace-nowrap"
                          >
                            <span>Inspect & Audit</span>
                            <ChevronRight size={12} className="shrink-0" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div
            key="admin-tab-certifications"
            className="animate-tab-enter bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                  <Award size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    iGOT Karmayogi • MoSPI Certification Registry
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Immutable register of verified digital badges and
                    cryptographic completion credentials issued to officers.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-72 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Verify Certificate ID or Officer..."
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-blue-900 dark:focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Mobile Row Cards View (< md) */}
            <div className="md:hidden p-2.5 space-y-2.5 bg-slate-100/50 dark:bg-slate-950/50">
              {certsLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3 space-y-2 animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs"
                  >
                    <div className="flex justify-between">
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-emerald-100 dark:bg-emerald-950 rounded w-16" />
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </div>
                ))
              ) : filteredCerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  No certificates match your search.
                </div>
              ) : (
                filteredCerts.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-3 space-y-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xs hover:border-slate-400 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Row 1: Certificate ID & Verified Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="min-w-0">
                        <span className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Certificate ID
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white select-all break-all">
                          {cert.certificate_id}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-semibold rounded shrink-0">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    </div>

                    {/* Row 2: Officer & Cadre Details */}
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white text-xs block">
                        {cert.user_name}
                      </span>
                      <div className="text-slate-600 dark:text-slate-400 text-[11px] wrap-break-word">
                        {cert.user_designation} • {cert.user_department}
                      </div>
                    </div>

                    {/* Row 3: Course & Badge Info */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs space-y-1 shadow-2xs">
                      <div>
                        <span className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Accredited Course & Badge
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white text-xs block mt-0.5 wrap-break-word">
                          {cert.course_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800 font-mono text-[11px]">
                        <span className="text-amber-800 dark:text-amber-300 font-semibold truncate">
                          {cert.badge_name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] shrink-0">
                          {new Date(cert.completed_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Download PDF Action */}
                    <button
                      onClick={() => {
                        setSelectedCertDetails({
                          certificateId: cert.certificate_id,
                          officerName: cert.user_name,
                          officerDesignation: cert.user_designation,
                          officerDepartment: cert.user_department,
                          courseName: cert.course_name,
                          badgeName: cert.badge_name,
                          completedAt: cert.completed_at,
                        });
                        setIsCertModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-slate-950 dark:hover:text-slate-950 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 rounded text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs btn-press"
                      title="View & Download Official Certificate"
                    >
                      <Download size={13} className="shrink-0" />
                      <span>View & Download Certificate PDF</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">Certificate ID</th>
                    <th className="p-3.5">Officer</th>
                    <th className="p-3.5">Cadre & Department</th>
                    <th className="p-3.5">Accredited Course / Badge</th>
                    <th className="p-3.5 text-center">Issued Date</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {certsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                        </td>
                        <td className="p-3.5">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                        </td>
                        <td className="p-3.5 space-y-1">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                        </td>
                        <td className="p-3.5 space-y-1">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-44" />
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-4 bg-emerald-100/60 dark:bg-emerald-950/60 rounded w-16 mx-auto" />
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredCerts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono"
                      >
                        No certificates match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCerts.map((cert, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150"
                      >
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white select-all">
                          {cert.certificate_id}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          {cert.user_name}
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-800 dark:text-slate-200 block">
                            {cert.user_designation}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cert.user_department}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {cert.course_name}
                          </div>
                          <div className="text-[10px] font-mono text-amber-800 dark:text-amber-300">
                            {cert.badge_name}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                          {new Date(cert.completed_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-semibold rounded animate-badge-pop">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedCertDetails({
                                certificateId: cert.certificate_id,
                                officerName: cert.user_name,
                                officerDesignation: cert.user_designation,
                                officerDepartment: cert.user_department,
                                courseName: cert.course_name,
                                badgeName: cert.badge_name,
                                completedAt: cert.completed_at,
                              });
                              setIsCertModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-slate-950 dark:hover:text-slate-950 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-2xs btn-press"
                            title="View & Download Official Certificate"
                          >
                            <Download size={12} />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedOfficerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-modal-enter">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block truncate">
                  MoSPI Cadre Audit & Competency Inspection
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white truncate">
                  {officerDetail?.officer.name || "Officer Inspection Dossier"}
                </h3>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {officerDetail?.officer.designation || "Officer"} •{" "}
                  {officerDetail?.officer.department || "MoSPI Cadre"}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedOfficerId(null);
                  setOfficerDetail(null);
                  setOverrideCompId(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors btn-press shrink-0 cursor-pointer"
                title="Close Inspector"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
              {drilldownLoading ? (
                <div className="space-y-5 animate-pulse">
                  {/* 4 Stat Cards Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2.5"
                      >
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                        <div className="flex justify-between items-baseline pt-1">
                          <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-16" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Competencies Table Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-52 mb-2" />
                    {/* Mobile Skeletons */}
                    <div className="md:hidden space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                          </div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                          <div className="space-y-1.5">
                            <div className="h-7 bg-slate-100 dark:bg-slate-700 rounded" />
                            <div className="h-7 bg-slate-100 dark:bg-slate-700 rounded" />
                          </div>
                          <div className="h-7 bg-slate-200 dark:bg-slate-600 rounded w-full" />
                        </div>
                      ))}
                    </div>

                    {/* Desktop Skeletons */}
                    <div className="hidden md:block border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                      <div className="h-9 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600" />
                      <div className="divide-y divide-slate-100 dark:divide-slate-700 p-2 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 gap-2"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                            </div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14 shrink-0" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14 shrink-0" />
                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16 shrink-0" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Courses Grid Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3"
                        >
                          <div className="flex justify-between">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                            <div className="h-3.5 bg-blue-100 dark:bg-blue-950 rounded w-14" />
                          </div>
                          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/3 pt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : officerDetail ? (
                <>
                  {/* 4 Responsive Metric Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* 1. Composite Skill Index */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 truncate">
                        Composite Skill Index
                      </span>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                          {officerDetail.composite_skill_index}%
                        </span>
                        <span className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                          Benchmark Met
                        </span>
                      </div>
                    </div>

                    {/* 2. Cadre Classification */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 truncate">
                        Cadre Classification
                      </span>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-400 leading-snug wrap-break-word">
                          {officerDetail.cadre_type || "Cadre"}
                        </span>
                      </div>
                    </div>

                    {/* 3. Active Skill Gaps */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 truncate">
                        Active Skill Gaps
                      </span>
                      <div className="flex items-baseline justify-between gap-1 flex-wrap">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 leading-none">
                          {officerDetail.gap_count}
                        </span>
                        <span className="text-[10.5px] font-mono text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                          {officerDetail.urgent_gap_count > 0
                            ? `${officerDetail.urgent_gap_count} Urgent`
                            : "No Urgent Gaps"}
                        </span>
                      </div>
                    </div>

                    {/* 4. Verified Credentials */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 truncate">
                        Verified Credentials
                      </span>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 leading-none">
                          {officerDetail.badges_earned.length}
                        </span>
                        <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 font-medium shrink-0">
                          Badges Issued
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                        FRAC Competencies & Target Benchmarks
                      </h4>
                    </div>

                    {/* Mobile Row Cards View (< md) */}
                    <div className="md:hidden space-y-2.5">
                      {officerDetail.competencies.map((comp) => {
                        const isAchieved =
                          comp.assessed_level >= comp.target_level;
                        return (
                          <div
                            key={comp.id}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xs space-y-2"
                          >
                            {/* Header: Name & Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-xs text-slate-900 dark:text-white wrap-break-word">
                                  {comp.name}
                                </h5>
                                <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {comp.code} • {comp.department}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 font-semibold text-[10.5px] rounded border shrink-0 ${
                                  isAchieved
                                    ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                    : "bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                }`}
                              >
                                {isAchieved
                                  ? "Achieved"
                                  : `Gap (L${comp.target_level - comp.assessed_level})`}
                              </span>
                            </div>

                            {/* Stacked Levels (Assessed & Target one below another) */}
                            <div className="space-y-1.5 text-xs font-mono">
                              <div className="p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between shadow-2xs">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  Assessed Level:
                                </span>
                                <span className="font-bold text-blue-900 dark:text-blue-400 text-xs">
                                  Level {comp.assessed_level}
                                </span>
                              </div>

                              <div className="p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between shadow-2xs">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  Target Benchmark:
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                  Level {comp.target_level}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => {
                                setOverrideCompId(comp.id);
                                setOverrideLevel(comp.assessed_level);
                              }}
                              className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs btn-press"
                            >
                              <span>Override & Accredit Level</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View (>= md) */}
                    <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs min-w-full">
                        <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 font-mono text-[10px] uppercase text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="p-2.5">Competency Code & Name</th>
                            <th className="p-2.5 text-center">
                              Assessed Level
                            </th>
                            <th className="p-2.5 text-center">
                              Target Benchmark
                            </th>
                            <th className="p-2.5 text-center">Status</th>
                            <th className="p-2.5 text-right">Audit Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {officerDetail.competencies.map((comp) => (
                            <tr
                              key={comp.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {comp.name}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                  {comp.code} • {comp.department}
                                </div>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-400">
                                Level {comp.assessed_level}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-300">
                                Level {comp.target_level}
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                {comp.assessed_level >= comp.target_level ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded border border-emerald-200 dark:border-emerald-800">
                                    Achieved
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold rounded border border-amber-200 dark:border-amber-800">
                                    Gap (L
                                    {comp.target_level - comp.assessed_level})
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => {
                                    setOverrideCompId(comp.id);
                                    setOverrideLevel(comp.assessed_level);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded font-semibold text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                                >
                                  Override Level
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {overrideCompId && (
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-950 dark:text-amber-300 font-mono uppercase">
                          Manual Competency Accreditation Override
                        </span>
                        <button
                          onClick={() => setOverrideCompId(null)}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
                            New Assessed Level (1 - 5)
                          </label>
                          <select
                            value={overrideLevel}
                            onChange={(e) =>
                              setOverrideLevel(Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded"
                          >
                            <option value={1}>Level 1: Basic Awareness</option>
                            <option value={2}>
                              Level 2: Working Knowledge
                            </option>
                            <option value={3}>
                              Level 3: Core Practitioner
                            </option>
                            <option value={4}>
                              Level 4: Advanced Specialist
                            </option>
                            <option value={5}>
                              Level 5: Master / Subject Authority
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
                            Audit Remarks / Justification
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Verified prior field experience or external certification"
                            value={overrideRemarks}
                            onChange={(e) => setOverrideRemarks(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveCompetencyOverride}
                          disabled={overrideSaving}
                          className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          {overrideSaving
                            ? "Accrediting..."
                            : "Confirm & Accredit Level"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                      Enrolled Courses & iGOT Karmayogi Ledger
                    </h4>

                    {officerDetail.enrolled_courses.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded">
                        Officer has not enrolled in any iGOT courses yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {officerDetail.enrolled_courses.map((item) => (
                          <div
                            key={item.enrollment_id}
                            className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {item.course.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase ${
                                    item.status === "completed"
                                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                                      : "bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                                {item.course.by}
                              </p>
                            </div>

                            {item.certificate_id && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                <span>Cert ID:</span>
                                <span className="font-bold text-blue-900 dark:text-blue-400">
                                  {item.certificate_id}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedOfficerId(null);
                  setOfficerDetail(null);
                }}
                className="px-4 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                  MoSPI Curriculum Management
                </span>
                <h3 className="text-xl font-bold font-serif text-white">
                  Curate New Course & Map Competencies
                </h3>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors btn-press cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCourse}
              className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-900 dark:text-slate-100"
            >
              {courseError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded font-medium flex items-center gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{courseError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Course Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced National Accounts & Digital Economy Accounting"
                  value={courseFormData.name}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-900 dark:focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Offering Organization
                  </label>
                  <input
                    type="text"
                    value={courseFormData.by}
                    onChange={(e) =>
                      setCourseFormData({
                        ...courseFormData,
                        by: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    value={courseFormData.duration || 10}
                    onChange={(e) =>
                      setCourseFormData({
                        ...courseFormData,
                        duration: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={courseFormData.difficulty_level}
                    onChange={(e) =>
                      setCourseFormData({
                        ...courseFormData,
                        difficulty_level: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner (L1)</option>
                    <option value="Intermediate">Intermediate (L2-L3)</option>
                    <option value="Advanced">Advanced (L4-L5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Course Description & Objectives
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe key learning outcomes and statistical frameworks covered..."
                  value={courseFormData.course_description || ""}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      course_description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    Associate with FRAC Competencies (Auto-Upskilling Target)
                  </label>
                  {masterCompetencies.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {courseFormData.mapped_competency_ids?.length || 0} /{" "}
                      {masterCompetencies.length} Selected
                    </span>
                  )}
                </div>

                {/* Quick Search */}
                <div className="relative mb-2">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search competencies by title, code or division..."
                    value={compSearchQuery}
                    onChange={(e) => setCompSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 space-y-1.5 bg-slate-50 dark:bg-slate-950/60">
                  {masterCompetenciesLoading ? (
                    <div className="space-y-1.5 p-0.5 animate-pulse">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className="w-full flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-800 overflow-hidden"
                        >
                          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5 sm:w-1/2" />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="h-4 bg-slate-200/80 dark:bg-slate-700 rounded w-16" />
                                <div className="h-4 bg-slate-200/60 dark:bg-slate-700 rounded w-12" />
                              </div>
                            </div>
                            <div className="h-3 bg-slate-200/60 dark:bg-slate-700 rounded w-2/3 sm:w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const filteredMasterCompetencies =
                        masterCompetencies.filter((comp) => {
                          if (!compSearchQuery.trim()) return true;
                          const q = compSearchQuery.toLowerCase();
                          return (
                            comp.name.toLowerCase().includes(q) ||
                            comp.code.toLowerCase().includes(q) ||
                            comp.department.toLowerCase().includes(q) ||
                            (comp.category &&
                              comp.category.toLowerCase().includes(q))
                          );
                        });

                      if (filteredMasterCompetencies.length === 0) {
                        return (
                          <div className="py-6 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                            {compSearchQuery.trim()
                              ? "No matching FRAC competencies found."
                              : "No FRAC competencies available to map."}
                          </div>
                        );
                      }

                      return filteredMasterCompetencies.map((comp) => {
                        const isChecked =
                          courseFormData.mapped_competency_ids?.includes(
                            comp.id,
                          );
                        return (
                          <label
                            key={comp.id}
                            className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer border select-none overflow-hidden ${
                              isChecked
                                ? "bg-blue-50/80 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white shadow-2xs"
                                : "bg-white dark:bg-slate-900 hover:bg-slate-100/90 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current =
                                  courseFormData.mapped_competency_ids || [];
                                if (e.target.checked) {
                                  setCourseFormData({
                                    ...courseFormData,
                                    mapped_competency_ids: [
                                      ...current,
                                      comp.id,
                                    ],
                                  });
                                } else {
                                  setCourseFormData({
                                    ...courseFormData,
                                    mapped_competency_ids: current.filter(
                                      (id) => id !== comp.id,
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 mt-0.5 rounded text-blue-900 focus:ring-0 border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2 min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white text-xs leading-snug wrap-break-word">
                                  {comp.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap self-start sm:self-auto">
                                  <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 rounded font-mono text-[9px] font-bold uppercase shrink-0">
                                    {comp.code}
                                  </span>
                                  {comp.category && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded font-mono text-[9px] font-semibold uppercase shrink-0">
                                      {comp.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium wrap-break-word leading-tight min-w-0">
                                {comp.department}
                              </div>
                            </div>
                          </label>
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={courseSaving}
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseSaving}
                  className={`px-4 py-2 text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    courseSaving
                      ? "bg-slate-300 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                  }`}
                >
                  {courseSaving ? (
                    <>
                      <RotateCw
                        size={13}
                        className="animate-spin text-slate-500 shrink-0"
                      />
                      <span>Publishing Course...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="shrink-0" />
                      <span>Publish & Map Course</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdCourseSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop-enter">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-600 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-modal-enter">
            <div className="bg-radial from-slate-900 via-slate-950 to-emerald-950 text-white p-5 sm:p-6 text-center relative border-b-2 border-emerald-500">
              <button
                onClick={() => setCreatedCourseSuccess(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/20 mb-3 animate-float">
                <CheckCircle2 size={32} />
              </div>

              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                iGOT Repository • MoSPI Curriculum
              </span>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white leading-tight">
                Course Published Successfully!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                The curriculum has been registered in the MoSPI catalogue and
                mapped to target FRAC competencies.
              </p>
            </div>

            <div className="p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Course Title
                  </span>
                  <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {createdCourseSuccess.name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Duration
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {createdCourseSuccess.duration} Hours
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Difficulty
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {createdCourseSuccess.difficulty_level}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                      FRAC Mappings:
                    </span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                      {createdCourseSuccess.mapped_count} Competenc
                      {createdCourseSuccess.mapped_count === 1
                        ? "y"
                        : "ies"}{" "}
                      Linked
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                <ShieldCheck
                  size={16}
                  className="text-emerald-700 dark:text-emerald-400 shrink-0"
                />
                <span>Active in officer learning recommendation loops</span>
              </div>

              <button
                onClick={() => setCreatedCourseSuccess(null)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs btn-press"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        details={selectedCertDetails}
      />
    </div>
  );
};
