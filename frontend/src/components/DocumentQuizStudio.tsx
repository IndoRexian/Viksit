import React, { useState, useRef } from "react";
import {
  aiService,
  type DocumentQuizResponse,
  type DocumentQuizQuestion,
} from "../services/ai";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  RotateCw,
  HelpCircle,
  Download,
  Check,
  XCircle,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";

const SAMPLE_DOCS = [
  {
    badge: "MoSPI National Accounts (NAD)",
    name: "MoSPI_GDP_Estimation_Methodology.txt",
    title: "MoSPI National Accounts Division — GDP & GVA Estimation Guidelines",
    content: `GOVERNMENT OF INDIA
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
NATIONAL ACCOUNTS DIVISION (NAD)

TECHNICAL GUIDELINE NO. NAD/2025-26/04
SUBJECT: ESTIMATION OF GROSS DOMESTIC PRODUCT (GDP) AND GROSS VALUE ADDED (GVA) UNDER SNA 2008 FRAMEWORK

1. INTRODUCTION & CONCEPTUAL FOUNDATION
Gross Domestic Product (GDP) represents the aggregate monetary measure of all final goods and services produced within the economic territory of India over a given accounting period. In accordance with the United Nations System of National Accounts (SNA 2008), the Ministry of Statistics and Programme Implementation compiles national accounts aggregates using both Production Approach (Gross Value Added at Basic Prices) and Expenditure Approach (GDP at Market Prices).

The fundamental identity governing national accounts compilation is:
GDP at Market Prices = GVA at Basic Prices + Product Taxes - Product Subsidies

Where:
- GVA at Basic Prices = Output at Basic Prices - Intermediate Consumption at Purchasers' Prices.
- Product taxes include GST, custom duties, excise duties, and stamp registration fees directly linked to output quantity or value.
- Product subsidies include direct per-unit subsidies on food (FCI), fertilizers, petroleum, and export incentives.

2. CLASSIFICATION OF ECONOMIC ACTIVITIES (NIC 2008)
Economic activities are aggregated into eight institutional broad industry sectors:
1. Agriculture, Forestry & Fishing (Crops, Livestock, Forestry & Logging, Fishing & Aquaculture)
2. Mining & Quarrying (Coal, Crude Petroleum, Natural Gas, Metallic & Non-metallic Minerals)
3. Manufacturing (Organized Corporate Manufacturing via MCA-21 database and Unorganized sector via ASUSE/ASI)
4. Electricity, Gas, Water Supply & Other Utility Services
5. Construction (Physical indicators: Cement consumption, Steel consumption, and Central/State capital outlay)
6. Trade, Hotels, Transport, Communication & Broadcasting Services
7. Financial, Real Estate & Professional Services (Bank deposits, loans/advances, insurance premia, MCA company financial returns)
8. Public Administration, Defence & Other Services

3. COMPILATION METHODOLOGY FOR KEY SECTORS
- Agriculture Sector: Estimated using the Production Approach (Value of Output minus Inputs). Crop output volume is obtained from Final Estimates of Agricultural Production issued by DES-MoA&FW. Producer prices are sourced from APMC mandi arrivals.
- Corporate Manufacturing: Compiled using audited financial balance sheets and profit & loss statements filed by companies on the Ministry of Corporate Affairs (MCA-21) portal. GVA is derived using the Income approach: Compensation of Employees + Operating Surplus + Mixed Income + Consumption of Fixed Capital.
- Banking & Financial Services: Output is measured as explicit service charges plus Financial Intermediation Services Indirectly Measured (FISIM).
- Construction Sector: Utilizes the Commodity Flow Approach tracking physical consumption of cement and finished steel alongside state capital outlay.

4. PRICE DEFLATORS & DOUBLE DEFLATION
To derive Real GDP (Constant Price Series with Base Year 2011-12 = 100) from Nominal GDP:
- Agriculture and Mining: Single deflation using Wholesale Price Index (WPI) sub-indices.
- Manufacturing: Double Deflation method (Output deflated by sector-specific WPI, intermediate inputs deflated by input-weighted WPI composite basket).
- Services: Deflated using Consumer Price Index (CPI-Combined) or Service Producer Price Indices (SPPI).

5. REVISION POLICY
- First Advance Estimates (FAE): Released on January 7 for Union Budget formulations.
- Second Advance Estimates (SAE): Released on the last working day of February alongside Q3 estimates.
- Provisional Estimates (PE): Released on May 31 (2 months post FY closure).
- First Revised Estimates (FRE): Released on January 31 of following year.`,
  },
  {
    badge: "NSSO Survey Sampling (SDRD)",
    name: "NSSO_Field_Survey_Guidelines.txt",
    title:
      "NSSO Survey Design & Research Division — Multi-Stage Sampling Manual",
    content: `GOVERNMENT OF INDIA
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
NATIONAL SAMPLE SURVEY OFFICE (NSSO) - SURVEY DESIGN AND RESEARCH DIVISION (SDRD)

FIELD OPERATIONS MANUAL: MULTI-STAGE STRATIFIED SAMPLING & FIELD INVESTIGATION PROTOCOLS

1. SAMPLING DESIGN & SAMPLE SELECTION METHODOLOGY
The National Sample Survey (NSS) employs a Stratified Multi-Stage Sampling Design for household socio-economic surveys across rural and urban sectors of India.

1.1 Primary Sampling Units (PSUs):
- Rural Sector: The First Stage Units (FSUs) are Census Villages (or Revenue Villages as per latest Population Census directory).
- Urban Sector: The FSUs are Urban Frame Survey (UFS) blocks demarcated and updated quinquennially by NSSO Field Operations Division (FOD).

1.2 Ultimate Stage Units (USUs):
The Ultimate Stage Units are households in socio-economic surveys, and manufacturing/services unincorporated enterprises in enterprise surveys.

1.3 Sub-stratification and FSU Allocation:
Within each district, rural and urban sectors constitute basic strata.
- In rural areas, if village population exceeds 1,200 as per Census, the village is divided into two or more sub-units termed 'Hamlet-Groups' (HGs) having roughly equal population (around 600 persons each). Two hamlet-groups are selected by Simple Random Sampling Without Replacement (SRSWOR).
- In urban areas, UFS blocks with population exceeding 1,200 are similarly partitioned into 'Sub-Blocks' (SBs), from which two sub-blocks are selected.

2. LISTING & HOUSEHOLD STRATIFICATION
In each selected FSU (or selected HGs/SBs combined), a complete door-to-door listing of all resident households is executed in Schedule 0.0.
Households are classified into Second Stage Strata (SSS) based on:
- SSS 1: Affluent/High-Income households (owning four-wheeler, tractor, or salaried member in organized sector)
- SSS 2: Middle-income households with principal income from non-agricultural enterprise
- SSS 3: Other remaining households (agricultural labor, informal wage workers)

From each SSS, sample households are drawn using Circular Systematic Sampling (CSS) with independent random starts to ensure representative coverage across wealth quintiles.

3. QUALITY AUDITING PROTOCOL
- Inspection Protocol: Minimum 10% of canvas schedules must be independently re-interviewed by Senior Statistical Officers.
- Scrutiny Program: Automated relational and range consistency checks in CAPI tablet software flag invalid response combinations.
- Replacement Rule: No substitution of selected sample households is permitted in the field without formal written authorization from the Regional Head of FOD.`,
  },
];

