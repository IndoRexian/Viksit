import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { ReactBitsBackground } from "../components/common/ReactBitsBackground";
import {
  Shield,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Bot,
  FileSpreadsheet,
  BarChart3,
  Building2,
  Users,
  Compass,
  Check,
  HelpCircle,
  ChevronDown,
  Menu,
} from "lucide-react";

interface FeatureSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  icon: React.ElementType;
  previewType:
    | "radar"
    | "heatmap"
    | "ai_quiz"
    | "doc_studio"
    | "mentor"
    | "admin"
    | "certificate";
}

const CAROUSEL_DURATION_MS = 4000;

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: "radar",
    tag: "FRAC Competency Framework",
    title: "Multi-Axis Competency Radar",
    subtitle: "Precision L1 to L5 Mathematical Profiling",
    description: "",
    bulletPoints: [
      "Benchmark vs. Assessed proficiency overlay (L1 Foundation to L5 Expert).",
      "Instantaneous radar redistribution upon quiz completion",
      "Division-tailored competency catalog (NAD, FOD, PSD, DQAD, SDRD).",
    ],
    icon: Compass,
    previewType: "radar",
  },
  {
    id: "heatmap",
    tag: "Skill Gap Analytics",
    title: "Real-Time Competency Gap Heatmap",
    subtitle: "Mathematical Deficiency Identification",
    description: "",
    bulletPoints: [
      "Dynamic course linkage to rectify identified shortfalls.",
      "Aggregated macro gap telemetry for NSSTA curriculum planners.",
    ],
    icon: BarChart3,
    previewType: "heatmap",
  },
  {
    id: "ai_quiz",
    tag: "AI Assessment Engine",
    title: "AI Calibrated Competency Assessment",
    subtitle: "Automated Contextual MCQ Generation",
    description: "",
    bulletPoints: [
      "Calibrated difficulty taxonomy (L1 Definitions to L5 Complex Reconciliation).",
      "Immediate proficiency re-scoring.",
    ],
    icon: Sparkles,
    previewType: "ai_quiz",
  },
  {
    id: "doc_studio",
    tag: "Multimodal Document Studio",
    title: "Document-to-Quiz Generator",
    subtitle: "Instant Ingestion of Manuals & Circulars",
    description: "",
    bulletPoints: [
      "Drag-and-drop document upload with client & server validation.",
      "Multi-difficulty question synthesis directly from source text.",
      "Interactive examination mode with real-time timer and scoring.",
      "Detailed answer review with citations from the uploaded manual.",
    ],
    icon: FileSpreadsheet,
    previewType: "doc_studio",
  },
  {
    id: "mentor",
    tag: "Zero-Trust Conversational AI",
    title: "AI Statistical Mentor & Action Engine",
    subtitle: "Grounded Conversational Intelligence",
    description: "",
    bulletPoints: [
      "Personalized statistical guidance for NSSO, SNA 2008, CPI, and CAPI.",
      "Natural language course enrollment and diagnostic triggering.",
      "Full conversation history with officer-specific contextual grounding.",
    ],
    icon: Bot,
    previewType: "mentor",
  },
  {
    id: "admin",
    tag: "Executive Governance",
    title: "Ministry Cadre Administration Portal",
    subtitle: "Macro Competency Health & Accreditations",
    description: "",
    bulletPoints: [
      "Macro Competency Health Index across ISS, SSS, and State DES.",
      "Multi-criteria cadre roster filtering (Division, Cadre, Gap Urgency).",
      "Officer drill-down with full FRAC radar and course audit history.",
      "Manual proficiency accreditation overrides with mandatory remark logs.",
    ],
    icon: Shield,
    previewType: "admin",
  },
  {
    id: "certificate",
    tag: "Verifiable Credentials",
    title: "Verifiable Digital Credentials & Registry",
    subtitle: "Cryptographic Accreditation & Badges",
    description: "",
    bulletPoints: [
      "Unique cryptographic certificate identifiers (MOSPI-KARM-2026-XXXX).",
      "National cadre verification registry for seamless promotion audits.",
    ],
    icon: Award,
    previewType: "certificate",
  },
];

