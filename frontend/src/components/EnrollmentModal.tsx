import React, { useState, useEffect } from "react";
import type { Course } from "../services/courses";
import {
  CheckCircle2,
  Clock,
  Users,
  Award,
  X,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface EnrollmentModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  course,
  onClose,
}) => {
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
  }, [isClosing, isOpen, shouldRender]);

  const handleAnimatedClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShouldRender(false);
    }, 180);
  };

  if ((!shouldRender && !isOpen) || !course) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAnimatedClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs ${
        isClosing ? "animate-backdrop-exit" : "animate-backdrop-enter"
      }`}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xl max-w-xl w-full overflow-hidden flex flex-col relative text-slate-900 dark:text-slate-100 ${
          isClosing ? "animate-modal-exit" : "animate-modal-enter"
        }`}
      >
        <button
          onClick={handleAnimatedClose}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded bg-slate-900/70 hover:bg-slate-900 text-white cursor-pointer transition-colors btn-press"
          title="Close modal"
        >
          <X size={15} />
        </button>

        <div className="relative h-40 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
          {course.image ? (
            <img
              src={course.image}
              alt={course.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-400">
              <BookOpen size={32} />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
                MoSPI • Mission Karmayogi
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm animate-badge-pop">
              <CheckCircle2 size={13} />
              <span>Enrollment Confirmed</span>
            </div>

            {course.difficulty_level && (
              <span className="px-2.5 py-0.5 bg-slate-900/90 border border-slate-700 text-slate-200 text-[11px] font-mono font-medium rounded">
                {course.difficulty_level}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            {course.by && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                {course.by}
              </span>
            )}
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {course.name}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded text-xs card-interactive">
            <div className="flex items-center gap-2">
              <Clock
                size={14}
                className="text-slate-600 dark:text-slate-400 shrink-0"
              />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Duration
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {course.duration != null
                    ? `${course.duration} Hours`
                    : "Self-paced"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users
                size={14}
                className="text-slate-600 dark:text-slate-400 shrink-0"
              />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Enrolled Cadre
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {course.enrollees || 1} Officers
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award
                size={14}
                className="text-slate-600 dark:text-slate-400 shrink-0"
              />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Framework
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  iGOT / NSSTA
                </span>
              </div>
            </div>
          </div>

          {course.course_description && (
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Curriculum Scope & Competency Focus:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                {course.course_description}
              </p>
            </div>
          )}

          {course.tags && course.tags.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Competency Tags:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {course.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Added to your Active Learning Dossier
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleAnimatedClose}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded cursor-pointer transition-all duration-200 btn-press w-full sm:w-auto"
              >
                Close
              </button>
              <a
                href="https://portal.igotkarmayogi.gov.in"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-blue-900 dark:bg-blue-600 hover:bg-blue-950 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded inline-flex items-center justify-center gap-1.5 transition-all duration-200 btn-press w-full sm:w-auto shadow-xs"
              >
                <span>Go to iGOT Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