interface DocumentQuizStudioProps {
  availableCompetencies?: string[];
}

export const DocumentQuizStudio: React.FC<DocumentQuizStudioProps> = ({
  availableCompetencies = [],
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<5 | 10 | 15>(5);
  const [difficulty, setDifficulty] = useState<
    "mixed" | "easy" | "medium" | "hard"
  >("mixed");
  const [selectedCompetency, setSelectedCompetency] = useState<string>("all");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [generating, setGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<DocumentQuizResponse | null>(null);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, "a" | "b" | "c" | "d">
  >({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationStage, setEvaluationStage] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "correct" | "incorrect"
  >("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = (sample: (typeof SAMPLE_DOCS)[0]) => {
    const file = new File([sample.content], sample.name, {
      type: "text/plain",
    });
    setSelectedFile(file);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    try {
      setGenerating(true);
      setError(null);
      setGenerationStep("Uploading document to Gemini Files engine...");

      const timer1 = setTimeout(() => {
        setGenerationStep(
          "Analyzing document structure & statistical concepts...",
        );
      }, 1500);

      const timer2 = setTimeout(() => {
        setGenerationStep(
          `Synthesizing ${numQuestions} calibrated MCQs with explanations...`,
        );
      }, 3500);

      const competencyTags =
        selectedCompetency !== "all"
          ? [selectedCompetency]
          : availableCompetencies.length > 0
            ? availableCompetencies
            : undefined;

      const result = await aiService.generateDocumentQuiz(
        selectedFile,
        numQuestions,
        difficulty,
        competencyTags,
      );

      clearTimeout(timer1);
      clearTimeout(timer2);

      setQuizData(result);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setIsEvaluating(false);
      setEvaluationStage("");
      setReviewFilter("all");
    } catch (err: unknown) {
      console.error("Quiz generation failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate quiz from document.",
      );
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  };

  const handleSelectOption = (optionId: "a" | "b" | "c" | "d") => {
    if (isSubmitted || isEvaluating) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionId,
    }));
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    return quizData.questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctOptionId ? 1 : 0);
    }, 0);
  };

  const handleSubmitQuiz = () => {
    setIsEvaluating(true);
    setEvaluationStage(
      "Tabulating officer responses against official source standards...",
    );

    const t1 = setTimeout(() => {
      setEvaluationStage("Calibrating FRAC statistical competency scores...");
    }, 650);

    const t2 = setTimeout(() => {
      setEvaluationStage(
        "Finalizing assessment breakdown & technical rationales...",
      );
    }, 1300);

    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsEvaluating(false);
      setIsSubmitted(true);
      const score = calculateScore();
      const total = quizData?.questions.length || 1;
      if (score / total >= 0.7) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }, 1900);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setIsEvaluating(false);
    setEvaluationStage("");
    setCurrentIdx(0);
    setReviewFilter("all");
  };

  const handleReset = () => {
    setQuizData(null);
    setSelectedFile(null);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setIsEvaluating(false);
    setEvaluationStage("");
    setCurrentIdx(0);
    setError(null);
    setReviewFilter("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportJson = () => {
    if (!quizData) return;
    const blob = new Blob([JSON.stringify(quizData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quizData.quizTitle.replace(/[^a-zA-Z0-9]/g, "_")}_quiz.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const questions: DocumentQuizQuestion[] = quizData?.questions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = calculateScore();
  const scorePct =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="bg-white border-2 border-blue-900/40 rounded-lg shadow-sm ring-1 ring-blue-900/10 p-3.5 sm:p-6 animate-tab-enter space-y-4 sm:space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900" />

      <div className="border-b border-slate-200 pb-4 sm:pb-5 pt-1">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
          Document-Driven MCQ Quiz Generator
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Upload any official statistical manual, training handbook, survey
          schedule, or policy guideline. The AI engine analyzes the content
          directly and generates calibrated multi-choice questions with
          source-based explanations aligned with MoSPI competencies.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded flex items-start gap-3 text-xs text-red-800 animate-fade-in">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Generation Failed</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!quizData && !generating && (
        <div
          key="setup-view"
          className="space-y-4 sm:space-y-6 animate-fade-in"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
              1. Upload Learning Material
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-blue-600 bg-blue-50/60 scale-[0.99]"
                  : selectedFile
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.txt,.docx,.doc,.csv,.xlsx,.pptx,.md"
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2 max-w-full min-w-0 px-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="max-w-full min-w-0 text-center">
                    <p
                      className="text-xs sm:text-sm font-semibold text-slate-900 break-all leading-snug px-1"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to
                      change file
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full mt-1 text-center leading-tight">
                    <Check size={12} className="shrink-0" />
                    <span>Document Ready for Direct AI Evaluation</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-2 sm:py-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-800">
                      <span className="text-blue-900 font-semibold underline underline-offset-2">
                        Click to upload
                      </span>{" "}
                      or drag & drop learning material here
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Supported: PDF, TXT, DOCX, CSV, Markdown, Presentation
                      (Max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="text-amber-700 font-semibold font-mono text-[11px] uppercase">
                  Test Instantly:
                </span>
                <span className="text-[11px] text-slate-500">
                  Select a preloaded official MoSPI technical manual:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_DOCS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 text-[11px] font-semibold rounded cursor-pointer transition-all duration-200 inline-flex items-center gap-1 shadow-2xs btn-press"
                    title={sample.title}
                  >
                    <FileText size={11} className="text-blue-900" />
                    <span>{sample.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded">
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                2. Question Count
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {([5, 10, 15] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumQuestions(count)}
                    className={`py-2 px-1 sm:px-3 rounded text-xs font-semibold border text-center transition-all duration-200 cursor-pointer btn-press min-w-0 ${
                      numQuestions === count
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                    }`}
                  >
                    <span className="block text-sm sm:text-base font-bold font-mono">
                      {count}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate">
                      Questions
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded">
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                3. Difficulty Level
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-2">
                {[
                  { id: "mixed", label: "Mixed (40/40/20)" },
                  { id: "easy", label: "Easy (Foundational)" },
                  { id: "medium", label: "Medium (Applied)" },
                  { id: "hard", label: "Hard (Advanced)" },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() =>
                      setDifficulty(
                        diff.id as "mixed" | "easy" | "medium" | "hard",
                      )
                    }
                    className={`py-2 px-2.5 rounded text-[11px] font-medium border text-left transition-all duration-200 cursor-pointer btn-press leading-tight ${
                      difficulty === diff.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {availableCompetencies.length > 0 && (
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded">
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                4. Target Competency Focus (Optional)
              </label>
              <select
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer transition-colors"
              >
                <option value="all">
                  All Official FRAC Competencies (Auto-Map Closest Matches)
                </option>
                {availableCompetencies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedFile}
              className={`w-full py-3 px-3 sm:px-4 rounded font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer btn-press text-center leading-snug ${
                selectedFile
                  ? "bg-blue-900 hover:bg-blue-950 text-white shadow-xs"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              <FileText size={15} className="shrink-0" />
              <span className="break-words">
                Generate Assessment Quiz ({numQuestions} MCQs)
              </span>
            </button>
          </div>
        </div>
      )}

      {generating && (
        <div
          key="generating-view"
          className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in"
        >
          <div className="relative">
            <div className="w-16 h-16 border-3 border-blue-100 border-t-blue-900 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-blue-900">
              <FileText size={20} />
            </div>
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Generating MoSPI Assessment Quiz
            </h3>
            <p className="text-xs font-mono text-blue-900 font-semibold tracking-wide bg-blue-50 px-3 py-1.5 rounded-full inline-block border border-blue-200 animate-pulse-subtle">
              {generationStep || "Processing with Gemini Files API..."}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Uploading "{selectedFile?.name}" via Gemini Files API and
              calibrating {numQuestions} questions with source-based
              explanations.
            </p>
          </div>
        </div>
      )}

      {quizData && (
        <div key="player-view" className="space-y-6 animate-fade-in">
          {isEvaluating ? (
            /* EVALUATING TRANSITION VIEW */
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in bg-white rounded border border-slate-200 shadow-2xs p-8">
              <div className="relative">
                <div className="w-16 h-16 border-3 border-emerald-100 border-t-emerald-700 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-700">
                  <Award size={24} className="animate-bounce-soft" />
                </div>
              </div>
              <div className="max-w-md space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                  MoSPI Evaluation Engine
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  Grading Assessment & Calibrating Competencies
                </h3>
                <p className="text-xs font-mono text-slate-700 font-semibold tracking-wide bg-slate-100 px-3.5 py-1.5 rounded-full inline-block border border-slate-200">
                  {evaluationStage ||
                    "Tabulating officer responses against official source standards..."}
                </p>
                <div className="w-64 mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-emerald-600 h-full rounded-full animate-eval-progress" />
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Evaluating {answeredCount} answered of {totalQuestions}{" "}
                  questions and calculating statistical mastery ratings.
                </p>
              </div>
            </div>
          ) : !isSubmitted ? (
            /* LIVE QUESTION-BY-QUESTION TEST MODE */
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[10px] font-mono font-semibold uppercase">
                        Official Assessment
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {totalQuestions} Questions Total
                      </span>
                    </div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                      {quizData.quizTitle || "Official Assessment Quiz"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="px-3 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded border border-slate-300 font-medium cursor-pointer transition-all duration-200 btn-press"
                      title="Upload new file"
                    >
                      New Document
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1.5">
                    <span>
                      Question {currentIdx + 1} of {totalQuestions}
                    </span>
                    <span>
                      Answered: {answeredCount}/{totalQuestions}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-900 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${((currentIdx + 1) / totalQuestions) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isCurrent = idx === currentIdx;

                  let btnColor = "bg-white text-slate-700 border-slate-300";
                  if (isCurrent) {
                    btnColor =
                      "bg-slate-900 text-white border-slate-900 ring-2 ring-blue-300";
                  } else if (isAnswered) {
                    btnColor =
                      "bg-slate-200 text-slate-900 border-slate-300 font-semibold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`min-w-8 h-8 px-2 rounded text-xs font-mono border transition-all duration-200 cursor-pointer shrink-0 btn-press ${btnColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentQuestion && (
                <div
                  key={currentIdx}
                  className="bg-white border border-slate-300 rounded p-5 sm:p-6 shadow-2xs space-y-5 animate-fade-in card-interactive"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border animate-badge-pop ${
                        currentQuestion.difficulty === "easy"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : currentQuestion.difficulty === "medium"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                    {currentQuestion.competencyTag && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[10px] font-mono">
                        {currentQuestion.competencyTag}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    <span className="font-mono text-blue-900 mr-2">
                      Q{currentIdx + 1}.
                    </span>
                    {currentQuestion.text}
                  </h4>

                  <div className="space-y-2.5">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedAnswers[currentIdx] === opt.id;

                      let optionClass =
                        "border-slate-300 bg-white hover:bg-slate-50 text-slate-800";
                      let badgeClass =
                        "bg-slate-100 text-slate-600 border-slate-300";

                      if (isSelected) {
                        optionClass =
                          "border-blue-900 bg-blue-50/70 text-blue-950 font-medium ring-1 ring-blue-900";
                        badgeClass = "bg-blue-900 text-white border-blue-900";
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-3.5 rounded border transition-all duration-200 flex items-start gap-3 cursor-pointer btn-press ${optionClass}`}
                        >
                          <span
                            className={`w-6 h-6 rounded font-mono text-xs uppercase font-bold flex items-center justify-center shrink-0 border transition-all ${badgeClass}`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-xs sm:text-sm pt-0.5 leading-snug flex-1">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all duration-200 btn-press"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    {currentIdx < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIdx((p) =>
                            Math.min(totalQuestions - 1, p + 1),
                          )
                        }
                        className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-all duration-200 btn-press"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={answeredCount === 0}
                        className="px-5 py-2 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all duration-200 btn-press"
                      >
                        <CheckCircle2 size={15} /> Submit Evaluation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SUBMITTED ALL-QUESTIONS ROW BREAKDOWN VIEW */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-300 rounded p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Award size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                          Official Evaluation Scorecard
                        </span>
                        <span className="px-2 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono rounded">
                          {totalQuestions} Questions Evaluated
                        </span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                        {scorePct >= 80
                          ? "Exemplary Statistical Mastery"
                          : scorePct >= 60
                            ? "Proficient Understanding"
                            : "Evaluation Complete — Review Recommended"}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded">
                    <span className="text-3xl font-bold font-mono text-slate-900">
                      {score}/{totalQuestions}
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-700">
                      ({scorePct}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200 card-interactive">
                    <span className="text-[10px] font-mono uppercase text-emerald-800 font-semibold block">
                      Correct Answers
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-700">
                      {score}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded border border-red-200 card-interactive">
                    <span className="text-[10px] font-mono uppercase text-red-800 font-semibold block">
                      Incorrect / Skipped
                    </span>
                    <span className="text-xl font-bold font-mono text-red-600">
                      {totalQuestions - score}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded border border-blue-200 card-interactive">
                    <span className="text-[10px] font-mono uppercase text-blue-900 font-semibold block">
                      Accuracy Rating
                    </span>
                    <span className="text-xl font-bold font-mono text-blue-900">
                      {scorePct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    Comprehensive Question Review:
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReviewFilter("all")}
                    className={`px-3 py-1 text-xs font-semibold rounded border transition-all duration-200 cursor-pointer btn-press ${
                      reviewFilter === "all"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    All ({totalQuestions})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("correct")}
                    className={`px-3 py-1 text-xs font-semibold rounded border transition-all duration-200 cursor-pointer btn-press ${
                      reviewFilter === "correct"
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                        : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    Correct ({score})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("incorrect")}
                    className={`px-3 py-1 text-xs font-semibold rounded border transition-all duration-200 cursor-pointer btn-press ${
                      reviewFilter === "incorrect"
                        ? "bg-red-800 text-white border-red-800 shadow-xs"
                        : "bg-white text-red-800 border-red-300 hover:bg-red-50"
                    }`}
                  >
                    Incorrect ({totalQuestions - score})
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {questions
                  .map((q, idx) => ({ q, originalIdx: idx }))
                  .filter(({ q, originalIdx }) => {
                    const isCorrect =
                      selectedAnswers[originalIdx] === q.correctOptionId;
                    if (reviewFilter === "correct") return isCorrect;
                    if (reviewFilter === "incorrect") return !isCorrect;
                    return true;
                  })
                  .map(({ q, originalIdx }) => {
                    const userAns = selectedAnswers[originalIdx];
                    const isCorrect = userAns === q.correctOptionId;
                    const isUnanswered = !userAns;

                    return (
                      <div
                        key={originalIdx}
                        className={`bg-white border rounded p-5 sm:p-6 shadow-2xs space-y-4 transition-all duration-200 card-interactive ${
                          isCorrect
                            ? "border-slate-300 border-l-4 border-l-emerald-600"
                            : isUnanswered
                              ? "border-slate-300 border-l-4 border-l-slate-400"
                              : "border-slate-300 border-l-4 border-l-red-600"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Question {originalIdx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border animate-badge-pop ${
                                q.difficulty === "easy"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : q.difficulty === "medium"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            {q.competencyTag && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                                {q.competencyTag}
                              </span>
                            )}
                          </div>

                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded animate-badge-pop">
                              <CheckCircle2
                                size={13}
                                className="text-emerald-700"
                              />
                              <span>Correct (+1)</span>
                            </span>
                          ) : isUnanswered ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                              <span>Unanswered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded animate-badge-pop">
                              <XCircle size={13} className="text-red-600" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.text}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const isThisCorrect = opt.id === q.correctOptionId;
                            const isThisSelected = userAns === opt.id;

                            let optCardStyle =
                              "bg-slate-50/50 border-slate-200 text-slate-700";
                            let optBadgeStyle =
                              "bg-white border-slate-300 text-slate-600";

                            if (isThisCorrect) {
                              optCardStyle =
                                "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400";
                              optBadgeStyle =
                                "bg-emerald-600 border-emerald-600 text-white";
                            } else if (isThisSelected && !isThisCorrect) {
                              optCardStyle =
                                "bg-red-50 border-red-400 text-red-950 font-semibold ring-1 ring-red-400";
                              optBadgeStyle =
                                "bg-red-600 border-red-600 text-white";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded border text-xs flex items-start gap-2.5 transition-colors ${optCardStyle}`}
                              >
                                <span
                                  className={`w-5 h-5 rounded font-mono text-[11px] uppercase font-bold flex items-center justify-center shrink-0 border ${optBadgeStyle}`}
                                >
                                  {opt.id}
                                </span>
                                <span className="flex-1 pt-0.5 leading-snug">
                                  {opt.text}
                                </span>
                                {isThisCorrect && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-800 shrink-0 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                    ✓ Correct
                                  </span>
                                )}
                                {isThisSelected && !isThisCorrect && (
                                  <span className="text-[10px] font-mono font-bold text-red-800 shrink-0 bg-red-100/80 px-1.5 py-0.5 rounded">
                                    ✗ Your Selection
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                              <HelpCircle size={13} className="text-blue-900" />
                              <span>Source Document Rationale:</span>
                            </div>
                            <p className="leading-relaxed pl-5 text-slate-700">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-white p-4 rounded border">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 btn-press"
                >
                  <Download size={14} />
                  <span>Export Quiz JSON</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 btn-press"
                  >
                    <RotateCw size={14} />
                    <span>Retake Quiz</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 btn-press shadow-xs"
                  >
                    <Upload size={14} />
                    <span>Upload Another Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