const MOSPI_DIVISIONS = [
  {
    code: "NAD",
    name: "National Accounts Division",
    lead: "GDP/GVA Compilation & SNA 2008",
    description:
      "Macroeconomic aggregates, Supply-Use Tables, Sequence of Accounts, and Capital Formation estimation.",
    competencies: [
      "System of National Accounts (SNA 2008)",
      "Gross Value Added (GVA) Estimation",
      "Supply and Use Tables (SUT)",
      "Deflators & Constant Price Series",
    ],
    category: "Macroeconomic Statistics",
  },
  {
    code: "FOD",
    name: "Field Operations Division",
    lead: "Socio-Economic Surveys & CAPI",
    description:
      "Primary data collection network across India using Computer Assisted Personal Interviewing (CAPI) and GPS validation.",
    competencies: [
      "CAPI Mobile Data Collection",
      "Multistage Stratified Sampling",
      "Field Enumeration & Re-interviews",
      "Non-Sampling Error Mitigation",
    ],
    category: "Field Operations",
  },
  {
    code: "PSD",
    name: "Price Statistics Division",
    lead: "CPI, Inflation Metrics & Price Indices",
    description:
      "Compilation of Consumer Price Index (CPI Rural/Urban/Combined), commodity baskets, and Laspeyres weighting.",
    competencies: [
      "CPI Basket Weighting Methodologies",
      "Laspeyres & Fisher Price Indices",
      "Online & Physical Price Collection",
      "Hedonic Price Adjustments",
    ],
    category: "Price Statistics",
  },
  {
    code: "DQAD",
    name: "Data Quality Assurance Division",
    lead: "Statistical Imputation & Quality Frameworks",
    description:
      "National statistical quality assurance framework (NQAF), outlier scrubbing, variance computation, and data governance.",
    competencies: [
      "Outlier Detection & Imputation",
      "Sampling Variance Analysis",
      "Microdata Anonymization Protocols",
      "National Quality Assurance (NQAF)",
    ],
    category: "Quality Assurance",
  },
  {
    code: "SDRD",
    name: "Survey Design & Research Division",
    lead: "Sampling Methodologies & Schedules",
    description:
      "Scientific survey design, questionnaire formulation, pilot testing, and sampling frame construction for NSS rounds.",
    competencies: [
      "Sample Allocation & Multi-stage Frames",
      "Survey Questionnaire Formulation",
      "Pilot Survey Analysis & Weighting",
      "Standard Error Computation",
    ],
    category: "Survey Methodology",
  },
  {
    code: "ESD & SSD",
    name: "Economic & Social Statistics Divisions",
    lead: "IIP, SDGs & Social Welfare Metrics",
    description:
      "Index of Industrial Production (IIP), Annual Survey of Industries (ASI), and Sustainable Development Goals (SDG) monitoring.",
    competencies: [
      "Index of Industrial Production (IIP)",
      "SDG National Indicator Framework",
      "Gender & Environment Statistics",
      "Energy & Infrastructure Metrics",
    ],
    category: "Sectoral Statistics",
  },
];

interface MarqueeItem {
  id: string;
  name: string;
  division: string;
  category: string;
  level: string;
  description: string;
  application: string;
}

const MARQUEE_ITEMS_ROW1: MarqueeItem[] = [
  {
    id: "sna2008",
    name: "System of National Accounts (SNA 2008)",
    division: "NAD (National Accounts Division)",
    category: "Macroeconomic Accounting",
    level: "FRAC Level 4 • Expert",
    description:
      "The international statistical standard for compiling macroeconomic aggregates, GDP, GVA, and sequence of accounts.",
    application:
      "Quarterly & Annual GDP estimates, Supply-Use Tables, and capital formation analysis.",
  },
  {
    id: "plfs",
    name: "Periodic Labour Force Survey (PLFS)",
    division: "FOD & SDRD (Field Operations / Survey Design)",
    category: "Socio-Economic Surveys",
    level: "FRAC Level 3 • Practitioner",
    description:
      "Nationwide household survey measuring employment, unemployment, Labour Force Participation Rate (LFPR), and worker-population ratios.",
    application:
      "Quarterly urban bulletins & annual national employment statistics for policy planning.",
  },
  {
    id: "capi",
    name: "CAPI Mobile Data Validation",
    division: "DQAD & FOD (Data Quality / Field Ops)",
    category: "Survey Informatics",
    level: "FRAC Level 2 • Operational",
    description:
      "Computer-Assisted Personal Interviewing protocols for paperless field data capture with automated range, consistency, and logical audit checks.",
    application:
      "NSSO sample surveys, real-time geo-tagging, and high-velocity field data scrubbing.",
  },
  {
    id: "cpi",
    name: "Consumer Price Index (CPI Combined)",
    division: "PSD (Price Statistics Division)",
    category: "Price & Inflation Indices",
    level: "FRAC Level 3 • Practitioner",
    description:
      "Measures retail price changes across 1,181 rural and 1,114 urban markets nationwide to gauge headline inflation.",
    application:
      "Monetary policy targeting by RBI, dearness allowance indexation, and real wage analysis.",
  },
  {
    id: "sampling",
    name: "Multistage Stratified Sampling",
    division: "SDRD (Survey Design & Research)",
    category: "Mathematical Statistics",
    level: "FRAC Level 4 • Advanced",
    description:
      "Rigorous scientific probability sampling methodology using First Stage Units (Census Villages/Urban Blocks) and Ultimate Stage Units (Households).",
    application:
      "Ensures unbiased estimation and minimal standard error in complex nationwide socio-economic surveys.",
  },
  {
    id: "asi",
    name: "Annual Survey of Industries (ASI)",
    division: "ESD & FOD (Economic Statistics / Field Ops)",
    category: "Industrial Statistics",
    level: "FRAC Level 3 • Practitioner",
    description:
      "Statutory collection of comprehensive data on registered manufacturing factories under the Factories Act.",
    application:
      "Primary data source for manufacturing GDP, output, input, value added, and industrial employment.",
  },
  {
    id: "bayesian",
    name: "Bayesian Statistical Inference",
    division: "NSSTA & Research Cell",
    category: "Advanced Analytics",
    level: "FRAC Level 5 • Specialist",
    description:
      "Probabilistic parameter estimation combining prior distributions with sample likelihoods for small-area and high-uncertainty estimation.",
    application:
      "District-level poverty mapping, rare event modeling, and high-precision parameter updating.",
  },
  {
    id: "nqaf",
    name: "Data Quality Assurance Framework (NQAF)",
    division: "DQAD (Data Quality Assurance Division)",
    category: "Statistical Governance",
    level: "FRAC Level 4 • Governance",
    description:
      "MoSPI's quality framework covering institutional environment, statistical processes, and output quality (relevance, accuracy, timeliness).",
    application:
      "Standardizing statistical audits, metadata standards, and data release calendars.",
  },
  {
    id: "sut",
    name: "Supply and Use Tables (SUT)",
    division: "NAD (National Accounts Division)",
    category: "Macroeconomic Accounting",
    level: "FRAC Level 5 • Specialist",
    description:
      "Matrices recording how domestic and imported goods and services are supplied and used for intermediate consumption, final consumption, and export.",
    application:
      "Eliminates statistical discrepancies between production, expenditure, and income approaches of GDP.",
  },
  {
    id: "gva",
    name: "Gross Value Added (GVA) Estimation",
    division: "NAD (National Accounts Division)",
    category: "Macroeconomic Accounting",
    level: "FRAC Level 4 • Advanced",
    description:
      "Measure of the value of goods and services produced in an economy, calculated as output minus intermediate consumption.",
    application:
      "Sectoral growth breakdown (Agriculture, Industry, Services) at basic prices.",
  },
];

