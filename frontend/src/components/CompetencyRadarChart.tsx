import React, { useState, useMemo, useCallback } from "react";
import { type CompetencyItem } from "../services/competencies";
import {
  Target,
  Award,
  FileText,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface CompetencyRadarChartProps {
  items: CompetencyItem[];
  userDesignation?: string;
  onAssessCompetency?: (comp: CompetencyItem) => void;
  onBridgeGap?: (comp: CompetencyItem) => void;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  items,
  userDesignation = "Official",
  onAssessCompetency,
  onBridgeGap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showTargetLayer, setShowTargetLayer] = useState<boolean>(true);
  const [showAssessedLayer, setShowAssessedLayer] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<CompetencyItem | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return items;
    if (selectedCategory === "gaps") {
      return items.filter((i) => i.status === "Skill Gap Identified");
    }
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const size = 520;
  const center = size / 2;
  const radius = size * 0.38;
  const totalLevels = 5;

  const totalAxes = Math.max(3, filteredItems.length);
  const angleStep = (2 * Math.PI) / totalAxes;

  const getPolygonPoints = useCallback(
    (levels: number[]) => {
      return levels
        .map((lvl, i) => {
          const currentRadius =
            (Math.max(0.5, Math.min(5, lvl)) / totalLevels) * radius;
          const angle = i * angleStep - Math.PI / 2;
          const x = center + currentRadius * Math.cos(angle);
          const y = center + currentRadius * Math.sin(angle);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    },
    [angleStep, center, radius, totalLevels],
  );

  const gridPolygons = useMemo(() => {
    return Array.from({ length: totalLevels }, (_, idx) => {
      const level = idx + 1;
      const points = Array.from({ length: totalAxes }, (_, i) => {
        const currentRadius = (level / totalLevels) * radius;
        const angle = i * angleStep - Math.PI / 2;
        const x = center + currentRadius * Math.cos(angle);
        const y = center + currentRadius * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return { level, points };
    });
  }, [totalAxes, angleStep, radius, center]);

  const axes = useMemo(() => {
    return Array.from({ length: totalAxes }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);
      const labelRadius = radius + 32;
      const lx = center + labelRadius * Math.cos(angle);
      const ly = center + labelRadius * Math.sin(angle);
      const item = filteredItems[i] || null;
      return { index: i, x2, y2, lx, ly, item, angle };
    });
  }, [totalAxes, angleStep, radius, center, filteredItems]);

  const targetPoints = useMemo(() => {
    const levels = filteredItems.map((item) => item.target_level);
    return getPolygonPoints(levels);
  }, [filteredItems, getPolygonPoints]);

  const assessedPoints = useMemo(() => {
    const levels = filteredItems.map((item) => item.assessed_level);
    return getPolygonPoints(levels);
  }, [filteredItems]);

  const summary = useMemo(() => {
    if (items.length === 0) {
      return {
        alignmentPct: 0,
        achievedCount: 0,
        gapCount: 0,
        topItem: null,
        urgentItem: null,
      };
    }
    const achieved = items.filter((i) => i.assessed_level >= i.target_level);
    const gaps = items.filter((i) => i.assessed_level < i.target_level);
    const totalProgress = items.reduce((acc, i) => {
      if (i.target_level <= 1) return acc + (i.assessed_level >= 1 ? 1 : 0);
      if (i.assessed_level >= i.target_level) return acc + 1;
      return acc + Math.max(0, (i.assessed_level - 1) / (i.target_level - 1));
    }, 0);
    const alignmentPct =
      items.length > 0 ? Math.round((totalProgress / items.length) * 100) : 0;

    const sortedByAssessed = [...items].sort(
      (a, b) => b.assessed_level - a.assessed_level,
    );
    const topItem = sortedByAssessed[0] || null;

    const sortedByGap = [...gaps].sort(
      (a, b) =>
        b.target_level - b.assessed_level - (a.target_level - a.assessed_level),
    );
    const urgentItem = sortedByGap[0] || null;

    return {
      alignmentPct,
      achievedCount: achieved.length,
      gapCount: gaps.length,
      topItem,
      urgentItem,
    };
  }, [items]);

  const activeHoverItem =
    hoveredIndex !== null && filteredItems[hoveredIndex]
      ? filteredItems[hoveredIndex]
      : selectedItem || (filteredItems.length > 0 ? filteredItems[0] : null);

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-900 text-white font-mono text-[10px] font-bold uppercase rounded">
              Interactive Radar Chart
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Cadre Target vs Assessed Proficiency
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            FRAC Competency Spider Graph
          </h3>
          <p className="text-xs text-slate-600">
            Cadre Benchmark standard mapped for{" "}
            <strong className="text-slate-800 font-semibold">
              {userDesignation}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded p-0.5 text-xs">
            {["all", "Domain", "Functional", "Behavioral", "gaps"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setHoveredIndex(null);
                  }}
                  className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-all duration-150 capitalize ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat === "all" ? "All" : cat === "gaps" ? "Gaps Only" : cat}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTargetLayer}
                onChange={(e) => setShowTargetLayer(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-amber-900 font-semibold text-[11px]">
                <span className="w-2.5 h-0.5 bg-amber-500 inline-block border-t border-dashed border-amber-700" />
                Cadre Target
              </span>
            </label>

            <span className="text-slate-300">|</span>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAssessedLayer}
                onChange={(e) => setShowAssessedLayer(e.target.checked)}
                className="rounded text-blue-700 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-blue-950 font-semibold text-[11px]">
                <span className="w-2.5 h-1 bg-blue-600 inline-block rounded-xs" />
                Assessed Level
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 items-center">
        <div className="xl:col-span-8 flex flex-col items-center justify-center relative">
          {filteredItems.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-500 gap-2">
              <CheckCircle2 size={32} className="text-emerald-600" />
              <p className="text-sm font-semibold">
                No competencies found for this filter.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-135 aspect-square relative select-none">
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-full h-full drop-shadow-xs overflow-visible"
              >
                <defs>
                  <radialGradient
                    id="targetRadialGradient"
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.05" />
                    <stop
                      offset="100%"
                      stopColor="#f59e0b"
                      stopOpacity="0.22"
                    />
                  </radialGradient>

                  <radialGradient
                    id="assessedRadialGradient"
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.15" />
                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity="0.45"
                    />
                  </radialGradient>

                  <filter
                    id="vertexGlow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {gridPolygons.map(({ level, points }) => (
                  <g key={`grid-${level}`}>
                    <polygon
                      points={points}
                      fill={
                        level % 2 === 0
                          ? "rgba(241, 245, 249, 0.6)"
                          : "rgba(248, 250, 252, 0.3)"
                      }
                      stroke="#cbd5e1"
                      strokeWidth={level === totalLevels ? "1.5" : "1"}
                      strokeDasharray={level === totalLevels ? "none" : "2 2"}
                    />
                    <text
                      x={center + 6}
                      y={center - (level / totalLevels) * radius + 10}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#94a3b8"
                    >
                      L{level}
                    </text>
                  </g>
                ))}

                {axes.map(({ index, x2, y2 }) => (
                  <line
                    key={`axis-${index}`}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                ))}

                {showTargetLayer && (
                  <g className="transition-all duration-500 ease-out">
                    <polygon
                      points={targetPoints}
                      fill="url(#targetRadialGradient)"
                      stroke="#d97706"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  </g>
                )}

                {showAssessedLayer && (
                  <g className="transition-all duration-500 ease-out">
                    <polygon
                      points={assessedPoints}
                      fill="url(#assessedRadialGradient)"
                      stroke="#1d4ed8"
                      strokeWidth="2.5"
                    />
                  </g>
                )}

                {axes.map(({ index, lx, ly, item, angle }) => {
                  if (!item) return null;
                  const isHovered = hoveredIndex === index;
                  const isAchieved = item.assessed_level >= item.target_level;

                  const tr = (item.target_level / totalLevels) * radius;
                  const tx = center + tr * Math.cos(angle);
                  const ty = center + tr * Math.sin(angle);

                  const ar = (item.assessed_level / totalLevels) * radius;
                  const ax = center + ar * Math.cos(angle);
                  const ay = center + ar * Math.sin(angle);

                  let textAnchor: "middle" | "start" | "end" = "middle";
                  const cosAngle = Math.cos(angle);
                  if (cosAngle > 0.3) textAnchor = "start";
                  else if (cosAngle < -0.3) textAnchor = "end";

                  return (
                    <g
                      key={`node-${index}`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onClick={() => setSelectedItem(item)}
                    >
                      {showTargetLayer && (
                        <circle
                          cx={tx}
                          cy={ty}
                          r={isHovered ? 5 : 3.5}
                          fill="#d97706"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}

                      {showAssessedLayer && (
                        <circle
                          cx={ax}
                          cy={ay}
                          r={isHovered ? 7 : 4.5}
                          fill={isAchieved ? "#059669" : "#dc2626"}
                          stroke="#ffffff"
                          strokeWidth="2"
                          filter={isHovered ? "url(#vertexGlow)" : undefined}
                          className="transition-all duration-150"
                        />
                      )}

                      <text
                        x={lx}
                        y={ly}
                        textAnchor={textAnchor}
                        fontSize={isHovered ? "11" : "10"}
                        fontWeight={isHovered ? "bold" : "600"}
                        fill={isHovered ? "#0f172a" : "#475569"}
                        className="transition-colors duration-150 select-none"
                      >
                        {item.code.replace("FRAC-", "")}
                      </text>

                      <circle
                        cx={ax}
                        cy={ay}
                        r={18}
                        fill="transparent"
                        className="cursor-pointer"
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xs border border-slate-300 rounded px-3 py-1.5 flex items-center gap-4 text-[11px] font-mono shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed border-amber-700" />
                  <span className="text-amber-900 font-semibold">
                    Cadre Benchmark
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block" />
                  <span className="text-emerald-900 font-semibold">
                    Benchmark Met
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full inline-block" />
                  <span className="text-rose-900 font-semibold">
                    Gap Identified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-4">
          {activeHoverItem ? (
            <div className="bg-slate-900 text-white rounded border border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-800 text-blue-100 rounded">
                    {activeHoverItem.code}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 font-mono text-[9px] font-bold rounded uppercase ${
                      activeHoverItem.category === "Domain"
                        ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                        : activeHoverItem.category === "Functional"
                          ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                          : "bg-amber-900/60 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {activeHoverItem.category}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeHoverItem.assessed_level >=
                    activeHoverItem.target_level
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {activeHoverItem.assessed_level >=
                  activeHoverItem.target_level
                    ? "Benchmark Met"
                    : `Gap: -${activeHoverItem.gap} Lvl`}
                </span>
              </div>

              <h4 className="font-serif text-base font-bold text-white mb-1 leading-snug">
                {activeHoverItem.name}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                {activeHoverItem.description ||
                  "Official FRAC competency standard for national statistical operations."}
              </p>

              <div className="space-y-2.5 bg-slate-950/60 p-3 rounded border border-slate-800/80 mb-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Target size={12} /> Cadre Target Requirement:
                    </span>
                    <span className="text-amber-300 font-bold">
                      Level {activeHoverItem.target_level} / 5
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(activeHoverItem.target_level / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-blue-400 font-semibold flex items-center gap-1">
                      <Award size={12} /> Current Assessed Score:
                    </span>
                    <span
                      className={`font-bold ${
                        activeHoverItem.assessed_level >=
                        activeHoverItem.target_level
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      Level {activeHoverItem.assessed_level} / 5
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        activeHoverItem.assessed_level >=
                        activeHoverItem.target_level
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                      style={{
                        width: `${(activeHoverItem.assessed_level / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onAssessCompetency && (
                  <button
                    onClick={() => onAssessCompetency(activeHoverItem)}
                    className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileText size={13} />
                    <span>Assess Quiz</span>
                  </button>
                )}
                {onBridgeGap && (
                  <button
                    onClick={() => onBridgeGap(activeHoverItem)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Bridge Gap</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ) : null}

          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Overall Cadre Alignment
            </span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono text-2xl font-bold text-slate-900">
                {summary.alignmentPct}%
              </span>
              <span className="text-xs font-mono text-slate-600">
                ({summary.achievedCount} of {items.length} Benchmarks Met)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-blue-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.alignmentPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
                <span className="text-emerald-800 font-semibold block text-[10px] uppercase">
                  Top Proficiency
                </span>
                <span className="font-medium text-emerald-950 truncate block mt-0.5">
                  {summary.topItem?.code.replace("FRAC-", "") || "None"} (L
                  {summary.topItem?.assessed_level || 0})
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2 rounded">
                <span className="text-amber-800 font-semibold block text-[10px] uppercase">
                  Priority Upskill
                </span>
                <span className="font-medium text-amber-950 truncate block mt-0.5">
                  {summary.urgentItem?.code.replace("FRAC-", "") || "None"} (-
                  {summary.urgentItem?.gap || 0} Lvl)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
