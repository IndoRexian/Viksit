import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Check, Edit2 } from "lucide-react";

interface ExperienceInputProps {
  value: string[];
  onChange: (experience: string[]) => void;
  placeholder?: string;
}

export const ExperienceInput: React.FC<ExperienceInputProps> = ({
  value,
  onChange,
  placeholder = "e.g. 4 years in Survey Design and Research Division (SDRD) - Sampling frame design for PLFS / ASHE",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const addExperience = (text: string) => {
    const trimmed = text.trim().replace(/^,|,$/g, "");
    if (trimmed) {
      const parts = trimmed
        .split(";")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const updated = [...value, ...parts];
      onChange(updated);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExperience(inputValue);
    }
  };

  const removeExperience = (indexToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(value[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      const updated = [...value];
      updated[editingIndex] = trimmed;
      onChange(updated);
    } else {
      removeExperience(editingIndex);
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditingText("");
    }
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Professional Service Record & Specializations
        </label>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {value.length} Record{value.length === 1 ? "" : "s"} Entered
        </span>
      </div>

      <div className="flex flex-col gap-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50 p-1.5">
        {value.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
            No service records added yet. Enter domain experience below.
          </div>
        ) : (
          value.map((exp, index) => {
            const indexNumber = String(index + 1).padStart(2, "0");

            if (editingIndex === index) {
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-blue-600 dark:border-blue-500 rounded p-2 shadow-xs"
                >
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
                    [{indexNumber}]
                  </span>
                  <input
                    ref={editInputRef}
                    type="text"
                    className="flex-1 border-none outline-none text-xs text-slate-900 dark:text-slate-100 bg-transparent"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                  />
                  <button
                    type="button"
                    className="bg-blue-700 dark:bg-blue-600 text-white rounded p-1 text-xs hover:bg-blue-800 dark:hover:bg-blue-500 cursor-pointer"
                    onClick={saveEdit}
                    title="Save"
                  >
                    <Check size={12} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="group flex items-start justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded p-2.5 transition-all duration-200 animate-badge-pop"
                onClick={() => startEditing(index)}
              >
                <div className="flex items-start gap-2.5 flex-1 pr-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                    [{indexNumber}]
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {exp}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 rounded transition-colors btn-press"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(index);
                    }}
                    title="Edit record"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-red-700 dark:hover:text-red-400 rounded transition-colors btn-press"
                    onClick={(e) => removeExperience(index, e)}
                    title="Delete record"
                    aria-label={`Remove record ${indexNumber}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="h-9 px-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 btn-press"
          onClick={() => addExperience(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus size={13} />
          Add Record
        </button>
      </div>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        Specify division, key survey rounds (e.g. NSS 78th Round, PLFS, ASI),
        national accounting accounts, or analytical responsibilities.
      </span>
    </div>
  );
};