const MARQUEE_ITEMS_ROW2: MarqueeItem[] = [
  {
    id: "sdg",
    name: "SDG India National Indicator Framework",
    division: "SSD (Social Statistics Division)",
    category: "Sustainable Development",
    level: "FRAC Level 3 • Practitioner",
    description:
      "Master monitoring framework with 300+ national indicators aligned to the UN 2030 Agenda for Sustainable Development Goals.",
    application:
      "Tracking state-wise progress on poverty reduction, health, education, and clean energy.",
  },
  {
    id: "x13arima",
    name: "Time Series Seasonal Adjustment (X-13ARIMA)",
    division: "NAD & PSD (Macro & Prices)",
    category: "Time Series Econometrics",
    level: "FRAC Level 4 • Advanced",
    description:
      "Decomposes economic time series into seasonal, trend-cycle, and irregular components to reveal underlying economic momentum.",
    application:
      "Seasonal adjustment of quarterly GDP, industrial production indices, and trade volume data.",
  },
  {
    id: "microdata",
    name: "Microdata Anonymization & Governance",
    division: "DIID (Data Informatics & Innovation)",
    category: "Data Privacy & Open Data",
    level: "FRAC Level 3 • Operational",
    description:
      "Statistical disclosure control techniques (k-anonymity, l-diversity, perturbation) protecting respondent privacy in public datasets.",
    application:
      "Safe public release of unit-level NSS, ASI, and PLFS datasets on the National Data Warehouse.",
  },
  {
    id: "iip",
    name: "Index of Industrial Production (IIP)",
    division: "ESD (Economic Statistics Division)",
    category: "High-Frequency Economic Indicators",
    level: "FRAC Level 3 • Practitioner",
    description:
      "Monthly composite indicator tracking volume changes in the production of industrial sectors (Mining, Manufacturing, Electricity).",
    application:
      "Short-term macroeconomic forecasting and leading indicator for quarterly GDP estimation.",
  },
  {
    id: "survey_design",
    name: "Survey Schedule Design & Pilot Testing",
    division: "SDRD (Survey Design & Research)",
    category: "Field Methodology",
    level: "FRAC Level 4 • Specialist",
    description:
      "Crafting unambiguous, scientifically tested survey questionnaires with pilot field validation and cognitive testing.",
    application:
      "Minimizing non-sampling bias, respondent burden, and classification errors across NSSO rounds.",
  },
  {
    id: "igot",
    name: "iGOT Karmayogi Federated Integration",
    division: "DoPT & NSSTA",
    category: "Capacity Building Platform",
    level: "FRAC Level 2 • System",
    description:
      "Seamless single sign-on and competency sync with the national civil service capacity building portal.",
    application:
      "Unified career progression tracking, course credits, and automated training history synchronization.",
  },
  {
    id: "nssta",
    name: "NSSTA-TPAC Official Training Standard",
    division: "NSSTA (National Statistical Systems Academy)",
    category: "Institutional Training",
    level: "FRAC Level 4 • Academic",
    description:
      "Curriculum standards designed by the Training Programme Advisory Committee for ISS probationary & in-service capacity building.",
    application:
      "Accredited workshops, residential induction courses, and international statistical fellowships.",
  },
  {
    id: "frac",
    name: "FRAC Competency Framework Alignment",
    division: "MoSPI & CBC (Capacity Building Commission)",
    category: "Human Resource Strategy",
    level: "FRAC Level 5 • Governance",
    description:
      "Standardized Framework for Roles, Activities, and Competencies defining required proficiencies (L1 to L5) across all statistical positions.",
    application:
      "Targeted training interventions, gap diagnostics, and objective role-based capacity matching.",
  },
  {
    id: "ai_calib",
    name: "AI-Powered Assessment Calibration",
    division: "Samarth Sankhyiki Core AI",
    category: "AI Psychometrics & Evaluation",
    level: "FRAC Level 4 • Technical",
    description:
      "Adaptive item-response question synthesis with automatic difficulty calibration and distractor justification.",
    application:
      "Real-time diagnostic quizzes generated from official MoSPI manuals with grounded source citations.",
  },
  {
    id: "credentials",
    name: "Digital Verifiable Credential Registry",
    division: "MoSPI Informatics Division",
    category: "Digital Trust & Security",
    level: "FRAC Level 3 • Infrastructure",
    description:
      "Tamper-evident digital accreditation records issued to officers upon passing rigorous assessment benchmarks.",
    application:
      "Cryptographically verifiable certificates for promotion boards, empanelment, and cadre reviews.",
  },
];

