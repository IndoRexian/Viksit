import React, { useState, useEffect } from "react";
import type { CompetencyItem } from "../services/competencies";
import { aiService, type SkillAssessmentResponse } from "../services/ai";
import { competencyService } from "../services/competencies";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  RotateCw,
  Check,
  FileText,
} from "lucide-react";

interface AssessmentQuizModalProps {
  isOpen: boolean;
  competency: CompetencyItem | null;
  userDepartment: string;
  onClose: () => void;
  onAssessmentCompleted: (competencyId: number, newLevel: number) => void;
}

export const AssessmentQuizModal: React.FC<AssessmentQuizModalProps> = ({
  isOpen,
  competency,
  userDepartment,
  onClose,
  onAssessmentCompleted,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<SkillAssessmentResponse | null>(
    null,
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, "A" | "B" | "C" | "D">
  >({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAnimatedClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShouldRender(false);
    }, 180);
  };

  useEffect(() => {
    if (isOpen && competency) {
      loadQuiz();
    } else {
      setQuizData(null);
      setError(null);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setSaveSuccess(false);
    }
  }, [isOpen, competency]);

  const loadQuiz = async () => {
    if (!competency) return;
    try {
      setLoading(true);
      setError(null);
      setIsSubmitted(false);
      setSelectedAnswers({});
      setCurrentIdx(0);
      setSaveSuccess(false);

      const targetLevel = competency.target_level || 2;
      const data = await aiService.getCompetencyQuiz({
        competency: competency.name,
        description: competency.description || competency.name,
        category: competency.category || "Domain",
        department: userDepartment || competency.department || "MoSPI",
        level: targetLevel,
      });

      setQuizData(data);
    } catch (err: unknown) {
      console.error("Failed to generate assessment quiz:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate assessment evaluation items.",
      );
    } finally {
      setLoading(false);
    }
  };

  if ((!shouldRender && !isOpen) || !competency) return null;

  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optionKey: "A" | "B" | "C" | "D") => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionKey,
    }));
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    return quizData.questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correct_answer ? 1 : 0);
    }, 0);
  };

  const getNewEvaluatedLevel = (score: number, total: number) => {
    const ratio = total > 0 ? score / total : 0;
    const target = competency.target_level || 2;
    const current = competency.assessed_level || 0;

    if (ratio >= 0.8) {
      return Math.min(5, Math.max(target, current));
    } else if (ratio >= 0.6) {
      return Math.max(1, Math.min(5, Math.max(current, target - 1)));
    } else {
      return Math.max(1, current);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitted(true);
    const score = calculateScore();
    const evaluatedLevel = getNewEvaluatedLevel(score, totalQuestions);

    try {
      await competencyService.updateAssessment(competency.id, evaluatedLevel);
      setSaveSuccess(true);
      onAssessmentCompleted(competency.id, evaluatedLevel);
    } catch (err) {
      console.error("Failed to update assessment score:", err);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAnimatedClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto ${
        isClosing ? "animate-backdrop-exit" : "animate-backdrop-enter"
      }`}
    >
      <div
        className={`bg-white border border-slate-300 rounded-lg shadow-xl max-w-2xl w-full my-8 overflow-hidden flex flex-col relative max-h-[90vh] ${
          isClosing ? "animate-modal-exit" : "animate-modal-enter"
        }`}
      >
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                <FileText size={11} className="text-amber-400" />
                FRAC Competency Assessment
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {competency.code}
              </span>
            </div>
            <h2 className="font-serif text-lg font-bold text-white leading-tight">
              {competency.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span>
                Category: <strong>{competency.category}</strong>
              </span>
              <span>•</span>
              <span>
                Benchmark Requirement:{" "}
                <strong className="text-amber-400">
                  Level {competency.target_level}
                </strong>
              </span>
            </div>
          </div>

          <button
            onClick={handleAnimatedClose}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors shrink-0"
            title="Close evaluation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-9 h-9 border-2 border-slate-300 border-t-blue-900 rounded-full animate-spin" />
              <div>
                <p className="font-serif text-base font-bold text-slate-900">
                  Calibrating Competency Evaluation...
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Preparing 5 scenario-based assessment questions aligned with{" "}
                  <strong>Level {competency.target_level} proficiency</strong>{" "}
                  standards for <strong>{userDepartment || "MoSPI"}</strong>.
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
              <div className="p-2.5 bg-red-50 text-red-700 rounded-full border border-red-200">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-slate-900">
                Assessment Load Failed
              </h3>
              <p className="text-xs text-slate-600 max-w-md">{error}</p>
              <button
                onClick={loadQuiz}
                className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            quizData &&
            !isSubmitted &&
            currentQuestion && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        Question {currentIdx + 1} of {totalQuestions}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({answeredCount} of {totalQuestions} answered)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {questions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentIdx(i)}
                          className={`w-6 h-6 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                            currentIdx === i
                              ? "bg-slate-900 text-white border-slate-900"
                              : selectedAnswers[i]
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-blue-900 h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>

                <div className="space-y-2">
                  {(
                    Object.keys(currentQuestion.options) as Array<
                      "A" | "B" | "C" | "D"
                    >
                  ).map((optKey) => {
                    const optText = currentQuestion.options[optKey];
                    const isSelected = selectedAnswers[currentIdx] === optKey;

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelectOption(optKey)}
                        className={`w-full text-left p-3.5 rounded border text-xs transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-900 text-blue-950 font-medium shadow-xs"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-blue-900 text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}
                        >
                          {optKey}
                        </span>
                        <span className="leading-relaxed flex-1">
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIdx((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentIdx === 0}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentIdx < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIdx((prev) =>
                            Math.min(totalQuestions - 1, prev + 1),
                          )
                        }
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={answeredCount < totalQuestions}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                      >
                        <span>Submit Evaluation</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          {!loading && !error && quizData && isSubmitted && (
            <div className="space-y-6">
              {(() => {
                const score = calculateScore();
                const evaluatedLevel = getNewEvaluatedLevel(
                  score,
                  totalQuestions,
                );
                const isPassed = score >= 3;

                return (
                  <div
                    className={`p-5 rounded border ${
                      isPassed
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-slate-100 border-slate-300 text-slate-900"
                    } flex flex-col sm:flex-row items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded flex items-center justify-center shrink-0 ${
                          isPassed
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-800 text-white"
                        }`}
                      >
                        <Award size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-bold">
                            {isPassed
                              ? "Proficiency Benchmark Validated"
                              : "Proficiency Level Maintained"}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-white border border-slate-300">
                            {score} / {totalQuestions} Correct (
                            {Math.round((score / totalQuestions) * 100)}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Evaluated Level:{" "}
                          <strong className="text-slate-900 font-bold">
                            Level {evaluatedLevel}
                          </strong>{" "}
                          • Cadre Target:{" "}
                          <strong>Level {competency.target_level}</strong>
                        </p>
                      </div>
                    </div>

                    {saveSuccess && (
                      <div className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 size={14} />
                        <span>Matrix Updated</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3">
                <h3 className="font-serif text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Item Evaluation & Rationales</span>
                  <span className="text-xs font-sans font-normal text-slate-500">
                    Review responses
                  </span>
                </h3>

                {questions.map((q, idx) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.correct_answer;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded border text-xs space-y-2.5 ${
                        isCorrect
                          ? "bg-slate-50 border-slate-200"
                          : "bg-red-50/20 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                            isCorrect
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {isCorrect ? <Check size={11} /> : "✗"}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 leading-snug">
                            Q{idx + 1}: {q.question}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                        {(
                          Object.keys(q.options) as Array<"A" | "B" | "C" | "D">
                        ).map((optKey) => {
                          const isCorrectOpt = optKey === q.correct_answer;
                          const isUserSelected = userAns === optKey;

                          let style =
                            "bg-white border-slate-200 text-slate-700";
                          if (isCorrectOpt) {
                            style =
                              "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold";
                          } else if (isUserSelected && !isCorrectOpt) {
                            style =
                              "bg-slate-100 border-slate-300 text-slate-800";
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-2 rounded border text-[11px] flex items-start gap-2 ${style}`}
                            >
                              <span className="font-mono font-bold shrink-0">
                                {optKey}.
                              </span>
                              <span className="flex-1">
                                {q.options[optKey]}
                              </span>
                              {isCorrectOpt && (
                                <span className="text-[10px] font-mono text-emerald-800 font-bold shrink-0">
                                  ✓ Correct
                                </span>
                              )}
                              {isUserSelected && !isCorrectOpt && (
                                <span className="text-[10px] font-mono text-slate-600 font-bold shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="ml-7 p-2.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700 leading-relaxed">
                          <strong className="text-slate-900 font-semibold">
                            Technical Basis:{" "}
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAnimatedClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close & View Updated Matrix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
