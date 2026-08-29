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
import {
  ShieldCheck,
  Building2,
  Users,
  Award,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Plus,
  RotateCw,
  LogOut,
  User,
  BarChart3,
  X,
  Download,
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "overview" | "roster" | "certifications"
  >("overview");

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
      const data = await competencyService.getUserMatrix("all");
      if (data && data.items) {
        setMasterCompetencies(data.items);
      }
    } catch (err) {
      console.error("Failed to load master competencies:", err);
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
    try {
      setCourseSaving(true);
      await adminService.createCourse(courseFormData);
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
    } catch (err) {
      console.error("Failed to create course:", err);
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900">
      <header className="bg-slate-950 text-white border-b-2 border-amber-600 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="National Emblem"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400">
                  Government of India • भारत सरकार
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[9px] uppercase font-bold rounded">
                  MoSPI National Admin Console
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                Ministry of Statistics & Programme Implementation • Cadre
                Governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 font-mono text-[11px] font-bold uppercase">
                  National Competency Ledger & Cadre Authority
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium ml-1">
                  <ShieldCheck size={14} /> NSSTA / DoPT Synchronized
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                MoSPI Human Resource & Training Governance
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Macro-level competency analytics, divisional skill readiness
                heatmaps, cadre directory, and iGOT Karmayogi learning loop
                enforcement.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  fetchSummary();
                  fetchOfficers();
                  fetchCertifications();
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Refresh Analytics"
              >
                <RotateCw size={13} />
                <span>Sync Data</span>
              </button>

              <button
                onClick={() => {
                  fetchMasterCompetencies();
                  setIsCourseModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus size={13} />
                <span>Curate Course</span>
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-t border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "overview"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <BarChart3 size={13} />
                <span>Macro Overview & Heatmap</span>
              </button>

              <button
                onClick={() => setActiveTab("roster")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "roster"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Users size={13} />
                <span>Cadre Officers Roster</span>
              </button>

              <button
                onClick={() => setActiveTab("certifications")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-all shrink-0 inline-flex items-center gap-1.5 ${
                  activeTab === "certifications"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Award size={13} />
                <span>Credentials & Badge Registry</span>
              </button>
            </div>

            <span className="hidden lg:inline-block text-[11px] font-mono text-slate-500">
              National Statistical Systems Training Academy (NSSTA)
            </span>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/40">
            <div className="border border-slate-200 bg-white p-3.5 rounded shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Ministry Skill Index
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {summaryData ? (
                    `${summaryData.ministry_skill_index}%`
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-slate-500" />
                  ) : (
                    "78.4%"
                  )}
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  Composite
                </span>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-3.5 rounded shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Total Officers
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-900">
                  {summaryData ? (
                    summaryData.total_officers
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-slate-500" />
                  ) : (
                    "0"
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Cadre Strength
                </span>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-3.5 rounded shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Training Velocity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-emerald-700">
                  {summaryData ? (
                    `${summaryData.completion_rate}%`
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-emerald-600" />
                  ) : (
                    "0%"
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Completion
                </span>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-3.5 rounded shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Verified Badges Issued
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-blue-900">
                  {summaryData ? (
                    summaryData.total_certifications_issued
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-blue-700" />
                  ) : (
                    "0"
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  iGOT-MOSPI
                </span>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-3.5 rounded shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Urgent Deficits
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-amber-700">
                  {summaryData ? (
                    summaryData.urgent_gaps_count
                  ) : summaryLoading ? (
                    <AnimatedDots color="bg-amber-600" />
                  ) : (
                    "0"
                  )}
                </span>
                <span className="text-[11px] font-mono text-amber-700 font-semibold">
                  Action Required
                </span>
              </div>
            </div>
          </div>
        </section>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {summaryLoading && !summaryData ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-200 p-4 rounded shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-3.5 bg-slate-200 rounded w-28" />
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between">
                          <div className="h-3 bg-slate-200 rounded w-24" />
                          <div className="h-3 bg-slate-200 rounded w-8" />
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-200 rounded-full w-2/3" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-100">
                        <div className="h-3 bg-slate-200 rounded w-16" />
                        <div className="h-3 bg-slate-200 rounded w-6" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                    <div className="space-y-1.5">
                      <div className="h-4 bg-slate-300 rounded w-64" />
                      <div className="h-3 bg-slate-200 rounded w-80" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-48 hidden sm:block" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-600 uppercase">
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
                      <tbody className="divide-y divide-slate-200">
                        {[1, 2, 3, 4, 5].map((row) => (
                          <tr key={row}>
                            <td className="p-3.5">
                              <div className="h-3.5 bg-slate-200 rounded w-44" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-4 bg-slate-200 rounded w-10" />
                                <div className="w-24 h-2 bg-slate-100 rounded-full" />
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-4 bg-slate-100 rounded w-6 mx-auto" />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="h-3.5 bg-slate-200 rounded w-10 mx-auto" />
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
                      className="bg-white border border-slate-300 p-4 rounded shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                            {cadre.cadre_group}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded font-semibold">
                            {cadre.officer_count} Officers
                          </span>
                        </div>
                        <div className="space-y-2 mt-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600">
                                Average Readiness:
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {cadre.average_skill_index}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-900 rounded-full transition-all"
                                style={{
                                  width: `${cadre.average_skill_index}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Urgent Gaps:</span>
                            <span
                              className={`font-mono font-bold ${
                                cadre.urgent_gaps_count > 0
                                  ? "text-amber-700"
                                  : "text-emerald-700"
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

                <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 size={18} className="text-slate-700" />
                        <span>Divisional Competency Readiness Matrix</span>
                      </h2>
                      <p className="text-xs text-slate-600">
                        Comprehensive skill fulfillment indices and training
                        velocity across all MoSPI operating divisions.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-emerald-600 rounded-xs" />
                        <span>&ge; 80% Benchmark</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-amber-500 rounded-xs" />
                        <span>60-79% Moderate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-red-600 rounded-xs" />
                        <span>&lt; 60% Critical</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-600 uppercase">
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
                      <tbody className="divide-y divide-slate-200">
                        {summaryData?.divisional_readiness.map((div, idx) => {
                          const badgeColor =
                            div.average_skill_index >= 80
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : div.average_skill_index >= 60
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-red-50 text-red-800 border-red-300";

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3.5 font-semibold text-slate-900">
                                {div.division}
                              </td>
                              <td className="p-3.5 text-center font-mono font-medium">
                                {div.total_officers}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${badgeColor}`}
                                  >
                                    {div.average_skill_index}%
                                  </span>
                                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        div.average_skill_index >= 80
                                          ? "bg-emerald-600"
                                          : div.average_skill_index >= 60
                                            ? "bg-amber-500"
                                            : "bg-red-600"
                                      }`}
                                      style={{
                                        width: `${div.average_skill_index}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-center font-mono text-emerald-800 font-bold">
                                {div.achieved_benchmarks}
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-700">
                                {div.active_gaps}
                              </td>
                              <td className="p-3.5 text-center font-mono">
                                {div.urgent_gaps > 0 ? (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded">
                                    {div.urgent_gaps}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0</span>
                                )}
                              </td>
                              <td className="p-3.5 text-center font-mono font-semibold text-blue-900">
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
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search officers by name, cadre ID, designation, or division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchOfficers()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCadre}
                  onChange={(e) => setSelectedCadre(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700"
                >
                  <option value="all">All Cadres</option>
                  <option value="ISS (Indian Statistical Service)">
                    ISS Cadre
                  </option>
                  <option value="SSS (Subordinate Statistical Service)">
                    SSS Cadre
                  </option>
                  <option value="DES (State Statistical Cadre)">
                    State DES Cadre
                  </option>
                </select>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700"
                >
                  <option value="all">All Divisions</option>
                  <option value="National Accounts Division (NAD)">
                    National Accounts (NAD)
                  </option>
                  <option value="Field Operations Division (FOD)">
                    Field Operations (FOD)
                  </option>
                  <option value="Economic Statistics Division (ESD)">
                    Economic Statistics (ESD)
                  </option>
                  <option value="Data Quality & Assurance (DQAD)">
                    Data Quality (DQAD)
                  </option>
                  <option value="Social Statistics Division (SSD)">
                    Social Statistics (SSD)
                  </option>
                </select>

                <select
                  value={gapFilter}
                  onChange={(e) => setGapFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700"
                >
                  <option value="all">All Gap Statuses</option>
                  <option value="urgent_only">Urgent Deficits Only</option>
                  <option value="gaps_only">Has Active Gaps</option>
                  <option value="achieved_only">Benchmark Achieved</option>
                </select>

                <button
                  onClick={fetchOfficers}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Filter size={13} />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-600 uppercase">
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
                <tbody className="divide-y divide-slate-200">
                  {officersLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5 space-y-1.5">
                          <div className="h-3.5 bg-slate-300 rounded w-36" />
                          <div className="h-2.5 bg-slate-200 rounded w-20" />
                        </td>
                        <td className="p-3.5 space-y-1.5">
                          <div className="h-3 bg-slate-300 rounded w-32" />
                          <div className="h-2.5 bg-slate-200 rounded w-24" />
                        </td>
                        <td className="p-3.5 space-y-1">
                          <div className="h-3 bg-slate-200 rounded w-40" />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 bg-slate-200 rounded w-12" />
                            <div className="w-16 h-2 bg-slate-100 rounded-full hidden sm:block" />
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-4 bg-slate-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="h-3 bg-slate-200 rounded w-12 mx-auto" />
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="h-6 bg-slate-200 rounded w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredOfficers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 font-mono"
                      >
                        No officers matching current search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOfficers.map((officer) => (
                      <tr
                        key={officer.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {officer.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            @{officer.username}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-slate-800 block">
                            {officer.designation}
                          </span>
                          <span className="font-mono text-[10px] text-blue-900 font-semibold">
                            {officer.cadre_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {officer.department}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold rounded">
                            {officer.composite_skill_index}%
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {officer.urgent_gap_count > 0 ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded">
                              {officer.gap_count} ({officer.urgent_gap_count}{" "}
                              urgent)
                            </span>
                          ) : officer.gap_count > 0 ? (
                            <span className="text-slate-600">
                              {officer.gap_count} gaps
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              All Met
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          <span className="text-slate-800">
                            {officer.enrolled_count} ({officer.completed_count}{" "}
                            done)
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() =>
                              handleOpenOfficerDrilldown(officer.id)
                            }
                            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span>Inspect & Audit</span>
                            <ChevronRight size={12} />
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
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-amber-600" />
                  <span>iGOT Karmayogi • MoSPI Certification Registry</span>
                </h2>
                <p className="text-xs text-slate-600">
                  Immutable register of verified digital badges and
                  cryptographic completion credentials issued to officers.
                </p>
              </div>

              <div className="w-full md:w-72 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Verify Certificate ID or Officer..."
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-600 uppercase">
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
                <tbody className="divide-y divide-slate-200">
                  {certsLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 font-mono"
                      >
                        Loading certification registry...
                      </td>
                    </tr>
                  ) : filteredCerts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 font-mono"
                      >
                        No certificates match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCerts.map((cert, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3.5 font-mono font-bold text-slate-900 select-all">
                          {cert.certificate_id}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">
                          {cert.user_name}
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-800 block">
                            {cert.user_designation}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {cert.user_department}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">
                            {cert.course_name}
                          </div>
                          <div className="text-[10px] font-mono text-amber-800">
                            {cert.badge_name}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600">
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[10px] font-semibold rounded">
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
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 hover:text-slate-950 border border-amber-300 text-amber-900 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                  MoSPI Cadre Audit & Competency Inspection
                </span>
                <h3 className="text-xl font-bold font-serif text-white">
                  {officerDetail?.officer.name || "Officer Inspection"}
                </h3>
                <p className="text-xs text-slate-300">
                  {officerDetail?.officer.designation} •{" "}
                  {officerDetail?.officer.department}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedOfficerId(null);
                  setOfficerDetail(null);
                  setOverrideCompId(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {drilldownLoading ? (
                <div className="p-8 text-center text-slate-500 font-mono">
                  Loading officer matrix and credential dossier...
                </div>
              ) : officerDetail ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Composite Skill Index
                      </span>
                      <span className="font-mono text-xl font-bold text-slate-900">
                        {officerDetail.composite_skill_index}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Cadre Classification
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-900">
                        {officerDetail.cadre_type}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Active Skill Gaps
                      </span>
                      <span className="font-mono text-xl font-bold text-amber-700">
                        {officerDetail.gap_count} (
                        {officerDetail.urgent_gap_count} urgent)
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Verified Credentials
                      </span>
                      <span className="font-mono text-xl font-bold text-emerald-700">
                        {officerDetail.badges_earned.length} Badges
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                        FRAC Competencies & Target Benchmarks
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        Training Authority Accreditation
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] uppercase text-slate-600">
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
                        <tbody className="divide-y divide-slate-200">
                          {officerDetail.competencies.map((comp) => (
                            <tr key={comp.id} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">
                                  {comp.name}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500">
                                  {comp.code} • {comp.department}
                                </div>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-blue-900">
                                Level {comp.assessed_level}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-600">
                                Level {comp.target_level}
                              </td>
                              <td className="p-2.5 text-center font-mono">
                                {comp.assessed_level >= comp.target_level ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200">
                                    Achieved
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded border border-amber-200">
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
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-[10px] text-slate-700 cursor-pointer"
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
                    <div className="p-4 bg-amber-50/70 border-2 border-amber-400 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-950 font-mono uppercase">
                          Manual Competency Accreditation Override
                        </span>
                        <button
                          onClick={() => setOverrideCompId(null)}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-slate-700 mb-1">
                            New Assessed Level (1 - 5)
                          </label>
                          <select
                            value={overrideLevel}
                            onChange={(e) =>
                              setOverrideLevel(Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
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
                          <label className="block text-[11px] font-mono text-slate-700 mb-1">
                            Audit Remarks / Justification
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Verified prior field experience or external certification"
                            value={overrideRemarks}
                            onChange={(e) => setOverrideRemarks(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
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
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 mb-2">
                      Enrolled Courses & iGOT Karmayogi Ledger
                    </h4>

                    {officerDetail.enrolled_courses.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
                        Officer has not enrolled in any iGOT courses yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {officerDetail.enrolled_courses.map((item) => (
                          <div
                            key={item.enrollment_id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-slate-900">
                                  {item.course.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase ${
                                    item.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-blue-100 text-blue-900"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-1">
                                {item.course.by}
                              </p>
                            </div>

                            {item.certificate_id && (
                              <div className="mt-2 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-600 flex items-center justify-between">
                                <span>Cert ID:</span>
                                <span className="font-bold text-blue-900">
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setSelectedOfficerId(null);
                  setOfficerDetail(null);
                }}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
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
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCourse}
              className="p-6 overflow-y-auto space-y-4 flex-1"
            >
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-800 mb-1">
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-800 mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded"
                  >
                    <option value="Beginner">Beginner (L1)</option>
                    <option value="Intermediate">Intermediate (L2-L3)</option>
                    <option value="Advanced">Advanced (L4-L5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-800 mb-1">
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-800 mb-1.5">
                  Associate with FRAC Competencies (Auto-Upskilling Target)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 divide-y divide-slate-100 bg-slate-50">
                  {masterCompetencies.map((comp) => {
                    const isChecked =
                      courseFormData.mapped_competency_ids?.includes(comp.id);
                    return (
                      <label
                        key={comp.id}
                        className="flex items-center gap-2 py-1.5 text-xs text-slate-800 hover:bg-slate-100 px-1 rounded cursor-pointer"
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
                                mapped_competency_ids: [...current, comp.id],
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
                          className="rounded text-blue-900 focus:ring-0"
                        />
                        <span className="font-bold text-slate-900">
                          {comp.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({comp.code} • {comp.department})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseSaving}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold"
                >
                  {courseSaving ? "Publishing..." : "Publish & Map Course"}
                </button>
              </div>
            </form>
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