const FAQS = [
  {
    q: "How does Samarth Sankhyiki align with Mission Karmayogi and FRAC?",
    a: "The platform implements the Framework for Roles, Activities, and Competencies (FRAC) recommended under Mission Karmayogi. Every statistical designation across ISS, SSS, and State DES is mapped against specific proficiency benchmarks (L1 Foundation to L5 Expert) across Domain, Functional, and Behavioural categories.",
  },
  {
    q: "How are the AI-powered competency quizzes generated and calibrated?",
    a: "Our AI engine integrates Google Gemini 3.6 Flash via the official google-genai SDK. Quizzes are generated dynamically with strict prompt sanitization and structured JSON output schemas. Questions are calibrated against the target proficiency level (L1 for conceptual basics up to L5 for complex multi-sector reconciliation) and include detailed distractor explanations.",
  },
  {
    q: "What is the Zero-Trust Action Protocol in the AI Mentor?",
    a: "When an officer converses with the AI mentor and requests actions (like enrolling in a recommended course or beginning a diagnostic test), Gemini generates a cryptographically validated <ACTION> XML tag. The backend server verifies authorization, validates parameters, and safely executes the database mutation without exposing raw database controls to the LLM.",
  },
  {
    q: "Can State Directorate of Economics & Statistics (DES) officials use this platform?",
    a: "Yes. The platform harmonizes training and competency tracking across Central MoSPI cadres (ISS, SSS) as well as State DES officers, ensuring unified national statistical standards and interoperability across the Indian Statistical System.",
  },
  {
    q: "How are digital certificates verified?",
    a: "Upon completing all modules of an accredited course with a passing assessment score, a unique cryptographic certificate ID (e.g., MOSPI-KARM-2026-XXXX) is permanently recorded in the central MoSPI Credential Registry. Authorized administrators can verify credentials via the Admin Portal or QR code.",
  },
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Carousel State
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [progressKey, setProgressKey] = useState<number>(0);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Marquee Hover Tooltip State
  const [activeMarqueeTooltip, setActiveMarqueeTooltip] = useState<{
    item: MarqueeItem;
    x: number;
    y: number;
    placement: "top" | "bottom";
  } | null>(null);
  const [activeDivision, setActiveDivision] = useState(0);

  const handleMarqueeMouseEnter = (
    e: React.MouseEvent<HTMLElement>,
    item: MarqueeItem,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: "top" | "bottom" = spaceBelow > 240 ? "bottom" : "top";
    const x = Math.max(
      16,
      Math.min(window.innerWidth - 420, rect.left + rect.width / 2 - 200),
    );
    const y = placement === "bottom" ? rect.bottom + 8 : rect.top - 8;
    setActiveMarqueeTooltip({ item, x, y, placement });
  };

  const handleMarqueeMouseLeave = () => {
    setActiveMarqueeTooltip(null);
  };

  // Smooth scroll handler
  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Auto-play carousel timer — pauses while cursor is over the card
  useEffect(() => {
    if (isAutoPlaying && !isHovering) {
      autoPlayRef.current = setInterval(() => {
        setActiveSlide((prev) => {
          const next = (prev + 1) % FEATURE_SLIDES.length;
          setProgressKey((k) => k + 1);
          return next;
        });
      }, CAROUSEL_DURATION_MS);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, isHovering]);

  const currentSlide = FEATURE_SLIDES[activeSlide];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white transition-colors duration-200">
      {/* 1. TOP GOVERNMENT FEDERATED HEADER */}
      <header className="bg-slate-900 text-white border-b-2 border-amber-600 sticky top-0 z-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/favicon.svg"
              alt="National Emblem of India"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400">
                Government of India • भारत सरकार
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </span>
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium ml-auto">
            <nav className="hidden lg:flex items-center gap-6 text-slate-300 mr-2">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, "features")}
                className="hover:text-amber-400 transition-colors py-1 cursor-pointer font-medium"
              >
                Features
              </a>
              <a
                href="#cadres"
                onClick={(e) => scrollToSection(e, "cadres")}
                className="hover:text-amber-400 transition-colors py-1 cursor-pointer font-medium"
              >
                Cadre Matrix
              </a>
              <a
                href="#pipeline"
                onClick={(e) => scrollToSection(e, "pipeline")}
                className="hover:text-amber-400 transition-colors py-1 cursor-pointer font-medium"
              >
                Workflow
              </a>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "faq")}
                className="hover:text-amber-400 transition-colors py-1 cursor-pointer font-medium"
              >
                FAQ
              </a>
            </nav>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(user.role === "admin" ? "/admin" : "/dashboard")
                  }
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press hover:shadow-md"
                >
                  <span>
                    {user.role === "admin" ? "Admin Console" : "My Dashboard"}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-medium inline-flex items-center cursor-pointer transition-all duration-200 btn-press"
                >
                  Official Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded font-bold text-xs shadow-xs inline-flex items-center gap-1 transition-all duration-200 border border-amber-500 btn-press"
                >
                  <span>Cadre Registration</span>
                </Link>
              </div>
            )}

            <div className="sm:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs btn-press"
                aria-label="Account and Navigation Menu"
                aria-expanded={isMobileMenuOpen}
                aria-haspopup="true"
                aria-controls="mobile-navigation"
              >
                <Menu size={16} />
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div
                id="mobile-navigation"
                className="absolute right-4 top-full z-50 mt-2 w-56 bg-slate-900/98 backdrop-blur-md border border-slate-700 text-white rounded-xl shadow-2xl ring-1 ring-slate-800 p-1.5 space-y-1 animate-scale-in sm:hidden"
              >
                {[
                  ["features", "Features"],
                  ["cadres", "Cadre Matrix"],
                  ["pipeline", "Workflow"],
                  ["faq", "FAQ"],
                ].map(([sectionId, label]) => (
                  <a
                    key={sectionId}
                    href={`#${sectionId}`}
                    onClick={(e) => {
                      scrollToSection(e, sectionId);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {label}
                  </a>
                ))}

                {user ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate(user.role === "admin" ? "/admin" : "/dashboard");
                    }}
                    className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    {user.role === "admin" ? "Admin Console" : "My Dashboard"}
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      Official Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-slate-800 transition-colors"
                    >
                      Cadre Registration
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION WITH REACTBITS INTERACTIVE SQUARES BACKGROUND (LIGHT & DARK MODE) */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* ReactBits Interactive Squares Canvas with Cursor Hover Bloom */}
        <ReactBitsBackground
          variant="squares"
          speed={0.4}
          squareSize={46}
          direction="diagonal"
        />

        {/* Subtle Ambient Warm Spotlights (No harsh blue gradients) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          {/* Subtle Top Metadata Line */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold mb-5 animate-scale-in uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400"></span>
              Smart India Hackathon 2026
            </span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">
              •
            </span>
            <span>Mission Karmayogi & NSSTA Aligned</span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">
              •
            </span>
            <span>FRAC Model Standard (L1–L5)</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15] mb-4">
            Samarth Sankhyiki
            <span className="block text-xl sm:text-2xl lg:text-3xl font-sans font-medium text-amber-700 dark:text-amber-400 mt-2">
              सामर्थ्य सांख्यिकी • Skill Intelligence & Adaptive Capacity
              Building
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-normal mb-8">
            An end-to-end, AI-powered competency management, skill gap
            analytics, and adaptive learning ecosystem engineered for the{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">
              Ministry of Statistics & Programme Implementation (MoSPI)
            </strong>
            , Indian Statistical Service (ISS), Subordinate Statistical Service
            (SSS), and State DES Cadres.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, "features")}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm rounded shadow-md flex items-center gap-2 btn-press transition-all glow-amber-hover cursor-pointer"
            >
              <span>Explore Platform Capabilities</span>
              <ArrowRight size={16} />
            </a>

            {user ? (
              <button
                onClick={() =>
                  navigate(user.role === "admin" ? "/admin" : "/dashboard")
                }
                className="px-6 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-sm rounded shadow-sm flex items-center gap-2 btn-press transition-all cursor-pointer"
              >
                <span>
                  Launch{" "}
                  {user.role === "admin" ? "Admin Portal" : "Officer Portal"}
                </span>
                <ChevronRight size={16} className="text-amber-400" />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-semibold text-sm rounded shadow-sm flex items-center gap-2 btn-press transition-all"
              >
                <span>Officer / Admin Gateway</span>
                <ChevronRight
                  size={16}
                  className="text-amber-600 dark:text-amber-400"
                />
              </Link>
            )}
          </div>

          {/* Live System Metric Tickers */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
            <div className="bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-lg p-4 backdrop-blur-md shadow-sm card-interactive">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Harmonized Cadres
                </span>
                <Users
                  size={16}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                3 Cadres
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ISS, SSS & State DES
              </p>
            </div>

            <div className="bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-lg p-4 backdrop-blur-md shadow-sm card-interactive">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  MoSPI Divisions
                </span>
                <Building2
                  size={16}
                  className="text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                8+ Divisions
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                NAD, FOD, PSD, DQAD, SDRD+
              </p>
            </div>

            <div className="bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-lg p-4 backdrop-blur-md shadow-sm card-interactive">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  AI Assessment Engine
                </span>
                <Sparkles
                  size={16}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                AI Driven
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Multimodal Diagnostic Matrix
              </p>
            </div>

            <div className="bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-lg p-4 backdrop-blur-md shadow-sm card-interactive">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  FRAC Model Standard
                </span>
                <Award
                  size={16}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                L1 → L5
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Foundation to Expert Scaling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INFINITE SCROLLING MARQUEE OF COMPETENCIES & METHODOLOGIES (INTERACTIVE HOVER DETAILS) */}
      <section className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 py-2.5 overflow-hidden select-none marquee-container transition-colors relative">
        <div className="flex flex-col gap-2">
          {/* Row 1: Forward */}
          <div className="flex whitespace-nowrap overflow-hidden py-0.5">
            <div className="flex gap-4 sm:gap-6 animate-marquee">
              {MARQUEE_ITEMS_ROW1.concat(MARQUEE_ITEMS_ROW1).map(
                (item, idx) => (
                  <div
                    key={`m1-${idx}`}
                    onMouseEnter={(e) => handleMarqueeMouseEnter(e, item)}
                    onMouseLeave={handleMarqueeMouseLeave}
                    className="inline-flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 shrink-0 tracking-wide hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 px-2.5 py-1 rounded transition-all cursor-default border border-transparent hover:border-amber-500/30 dark:hover:border-amber-400/30 hover:shadow-xs group"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-none shrink-0 group-hover:scale-125 transition-transform"></span>
                    <span>{item.name}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Row 2: Reverse */}
          <div className="flex whitespace-nowrap overflow-hidden py-0.5">
            <div className="flex gap-4 sm:gap-6 animate-marquee-reverse">
              {MARQUEE_ITEMS_ROW2.concat(MARQUEE_ITEMS_ROW2).map(
                (item, idx) => (
                  <div
                    key={`m2-${idx}`}
                    onMouseEnter={(e) => handleMarqueeMouseEnter(e, item)}
                    onMouseLeave={handleMarqueeMouseLeave}
                    className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0 tracking-wide hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 px-2.5 py-1 rounded transition-all cursor-default border border-transparent hover:border-amber-500/30 dark:hover:border-amber-400/30 hover:shadow-xs group"
                  >
                    <span className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-none shrink-0 group-hover:scale-125 transition-transform"></span>
                    <span>{item.name}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING MARQUEE DETAIL POPOVER */}
      {activeMarqueeTooltip && (
        <div
          className="fixed z-[9999] w-[340px] sm:w-[400px] p-4 bg-white/95 dark:bg-slate-900/95 border border-amber-500/40 dark:border-amber-400/40 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-150 animate-scale-in"
          style={{
            left: `${activeMarqueeTooltip.x}px`,
            top:
              activeMarqueeTooltip.placement === "bottom"
                ? `${activeMarqueeTooltip.y}px`
                : "auto",
            bottom:
              activeMarqueeTooltip.placement === "top"
                ? `${window.innerHeight - activeMarqueeTooltip.y}px`
                : "auto",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {activeMarqueeTooltip.item.division}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {activeMarqueeTooltip.item.level}
            </span>
          </div>
          <h4 className="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">
            {activeMarqueeTooltip.item.name}
          </h4>
          <div className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 mb-2">
            {activeMarqueeTooltip.item.category}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {activeMarqueeTooltip.item.description}
          </p>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 shrink-0">
              Operational Role:
            </span>
            <span className="leading-tight">
              {activeMarqueeTooltip.item.application}
            </span>
          </div>
        </div>
      )}

      {/* 4. MASTER INTERACTIVE FEATURE SHOWCASE & CAROUSEL */}
      <section
        id="features"
        className="scroll-mt-16 sm:scroll-mt-20 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 w-full"
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest font-bold mb-2">
            Core Platform Architecture
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Engineered for Precision Capacity Building
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Explore the integrated suite of modules powering MoSPI’s competency
            transformation from diagnostic assessment to verifiable digital
            certification.
          </p>
        </div>

        {/* Carousel Navigation Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-8 gap-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          {FEATURE_SLIDES.map((slide, index) => {
            const Icon = slide.icon;
            const isActive = index === activeSlide;
            return (
              <button
                key={slide.id}
                onClick={() => {
                  setActiveSlide(index);
                  setIsAutoPlaying(false);
                }}
                className={`px-3.5 py-2.5 rounded-t font-medium text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-amber-600 text-amber-600 dark:text-amber-400 font-semibold shadow-sm"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={16} />
                <span>{slide.title}</span>
              </button>
            );
          })}
        </div>

        {/* Carousel Display Card */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Progress bar — spans full card width at the very top */}
          <div className="col-span-full h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              key={`${activeSlide}-${progressKey}`}
              className="h-full bg-blue-500 dark:bg-amber-500"
              style={{
                transformOrigin: "left center",
                animation: `carousel-progress ${CAROUSEL_DURATION_MS}ms linear forwards`,
                animationPlayState: isHovering ? "paused" : "running",
              }}
            />
          </div>

          {/* Left Column: Feature Description */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                  {currentSlide.tag}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span>
                    0{activeSlide + 1} / 0{FEATURE_SLIDES.length}
                  </span>
                </div>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1.5">
                {currentSlide.title}
              </h3>
              <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-4">
                {currentSlide.subtitle}
              </p>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                {currentSlide.description}
              </p>

              <div className="space-y-2.5 mb-8">
                {currentSlide.bulletPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={16}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Navigation Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveSlide(
                      (prev) =>
                        (prev - 1 + FEATURE_SLIDES.length) %
                        FEATURE_SLIDES.length,
                    );
                    setIsAutoPlaying(false);
                  }}
                  className="p-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors btn-press cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    setActiveSlide(
                      (prev) => (prev + 1) % FEATURE_SLIDES.length,
                    );
                    setIsAutoPlaying(false);
                  }}
                  className="p-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors btn-press cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {user ? (
                <button
                  onClick={() =>
                    navigate(user.role === "admin" ? "/admin" : "/dashboard")
                  }
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 btn-press cursor-pointer"
                >
                  <span>Launch in Portal</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 btn-press"
                >
                  <span>Login</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Visual Showcase Simulation */}
          <div className="lg:col-span-6 bg-slate-100/70 dark:bg-slate-950/60 p-6 sm:p-8 flex items-center justify-center min-h-[380px] select-none">
            {currentSlide.previewType === "radar" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Compass
                      size={14}
                      className="text-amber-600 dark:text-amber-400"
                    />
                    <span>FRAC Multi-Axis Competency Radar</span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">
                    ISS Benchmarking
                  </span>
                </div>

                {/* SVG Radar simulation */}
                <div className="relative w-full aspect-square max-w-[260px] mx-auto my-2">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {[20, 40, 60, 80, 100].map((r, i) => (
                      <circle
                        key={i}
                        cx="100"
                        cy="100"
                        r={r * 0.8}
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        className="text-slate-200 dark:text-slate-800"
                      />
                    ))}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const x2 = 100 + 80 * Math.cos(rad);
                      const y2 = 100 + 80 * Math.sin(rad);
                      return (
                        <line
                          key={i}
                          x1="100"
                          y1="100"
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                        />
                      );
                    })}
                    {/* Benchmark Polygon */}
                    <polygon
                      points="100,28 162,64 162,136 100,172 38,136 38,64"
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {/* Assessed Polygon */}
                    <polygon
                      points="100,48 145,75 130,120 100,145 60,125 50,75"
                      fill="rgba(217, 119, 6, 0.35)"
                      stroke="#d97706"
                      strokeWidth="2.5"
                    />
                    <circle cx="100" cy="48" r="3.5" fill="#d97706" />
                    <circle cx="145" cy="75" r="3.5" fill="#d97706" />
                    <circle cx="130" cy="120" r="3.5" fill="#d97706" />
                    <circle cx="100" cy="145" r="3.5" fill="#d97706" />
                    <circle cx="60" cy="125" r="3.5" fill="#d97706" />
                    <circle cx="50" cy="75" r="3.5" fill="#d97706" />
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-5 text-[11px] font-mono mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-amber-600 rounded-sm"></span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Assessed Level
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t-2 border-amber-500 border-dashed"></span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Target Benchmark (L4)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.previewType === "heatmap" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <BarChart3 size={14} className="text-amber-500" />
                    <span>Skill Gap Matrix (Domain / Functional)</span>
                  </div>
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    Δ = L_target - L_assessed
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-600 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-rose-900 dark:text-rose-200 block">
                        SNA 2008 Supply & Use Tables
                      </span>
                      <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                        Assessed: L2 | Target: L4
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                      -2 (Urgent)
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-600 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-amber-900 dark:text-amber-200 block">
                        CAPI Multi-Stage Survey Protocols
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                        Assessed: L3 | Target: L4
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                      -1 (Moderate)
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">
                        Data Imputation & Outlier Scrubbing
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        Assessed: L4 | Target: L4
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      Target Met (L4)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.previewType === "ai_quiz" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500" />
                    <span>AI Calibrated MCQ Generator</span>
                  </div>
                  <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    L3 Difficulty
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Q3. Which statistical test is standardly employed to detect
                  heteroskedasticity in MoSPI econometric time series?
                </p>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    A. Durbin-Watson Test
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                    <span>B. Breusch-Pagan-Godfrey Test</span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    C. Augmented Dickey-Fuller (ADF) Test
                  </div>
                </div>
              </div>
            )}

            {currentSlide.previewType === "doc_studio" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-3 text-center">
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center">
                  <FileSpreadsheet
                    size={36}
                    className="text-emerald-500 mb-2"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    NSSO_78th_Round_Guideline.pdf
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono mt-1">
                    Extracted 5 Calibrated MCQs in 1.4s
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>Ready for Timed Examination</span>
                </div>
              </div>
            )}

            {currentSlide.previewType === "mentor" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Bot
                    size={16}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    AI Statistical Officer Mentor
                  </span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded text-xs text-slate-700 dark:text-slate-300">
                  Officer: "I have a deficit in CPI basket weighting. Can you
                  enroll me?"
                </div>
                <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded text-xs text-amber-950 dark:text-amber-200 space-y-1">
                  <p>
                    Certainly! I have initiated enrollment for{" "}
                    <strong>
                      Price Statistics: CPI Formulation (Course #12)
                    </strong>
                    . You can now complete this course and get your verified
                    Certificate!
                  </p>
                </div>
              </div>
            )}

            {currentSlide.previewType === "admin" && (
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Shield size={14} className="text-rose-500" />
                    <span>Cadre Macro Readiness Roster</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-500 font-semibold">
                    84.2% Compliance
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>ISS Cadre (NAD, PSD)</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      L4.2 Avg
                    </span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>SSS Cadre (FOD Field)</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      L3.1 Avg (Training Needed)
                    </span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>State DES Officers</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      L2.9 Avg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.previewType === "certificate" && (
              <div className="w-full max-w-sm bg-amber-50 dark:bg-slate-900 border-2 border-amber-500/80 rounded-lg p-5 shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 text-amber-500 opacity-20">
                  <Award size={64} />
                </div>
                <img
                  src="/favicon.svg"
                  alt="Emblem"
                  className="w-8 h-8 mx-auto mb-2"
                />
                <div className="text-[10px] font-mono text-amber-800 dark:text-amber-400 uppercase tracking-widest font-semibold">
                  National Statistical Systems Training Academy (NSSTA)
                </div>
                <div className="font-serif text-sm font-bold text-slate-900 dark:text-white my-1">
                  Certificate of Competency Mastery
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Awarded with Gold Distinction (L5)
                </p>
                <div className="mt-3 pt-2 border-t border-amber-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  ID: MOSPI-KARM-2026-9842 • Cryptographically Verified
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. MOSPI DIVISIONS COMPETENCY CATALOG MATRIX */}
      <section
        id="cadres"
        className="scroll-mt-16 sm:scroll-mt-20 py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full"
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-bold mb-2">
            National Statistical Infrastructure
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            MoSPI Specialized Division Matrices
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Tailored FRAC matrices mapped for every key division within India’s
            Official Statistical System.
          </p>
        </div>

        <div className="md:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm min-h-[430px] flex flex-col justify-between">
            {(() => {
              const div = MOSPI_DIVISIONS[activeDivision];
              return (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                        {div.code}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {div.category}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {div.name}
                    </h3>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
                      {div.lead}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {div.description}
                    </p>

                    <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Key Mapped Competencies:
                      </span>
                      {div.competencies.map((comp) => (
                        <div
                          key={comp}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <Check
                            size={13}
                            className="text-emerald-500 shrink-0"
                          />
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDivision(
                          (activeDivision - 1 + MOSPI_DIVISIONS.length) %
                            MOSPI_DIVISIONS.length,
                        )
                      }
                      className="p-2 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press cursor-pointer"
                      aria-label="Previous division"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {MOSPI_DIVISIONS.map((division, index) => (
                        <button
                          key={division.code}
                          type="button"
                          onClick={() => setActiveDivision(index)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            index === activeDivision
                              ? "w-5 bg-amber-600"
                              : "w-2 bg-slate-300 dark:bg-slate-700"
                          }`}
                          aria-label={`Show ${division.name}`}
                          aria-current={
                            index === activeDivision ? "true" : undefined
                          }
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveDivision(
                          (activeDivision + 1) % MOSPI_DIVISIONS.length,
                        )
                      }
                      className="p-2 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press cursor-pointer"
                      aria-label="Next division"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">
          {MOSPI_DIVISIONS.map((div) => (
            <div
              key={div.code}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col justify-between card-interactive hover:border-amber-500 dark:hover:border-amber-500"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {div.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {div.category}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {div.name}
                </h3>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
                  {div.lead}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {div.description}
                </p>

                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Key Mapped Competencies:
                  </span>
                  {div.competencies.map((comp, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <Check size={13} className="text-emerald-500 shrink-0" />
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  FRAC L1-L5 Ready
                </span>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 flex items-center gap-1"
                >
                  <span>Explore Cadre</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. MISSION KARMAYOGI 5-STEP CAPACITY BUILDING PIPELINE */}
      <section
        id="pipeline"
        className="scroll-mt-16 sm:scroll-mt-20 py-16 bg-slate-100/70 dark:bg-slate-900 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors"
      >
        <div className="absolute inset-0 reactbits-dots opacity-40 mask-radial-bottom pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-xs font-mono text-amber-700 dark:text-amber-400 uppercase tracking-widest font-bold mb-2">
              National Training Architecture
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              5-Stage Adaptive Capacity Building Pipeline
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              The continuous evaluation, gap rectification, and verifiable
              accreditation workflow under the NSSTA-TPAC framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Cadre Profiling",
                desc: "Officer designation, qualifications, and division mapped to FRAC benchmark requirements.",
                icon: Users,
              },
              {
                step: "02",
                title: "AI Assessment",
                desc: "AI generates calibrated 5-MCQ diagnostics across Domain & Functional dimensions.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Gap Analytics",
                desc: "Real-time mathematical gap computation (Gap = Target - Assessed) and heatmap generation.",
                icon: BarChart3,
              },
              {
                step: "04",
                title: "Adaptive Learning",
                desc: "Curated iGOT course recommendations and contextual AI Mentor coaching.",
                icon: BookOpen,
              },
              {
                step: "05",
                title: "Accreditation",
                desc: "Issuance of verifiable cryptographic digital credentials to the national cadre registry.",
                icon: Award,
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex flex-col justify-between card-interactive shadow-sm relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400">
                        {st.step}
                      </span>
                      <Icon
                        size={18}
                        className="text-slate-500 dark:text-slate-400"
                      />
                    </div>
                    <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white mb-2">
                      {st.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700/80 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Automated Protocol</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE FAQ ACCORDION (Gemini 3.6 Flash preserved here) */}
      <section
        id="faq"
        className="scroll-mt-16 sm:scroll-mt-20 py-16 max-w-4xl mx-auto px-4 sm:px-6 w-full"
      >
        <div className="text-center mb-10">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-2">
            Institutional Clarifications
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Answers regarding implementation standards, security protocols, and
            interoperability.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-amber-500 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION WITH REACTBITS INTERACTIVE SQUARES */}
      <section className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white py-12 sm:py-16 border-t border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-colors">
        <ReactBitsBackground
          variant="squares"
          speed={0.3}
          squareSize={48}
          direction="right"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
          <img
            src="/favicon.svg"
            alt="National Emblem"
            className="w-12 h-12 mx-auto drop-shadow-md"
          />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Step Into the Future of Official Statistics
          </h2>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Indian Statistical Service officers, field
            enumerators, and state analysts on India’s most intelligent capacity
            building ecosystem.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <button
                onClick={() =>
                  navigate(user.role === "admin" ? "/admin" : "/dashboard")
                }
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded shadow-md btn-press flex items-center gap-2 cursor-pointer"
              >
                <span>
                  Launch{" "}
                  {user.role === "admin" ? "Admin Console" : "Officer Portal"}
                </span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded shadow-md btn-press flex items-center gap-2"
                >
                  <span>Register Cadre Account</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-semibold text-sm rounded shadow-sm btn-press"
                >
                  <span>Official Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 10. GOVERNMENT FOOTER */}
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.svg"
                alt="Emblem"
                className="w-7 h-7 object-contain"
              />
              <span className="font-serif text-sm font-bold text-slate-900 dark:text-slate-200">
                Samarth Sankhyiki • सामर्थ्य सांख्यिकी
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              Skill Intelligence & Adaptive Capacity Building Platform for the
              Ministry of Statistics & Programme Implementation (MoSPI),
              Government of India. Aligned with Mission Karmayogi and NSSTA-TPAC
              directives.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              National Statistical Systems Training Academy (NSSTA), Plot No.
              22, Knowledge Park-II, Greater Noida, Uttar Pradesh 201310.
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              Cadre Portals
            </span>
            <div>
              <Link
                to="/login"
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                ISS Statistical Officer Portal
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                SSS Subordinate Cadre Portal
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                State DES Federated Access
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                NSSTA Executive Governance
              </Link>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              Standards & Compliance
            </span>
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                Mission Karmayogi FRAC
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                AI Assessment Engine
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                iGOT Karmayogi Federation
              </span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                SIH 2026 Production Build
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
          <div>
            © 2026 Ministry of Statistics & Programme Implementation (MoSPI),
            Government of India.
          </div>
          <div className="flex items-center gap-4">
            <span>National Informatics Centre (NIC) Hosted</span>
            <span>•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
