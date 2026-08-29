import React, { useState } from "react";
import { type CourseCompletionResponse } from "../services/courses";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  TrendingUp,
  X,
} from "lucide-react";

interface CourseCompletionCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  completionData: CourseCompletionResponse | null;
  onViewDossier?: () => void;
  onDownloadCertificate?: () => void;
}

export const CourseCompletionCelebrationModal: React.FC<
  CourseCompletionCelebrationModalProps
> = ({
  isOpen,
  onClose,
  completionData,
  onViewDossier,
  onDownloadCertificate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !completionData) return null;

  const handleCopyCert = () => {
    if (completionData.certificate_id) {
      navigator.clipboard.writeText(completionData.certificate_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-backdrop-enter">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-lg shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter text-slate-900 dark:text-slate-100">
        <div className="bg-radial from-slate-900 via-slate-950 to-blue-950 text-white p-6 text-center relative border-b-2 border-amber-500">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors btn-press"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-radial from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 mb-3 animate-float">
            <Award size={32} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold block animate-pulse-subtle">
              iGOT Karmayogi • NSSTA Certified Learning Loop
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Course Completed & Competency Elevated!
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your training completion has been verified and registered on the
              MoSPI Digital Competency Ledger.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-4 card-interactive">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-1">
              Accredited Curriculum
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {completionData.course_name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded font-semibold font-mono animate-badge-pop">
                <CheckCircle2 size={13} /> 100% Completed
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-mono">
                {new Date(completionData.completed_at).toLocaleDateString(
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp
                  size={16}
                  className="text-emerald-700 dark:text-emerald-400 animate-bounce-soft"
                />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                  Automatic Competency Elevation (L1 ➔ L2/L3)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold animate-badge-pop">
                Auto-Upskilling Active
              </span>
            </div>

            {completionData.elevated_competencies.length > 0 ? (
              <div className="space-y-2">
                {completionData.elevated_competencies.map((comp) => (
                  <div
                    key={comp.competency_id}
                    className="p-3 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 card-interactive"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {comp.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {comp.code}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {comp.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded">
                          L{comp.previous_level}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          ➔
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold rounded shadow-2xs animate-badge-pop">
                          L{comp.new_level}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        (Target: L{comp.target_level})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded">
                General domain competencies and micro-credits accredited to your
                profile.
              </p>
            )}
          </div>

          <div className="border border-amber-300 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded flex items-center justify-between gap-3 card-interactive">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 dark:text-amber-300 font-semibold block">
                Official Credential Verification ID
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 select-all">
                {completionData.certificate_id}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCert}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-300 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-2xs btn-press"
              >
                {copied ? (
                  <>
                    <CheckCircle2
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
          {onDownloadCertificate && (
            <button
              onClick={() => {
                onDownloadCertificate();
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press"
            >
              <Download size={13} />
              <span>Download Official Certificate</span>
            </button>
          )}

          {onViewDossier && (
            <button
              onClick={() => {
                onClose();
                onViewDossier();
              }}
              className="px-4 py-2 bg-blue-900 dark:bg-blue-600 hover:bg-blue-950 dark:hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-xs btn-press"
            >
              <span>View in Service Dossier</span>
              <ChevronRight size={13} />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium cursor-pointer transition-all duration-200 btn-press"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
