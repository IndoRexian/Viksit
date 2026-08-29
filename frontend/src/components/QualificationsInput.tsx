import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface QualificationsInputProps {
  value: string[];
  onChange: (qualifications: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

export const QualificationsInput: React.FC<QualificationsInputProps> = ({
  value,
  onChange,
  placeholder = "e.g. M.Sc Statistics, B.Tech Computer Science, PG Diploma in Econometrics",
  hasError = false,
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

  const addPill = (text: string) => {
    const trimmed = text.trim().replace(/^,|,$/g, "");
    if (trimmed) {
      const parts = trimmed
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const updated = [...value, ...parts];
      onChange(Array.from(new Set(updated)));
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addPill(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      addPill(val);
    } else {
      setInputValue(val);
    }
  };

  const removePill = (indexToRemove: number, e?: React.MouseEvent) => {
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
      removePill(editingIndex);
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditingText("");
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Educational Qualifications <span className="text-red-600">*</span>
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          Press [Enter] or comma to add
        </span>
      </div>

      <div
        className={`min-h-[44px] bg-white rounded border px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 transition-colors cursor-text ${
          hasError
            ? "border-red-500 ring-1 ring-red-500 bg-red-50/20"
            : "border-slate-300 focus-within:border-blue-700 focus-within:ring-1 focus-within:ring-blue-700 shadow-xs"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((qualification, index) => {
          if (editingIndex === index) {
            return (
              <div
                key={index}
                className="inline-flex items-center gap-1 bg-blue-50 border border-blue-600 rounded px-2 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={editInputRef}
                  type="text"
                  className="border-none bg-transparent outline-none text-xs font-medium text-slate-900 px-1 py-0.5"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                />
                <button
                  type="button"
                  className="bg-blue-700 text-white border-none rounded p-0.5 flex items-center justify-center hover:bg-blue-800 cursor-pointer"
                  onClick={saveEdit}
                  title="Save qualification"
                >
                  <Check size={11} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-200 select-none animate-badge-pop"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(index);
              }}
              title="Click to edit entry"
            >
              <span>{qualification}</span>
              <button
                type="button"
                className="inline-flex items-center justify-center p-0.5 text-slate-400 hover:text-red-700 transition-colors btn-press"
                onClick={(e) => removePill(index, e)}
                title="Remove qualification"
                aria-label={`Remove ${qualification}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <div className="flex-1 min-w-[200px]">
          <input
            ref={inputRef}
            type="text"
            className="w-full border-none outline-none bg-transparent text-xs text-slate-900 placeholder:text-slate-400 py-1"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length === 0 ? placeholder : "Add qualification..."
            }
          />
        </div>
      </div>

      {hasError ? (
        <span className="text-[11px] font-medium text-red-600">
          At least one verified educational qualification is required.
        </span>
      ) : (
        <span className="text-[11px] text-slate-500">
          Degrees in Statistics, Mathematics, Economics, Demography, Data
          Science, or related fields.
        </span>
      )}
    </div>
  );
};
