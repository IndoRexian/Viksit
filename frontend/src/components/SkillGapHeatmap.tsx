import React, { useState, useMemo } from "react";
import {
  type CompetencyItem,
  type DivisionSummary,
} from "../services/competencies";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Search,
  FileText,
  ArrowUpRight,
  Grid3X3,
  Layers,
  Building2,
  Info,
} from "lucide-react";

interface SkillGapHeatmapProps {
  items: CompetencyItem[];
  divisionSummaries?: DivisionSummary[];
  userDepartment?: string;
  userDesignation?: string;
  onAssessCompetency?: (comp: CompetencyItem) => void;
  onBridgeGap?: (comp: CompetencyItem) => void;
}

export const SkillGapHeatmap: React.FC<SkillGapHeatmapProps> = ({
  items,
  divisionSummaries = [],
  userDepartment = "National Accounts Division (NAD)",
  userDesignation = "Statistical Officer",
  onAssessCompetency,
  onBridgeGap,
}) => {
  const [viewMode, setViewMode] = useState<"matrix" | "cards">("matrix");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "urgent" | "gaps" | "achieved"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredComp, setHoveredComp] = useState<CompetencyItem | null>(null);
  const [pinnedComp, setPinnedComp] = useState<CompetencyItem | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");

  const groupedDivisions: DivisionSummary[] = useMemo(() => {
    if (divisionSummaries && divisionSummaries.length > 0) {
      return divisionSummaries;
    }

    const map: Record<string, CompetencyItem[]> = {};
    items.forEach((item) => {
      const dept = item.department || "General / Shared";
      if (!map[dept]) map[dept] = [];
      map[dept].push(item);
    });

    return Object.entries(map).map(([division, divItems]) => {
      const total = divItems.length;
      const achieved = divItems.filter((i) => i.gap === 0).length;
      const gaps = total - achieved;
      const urgent = divItems.filter(
        (i) => i.gap >= 2 || (i.assessed_level === 1 && i.target_level >= 3),
      ).length;
      const divProgress = divItems.reduce((acc, i) => {
        if (i.target_level <= 1) return acc + (i.assessed_level >= 1 ? 1 : 0);
        if (i.assessed_level >= i.target_level) return acc + 1;
        return acc + Math.max(0, (i.assessed_level - 1) / (i.target_level - 1));
      }, 0);
      const avgPct = total > 0 ? Math.round((divProgress / total) * 100) : 0;

      return {
        division,
        total_competencies: total,
        achieved_count: achieved,
        gap_count: gaps,
        urgent_gap_count: urgent,
        average_fulfillment_pct: avgPct,
        items: divItems,
      };
    });
  }, [items, divisionSummaries]);

  const filteredDivisions = useMemo(() => {
    return groupedDivisions
      .filter((div) => {
        if (selectedDivision === "all") return true;
        return div.division === selectedDivision;
      })
      .map((div) => {
        const filteredDivItems = div.items.filter((item) => {
          const isAchieved = item.assessed_level >= item.target_level;
          const isUrgent =
            item.gap >= 2 ||
            (item.assessed_level === 1 && item.target_level >= 3);

          if (statusFilter === "urgent" && !isUrgent) return false;
          if (statusFilter === "gaps" && isAchieved) return false;
          if (statusFilter === "achieved" && !isAchieved) return false;

          if (categoryFilter !== "all" && item.category !== categoryFilter) {
            return false;
          }

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const inCode = item.code.toLowerCase().includes(q);
            const inName = item.name.toLowerCase().includes(q);
            const inDesc = (item.description || "").toLowerCase().includes(q);
            const inCourses = item.mapped_course_names.some((c) =>
              c.toLowerCase().includes(q),
            );
            return inCode || inName || inDesc || inCourses;
          }

          return true;
        });

        return {
          ...div,
          items: filteredDivItems,
        };
      })
      .filter((div) => div.items.length > 0 || selectedDivision !== "all");
  }, [
    groupedDivisions,
    selectedDivision,
    statusFilter,
    categoryFilter,
    searchQuery,
  ]);

  const totalStats = useMemo(() => {
    const allFilteredItems = filteredDivisions.flatMap((d) => d.items);
    const total = allFilteredItems.length;
    const achieved = allFilteredItems.filter(
      (i) => i.assessed_level >= i.target_level,
    ).length;
    const urgent = allFilteredItems.filter(
      (i) => i.gap >= 2 || (i.assessed_level === 1 && i.target_level >= 3),
    ).length;
    const gaps = total - achieved;

    return { total, achieved, urgent, gaps };
  }, [filteredDivisions]);

  const getCellHeatStyle = (item: CompetencyItem) => {
    const isExceeded = item.assessed_level > item.target_level;
    const isAchieved = item.assessed_level === item.target_level;
    const isUrgent =
      item.gap >= 2 || (item.assessed_level === 1 && item.target_level >= 3);

    if (isExceeded) {
      return {
        bg: "bg-emerald-600 hover:bg-emerald-500",
        border: "border-emerald-500",
        text: "text-white",
        badge: "Exceeds Target",
        colorKey: "surplus",
      };
    }
    if (isAchieved) {
      return {
        bg: "bg-teal-600 hover:bg-teal-500",
        border: "border-teal-500",
        text: "text-white",
        badge: "Benchmark Met",
        colorKey: "achieved",
      };
    }
    if (isUrgent) {
      return {
        bg: "bg-rose-600 hover:bg-rose-500 ring-1 ring-rose-400/80 shadow-xs",
        border: "border-rose-500",
        text: "text-white",
        badge: "Urgent Upskill",
        colorKey: "urgent",
      };
    }
    return {
      bg: "bg-amber-500 hover:bg-amber-400",
      border: "border-amber-400",
      text: "text-slate-950",
      badge: "Minor Gap (-1)",
      colorKey: "minor",
    };
  };

  const activeComp =
    hoveredComp || pinnedComp || (items.length > 0 ? items[0] : null);

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-rose-900 text-white font-mono text-[10px] font-bold uppercase rounded">
              Division Heatmap
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Cadre Skill Gap & Benchmark Matrix
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-900">
            Cadre Skill Gap Heatmap by Division
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time heat grading of competencies for{" "}
            <strong className="text-slate-800 font-semibold">
              {userDesignation}
            </strong>{" "}
            in{" "}
            <strong className="text-slate-800 font-semibold">
              {userDepartment}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded text-xs">
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-2.5 py-1 font-semibold rounded cursor-pointer inline-flex items-center gap-1 transition-all duration-150 ${
                viewMode === "matrix"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Heatmap Matrix Grid"
            >
              <Grid3X3 size={13} />
              <span className="hidden sm:inline">Matrix Grid</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 font-semibold rounded cursor-pointer inline-flex items-center gap-1 transition-all duration-150 ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Division Breakdown Cards"
            >
              <Layers size={13} />
              <span className="hidden sm:inline">Division Cards</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Benchmark Achieved
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {totalStats.achieved} Competencies
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Urgent Upskilling
            </span>
            <span className="font-mono text-base font-bold text-rose-700">
              {totalStats.urgent} Critical Gaps
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Minor Skill Gaps
            </span>
            <span className="font-mono text-base font-bold text-amber-800">
              {totalStats.gaps - totalStats.urgent} Competencies
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900 shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Divisions Monitored
            </span>
            <span className="font-mono text-base font-bold text-slate-900">
              {filteredDivisions.length} Divisions
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-300 rounded text-xs">
            {[
              { id: "all", label: "All Items" },
              { id: "urgent", label: "🔥 Urgent Gaps" },
              { id: "gaps", label: "Skill Gaps" },
              { id: "achieved", label: "Met Benchmarks" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as typeof statusFilter)}
                className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-all duration-150 ${
                  statusFilter === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Domain">Domain</option>
            <option value="Functional">Functional</option>
            <option value="Behavioral">Behavioral</option>
          </select>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer max-w-50 truncate"
          >
            <option value="all">All MoSPI Divisions</option>
            {groupedDivisions.map((d) => (
              <option key={d.division} value={d.division}>
                {d.division}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-55">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search competency or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-4">
          {filteredDivisions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 rounded bg-slate-50 text-slate-500 text-xs">
              <CheckCircle2
                size={32}
                className="mx-auto mb-2 text-emerald-600"
              />
              <p className="font-semibold text-slate-700 text-sm">
                No competencies match the active filter criteria.
              </p>
              <p className="mt-1">
                Try resetting the status filter or clearing your search query.
              </p>
            </div>
          ) : viewMode === "matrix" ? (
            /* Matrix Grid View */
            <div className="space-y-4">
              {filteredDivisions.map((div) => {
                const isUserDept =
                  div.division
                    .toLowerCase()
                    .includes(userDepartment.toLowerCase()) ||
                  userDepartment
                    .toLowerCase()
                    .includes(div.division.toLowerCase());

                return (
                  <div
                    key={div.division}
                    className={`border rounded overflow-hidden transition-shadow duration-150 ${
                      isUserDept
                        ? "border-blue-300 bg-blue-50/20 shadow-xs"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2
                          size={14}
                          className={
                            isUserDept ? "text-blue-900" : "text-slate-600"
                          }
                        />
                        <span className="font-serif text-xs font-bold text-slate-900">
                          {div.division}
                        </span>
                        {isUserDept && (
                          <span className="px-1.5 py-0.2 bg-blue-900 text-white font-mono text-[9px] font-bold uppercase rounded">
                            Your Department
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-slate-600">
                          Readiness:{" "}
                          <strong className="text-slate-900">
                            {div.average_fulfillment_pct}%
                          </strong>
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          {div.achieved_count} Met
                        </span>
                        {div.urgent_gap_count > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-100 border border-rose-300 text-rose-800 font-bold rounded">
                            {div.urgent_gap_count} Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {div.items.map((item) => {
                        const style = getCellHeatStyle(item);
                        const isSelected = activeComp?.id === item.id;

                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHoveredComp(item)}
                            onClick={() => setPinnedComp(item)}
                            className={`p-2.5 rounded border transition-all duration-150 cursor-pointer text-left relative select-none ${style.bg} ${style.border} ${style.text} ${
                              isSelected
                                ? "ring-2 ring-slate-900 ring-offset-2 scale-[1.02]"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] font-bold tracking-tight uppercase opacity-90">
                                {item.code.replace("FRAC-", "")}
                              </span>
                              {item.gap >= 2 ? (
                                <Flame
                                  size={12}
                                  className="text-amber-200 shrink-0"
                                />
                              ) : item.gap === 0 ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-emerald-200 shrink-0"
                                />
                              ) : null}
                            </div>

                            <p className="text-[11px] font-semibold line-clamp-2 leading-snug mb-2">
                              {item.name}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/20">
                              <span className="opacity-90">
                                Cur: <strong>L{item.assessed_level}</strong>
                              </span>
                              <span className="opacity-90">
                                Req: <strong>L{item.target_level}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Cards View */
            <div className="space-y-4">
              {filteredDivisions.map((div) => (
                <div
                  key={div.division}
                  className="bg-white border border-slate-300 rounded p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-blue-900" />
                      <h4 className="font-serif text-sm font-bold text-slate-900">
                        {div.division}
                      </h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {div.average_fulfillment_pct}% Target Met
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${div.average_fulfillment_pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {div.items.map((item) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPinnedComp(item)}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded hover:border-slate-400 cursor-pointer transition-colors flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[10px] font-bold text-blue-900">
                                {item.code}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                                  item.gap === 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.gap >= 2
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.gap === 0
                                  ? "Achieved"
                                  : `Gap: -${item.gap}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-medium truncate">
                              {item.name}
                            </p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                            L{item.assessed_level}/{item.target_level}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono font-bold uppercase text-[10px] text-slate-600">
              Heat Intensity Scale:
            </span>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-emerald-600 rounded-xs inline-block" />
                <span className="text-emerald-950 font-medium">
                  Exceeds Benchmark
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-teal-600 rounded-xs inline-block" />
                <span className="text-teal-950 font-medium">Benchmark Met</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-amber-500 rounded-xs inline-block" />
                <span className="text-amber-950 font-medium">
                  Minor Gap (-1)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-rose-600 rounded-xs inline-block animate-pulse-subtle" />
                <span className="text-rose-950 font-bold">
                  Urgent Upskill (≥2 Gaps)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          {activeComp ? (
            <div className="bg-slate-900 text-white rounded border border-slate-800 p-5 shadow-sm sticky top-20">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-800 text-blue-100 rounded">
                    {activeComp.code}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase ${
                      activeComp.category === "Domain"
                        ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                        : activeComp.category === "Functional"
                          ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                          : "bg-amber-900/60 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {activeComp.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeComp.assessed_level >= activeComp.target_level
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : activeComp.gap >= 2
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {activeComp.assessed_level >= activeComp.target_level
                    ? "Benchmark Met"
                    : activeComp.gap >= 2
                      ? `Urgent Gap: -${activeComp.gap}`
                      : `Minor Gap: -${activeComp.gap}`}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  {activeComp.department}
                </span>
                <h4 className="font-serif text-base font-bold text-white mt-0.5 leading-snug">
                  {activeComp.name}
                </h4>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                {activeComp.description ||
                  "National statistical standard competency outlined in FRAC framework."}
              </p>

              <div className="bg-slate-950/70 p-3.5 rounded border border-slate-800 space-y-3 mb-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">
                    Cadre Benchmark (Required):
                  </span>
                  <span className="font-bold text-amber-400">
                    Level {activeComp.target_level} of 5
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">
                    Official Assessed Score:
                  </span>
                  <span
                    className={`font-bold ${
                      activeComp.assessed_level >= activeComp.target_level
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    Level {activeComp.assessed_level} of 5
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isPassed = lvl <= activeComp.assessed_level;
                    const isReq = lvl <= activeComp.target_level;

                    return (
                      <div
                        key={lvl}
                        className={`flex-1 h-2 rounded-xs transition-colors ${
                          isPassed
                            ? "bg-emerald-500"
                            : isReq
                              ? "bg-amber-500/50 border border-dashed border-amber-500"
                              : "bg-slate-800"
                        }`}
                        title={`Level ${lvl}`}
                      />
                    );
                  })}
                </div>
              </div>

              {activeComp.mapped_course_names &&
                activeComp.mapped_course_names.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      Recommended iGOT Pathways:
                    </span>
                    <div className="space-y-1.5">
                      {activeComp.mapped_course_names
                        .slice(0, 2)
                        .map((cName, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded text-slate-200 font-medium truncate"
                          >
                            • {cName}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div className="flex items-center gap-2">
                {onAssessCompetency && (
                  <button
                    onClick={() => onAssessCompetency(activeComp)}
                    className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileText size={13} />
                    <span>Assess Quiz</span>
                  </button>
                )}
                {onBridgeGap && (
                  <button
                    onClick={() => onBridgeGap(activeComp)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>View Courses</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-xs text-slate-500">
              <Info size={20} className="mx-auto mb-2 text-slate-400" />
              Hover or click on any heatmap cell to inspect competency details,
              benchmarks, and linked learning pathways.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
