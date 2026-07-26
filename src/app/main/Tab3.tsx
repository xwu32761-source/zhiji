"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { DiaryEntryData } from "@/lib/types";
import { getStorageItem, KEYS } from "@/lib/storage";
import { fetchEntries as apiFetchEntries } from "@/lib/api-client";

const STORAGE_KEY = KEYS.DIARY_ENTRIES;
const REGISTER_YEAR = 2026;
const REGISTER_MONTH = 7;
const NOW = { year: 2026, month: 7 };
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

// ============ Data helpers ============

function loadEntries(): DiaryEntryData[] {
  return getStorageItem<DiaryEntryData[]>(STORAGE_KEY, []);
}

interface DayGroupItem {
  time: string;
  tag: string;
  intensity: number;
  score: number;
  note: string;
  entryType: string;
  aiHook: string | null;
}

interface DayGroup {
  date: string;
  day: string;
  items: DayGroupItem[];
}

function groupEntriesByDate(entries: DiaryEntryData[]): DayGroup[] {
  const groups: Record<string, DayGroup> = {};

  entries.forEach((e) => {
    // entryDate may be "2026-07-25" or "2026-07-25T14:51:40.889Z"
    const dateOnly = e.entryDate.slice(0, 10);
    if (!groups[dateOnly]) {
      const d = new Date(dateOnly + "T00:00:00");
      groups[dateOnly] = {
        date: dateOnly,
        day: DAY_NAMES[d.getDay()],
        items: [],
      };
    }
    groups[dateOnly].items.push({
      time: e.createdAt.slice(11, 16),
      tag: e.coreTag || "未标记",
      intensity: e.intensity || 0,
      score: e.score || 0,
      note: e.note || "",
      entryType: e.entryType || "emotion",
      aiHook: e.aiHook || null,
    });
  });

  // Sort items within each day by time descending
  Object.values(groups).forEach((g) => {
    g.items.sort((a, b) => b.time.localeCompare(a.time));
  });

  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

function filterEntries(entries: DiaryEntryData[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((d) => d.entryDate.startsWith(prefix));
}

function monthsWithData(entries: DiaryEntryData[]): Set<string> {
  const s = new Set<string>();
  entries.forEach((d) => s.add(d.entryDate.slice(0, 7)));
  return s;
}

function getWeekSummary(entries: DiaryEntryData[]) {
  const grouped = groupEntriesByDate(entries);

  const scores = grouped.map((g) => ({
    label: g.date.slice(5),
    score: g.items.reduce((s, i) => s + i.score, 0),
    high: Math.max(...g.items.map((i) => i.score)),
    low: Math.min(...g.items.map((i) => i.score)),
  }));

  const tagCounts: Record<string, number> = {};
  grouped.forEach((g) => g.items.forEach((i) => {
    tagCounts[i.tag] = (tagCounts[i.tag] || 0) + 1;
  }));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const totalPoints = scores.reduce((s, sc) => s + sc.score, 0);

  return { scores, topTags: sortedTags.slice(0, 3), totalScore: totalPoints };
}

// ============ Emotion line chart (SVG) ============
function EmotionLineChart({ data }: { data: { label: string; score: number; high: number; low: number }[] }) {
  const W = 280;
  const H = 120;
  const maxScore = 5;
  const minScore = -5;
  const range = maxScore - minScore;
  const padding = { left: 20, right: 10, top: 10, bottom: 20 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

  const toY = (s: number) => padding.top + chartH - ((s - minScore) / range) * chartH;
  const toX = (i: number) => padding.left + i * xStep;

  if (data.length === 0) {
    return <div className="text-xs text-white/70 text-center py-10">暂无数据</div>;
  }

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.score)}`).join(" ");
  const areaPath = `${linePath} L${toX(data.length - 1)},${toY(minScore)} L${toX(0)},${toY(minScore)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px] h-auto">
      <line x1={padding.left} y1={toY(0)} x2={W - padding.right} y2={toY(0)} stroke="#ffffff30" strokeWidth="1" strokeDasharray="4" />
      <path d={areaPath} fill="url(#gradient)" opacity="0.25" />
      <path d={linePath} fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.score)} r="4" fill="#818CF8" stroke="#0a0a14" strokeWidth="2" />
          {d.score === d.high && d.score > 1 && (
            <text x={toX(i)} y={toY(d.score) - 10} textAnchor="middle" className="text-[9px]" fill="#8BCB9E">+{d.score}</text>
          )}
          {d.score === d.low && d.score < -1 && (
            <text x={toX(i)} y={toY(d.score) + 16} textAnchor="middle" className="text-[9px]" fill="#F5A3A3">{d.score}</text>
          )}
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" className="text-[9px]" fill="#ffffff60">{d.label}</text>
      ))}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============ Rainbow donut chart (SVG) ============
function RainbowRing({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 50;
  const CX = 60;
  const CY = 60;
  const strokeW = 20;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  if (data.length === 0) {
    return <div className="text-xs text-white/70 text-center py-10">暂无数据</div>;
  }

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      {data.map((d, i) => {
        const pct = d.value / total;
        const len = circ * pct;
        const dash = `${len} ${circ - len}`;
        const rotate = (offset / circ) * 360;
        offset += len;
        return (
          <circle
            key={i} cx={CX} cy={CY} r={R} fill="none" stroke={d.color}
            strokeWidth={strokeW} strokeDasharray={dash}
            transform={`rotate(${rotate} ${CX} ${CY})`}
            strokeLinecap="butt" className="transition-all duration-700"
          />
        );
      })}
      <text x={CX} y={CY + 4} textAnchor="middle" className="text-[10px]" fill="#ffffff" fontWeight="bold">{total}</text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="text-[7px]" fill="#ffffff70">记录</text>
    </svg>
  );
}

// =========== Weekly Report Modal ===========
function WeeklyReportModal({ entries, onClose }: { entries: DiaryEntryData[]; onClose: () => void }) {
  const summary = getWeekSummary(entries);
  const totalEntries = entries.length;

  const emotionColors: Record<string, string> = {
    "开心": "#8BCB9E", "平静": "#818CF8", "焦虑": "#F5A3A3",
    "愤怒": "#E87373", "悲伤": "#9B8EC4", "爱/信任": "#F0C27A",
  };
  const tagFreq: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.coreTag) tagFreq[e.coreTag] = (tagFreq[e.coreTag] || 0) + 1;
  });
  const ringData = Object.entries(tagFreq).slice(0, 6).map(([label, value]) => ({
    label, value,
    color: emotionColors[label] || "#ffffff30",
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-t-2xl sm:rounded-2xl shadow-lg animate-[slideUp_0.3s_ease-out]">
        <div className="p-6">
          <button onClick={onClose} className="float-right w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70" aria-label="关闭">✕</button>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-wide">第 29 周 · 心灵航行报告</h2>
            <p className="text-sm text-white/70 mt-1 leading-relaxed">
              这一周，你记录了 {totalEntries} 个瞬间。
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-white/90 tracking-wide mb-3">情绪光谱图</p>
            <div className="bg-white/5 rounded-xl p-3 flex justify-center">
              <EmotionLineChart data={summary.scores} />
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-1 px-2">
              <span>最低：{Math.min(...summary.scores.map((s) => s.score), 0)}</span>
              <span>最高：{Math.max(...summary.scores.map((s) => s.score), 0)}</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-white/90 tracking-wide mb-3">本周情绪百宝箱</p>
            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <RainbowRing data={ringData} />
              <div className="flex-1">
                <p className="text-xs text-white/70 mb-2">Top 3 高频关键词</p>
                <div className="space-y-1.5">
                  {summary.topTags.map(([tag, count], i) => (
                    <div key={tag} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white/70">{i + 1}</span>
                      <span className="text-sm text-white">#{tag}</span>
                      <span className="text-xs text-white/70">{count}次</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-white/90 tracking-wide mb-2">🔗 模式识别：你未言明的剧本</p>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/90 leading-relaxed">
                基于你的 {totalEntries} 条记录，AI 分析功能即将上线。
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-white/90 tracking-wide mb-2">✨ 下周微光指引</p>
            <div className="bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4">
              <p className="text-sm text-white/90 mb-3 leading-relaxed">
                持续记录，AI 将为你发掘情绪规律。
              </p>
            </div>
          </div>

          <Button variant="primary" size="lg" className="w-full">📤 分享人格徽章</Button>
          <p className="text-xs text-white/70 text-center mt-3">分享卡片仅展示成长趋势，不包含具体日记内容</p>
        </div>
      </div>
    </div>
  );
}

// ============ Year Picker (3×4) ============
function YearPicker({
  years, currentYear, onSelectYear, onBack,
}: {
  years: number[]; currentYear: number; onSelectYear: (y: number) => void; onBack: () => void;
}) {
  const sorted = [...years].sort((a, b) => b - a);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">←</button>
        <h2 className="text-lg font-bold text-white tracking-wide">选择年份</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((y) => (
          <button key={y} onClick={() => onSelectYear(y)}
            className={`aspect-[3/2] rounded-xl text-lg font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              y === currentYear
                ? "bg-primary text-white shadow-md"
                : "bg-white/5 backdrop-blur-xl border border-white/[0.06] text-white/80 hover:bg-white/[0.08]"
            }`}
          >
            {y}
            <span className="text-xs font-normal text-white/60">{y === currentYear ? "当前" : "有记录"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ Month Picker (3×4) ============
function MonthPicker({
  year, registerMonth, currentMonth, monthDataMap, onSelectMonth, onBack,
}: {
  year: number; registerMonth: number; currentMonth: number;
  monthDataMap: Set<string>; onSelectMonth: (m: number) => void; onBack: () => void;
}) {
  const startMonth = year === REGISTER_YEAR ? registerMonth : 1;
  const endMonth = year === NOW.year ? NOW.month : 12;
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70">←</button>
        <h2 className="text-lg font-bold text-white tracking-wide">{year}年</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {months.map((m) => {
          const key = `${year}-${String(m).padStart(2, "0")}`;
          const hasEntry = monthDataMap.has(key);
          const locked = m < startMonth || m > endMonth;
          return (
            <button key={m} disabled={locked || !hasEntry} onClick={() => onSelectMonth(m)}
              className={`aspect-square rounded-xl text-base font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                locked
                  ? "bg-white/[0.03] text-white/30 cursor-not-allowed"
                  : !hasEntry
                  ? "bg-white/5 border border-white/[0.06] text-white/50"
                  : m === currentMonth && year === NOW.year
                  ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                  : "bg-white/5 backdrop-blur-xl border border-white/[0.06] text-white/80 hover:bg-white/[0.08]"
              }`}
            >
              <span className="text-lg">{MONTH_NAMES[m - 1]}</span>
              {locked && <span className="text-sm">🔒</span>}
              {!locked && hasEntry && <span className="text-[10px] text-white/60">📝</span>}
              {!locked && !hasEntry && <span className="text-[10px] text-white/40">无记录</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ Day List View ============
function DayListView({
  entries, year, month, sortAsc, expanded, onToggleExpand, onBack, onToggleSort, onShowReport,
}: {
  entries: DiaryEntryData[]; year: number; month: number; sortAsc: boolean;
  expanded: string | null; onToggleExpand: (d: string | null) => void;
  onBack: () => void; onToggleSort: () => void; onShowReport: () => void;
}) {
  const grouped = useMemo(() => {
    const filtered = filterEntries(entries, year, month);
    const days = groupEntriesByDate(filtered);
    return sortAsc ? days.reverse() : days;
  }, [entries, year, month, sortAsc]);

  const total = entries.length;
  const [narrativeDetail, setNarrativeDetail] = useState<any>(null);

  // Render full narrative report modal
  const NarrativeModal = narrativeDetail ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setNarrativeDetail(null)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-t-2xl sm:rounded-2xl p-6 m-4 animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setNarrativeDetail(null)} className="float-right w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70">✕</button>
        <p className="text-xs text-white/70 mb-1 tracking-wide">🔖 心灵回响</p>
        <p className="text-lg font-serif text-primary mb-4">{narrativeDetail.title}</p>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-white/70 mb-1">第一层 · 镜中之镜</p>
            <p className="text-sm text-white/90 leading-relaxed">{narrativeDetail.mirror}</p>
          </div>
          <div>
            <p className="text-xs text-white/70 mb-1">第二层 · 深层透视</p>
            <p className="text-sm text-white/90 leading-relaxed">{narrativeDetail.psychology}</p>
          </div>
          <div>
            <p className="text-xs text-white/70 mb-1">第三层 · 与你同在</p>
            <p className="text-sm text-white/90 leading-relaxed">{narrativeDetail.empathy}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-xs text-white/70 mb-1 tracking-wide">✨ 一剂行动微光</p>
            <p className="text-sm text-primary">{narrativeDetail.action}</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70" aria-label="返回">←</button>
        <div className="flex items-center gap-2">
          <span className="text-md font-bold text-white tracking-wide">{year}年{MONTH_NAMES[month - 1]}</span>
          <button onClick={onToggleSort} className={`text-sm p-1 rounded transition-colors ${sortAsc ? "text-primary bg-white/10" : "text-white/70 hover:text-white"}`}>⇅</button>
        </div>
        <button onClick={onShowReport} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative text-lg" aria-label="周报">
          📊<span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
        </button>
      </div>

      <div className="space-y-3">
        {grouped.map((day) => {
          const open = expanded === day.date;
          const sum = day.items.reduce((s, i) => s + i.score, 0);
          return (
            <div key={day.date}>
              <button onClick={() => onToggleExpand(open ? null : day.date)}
                className="w-full bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 text-left hover:bg-white/[0.08] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-white/90">{day.date}</span>
                    <span className="text-xs text-white/70 ml-2">周{day.day}</span>
                  </div>
                  <span className={`text-sm font-bold ${sum >= 0 ? "text-success" : "text-secondary"}`}>{sum > 0 ? "+" : ""}{sum}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {day.items.slice(0, 3).map((item, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${item.score > 0 ? "bg-success/20 text-success" : item.score < 0 ? "bg-secondary/20 text-secondary" : "bg-white/10 text-white/70"}`}>{item.tag}</span>
                  ))}
                  {day.items.length > 3 && <span className="text-xs text-white/70">+{day.items.length - 3}</span>}
                </div>
              </button>
              {open && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 mt-1 animate-[fadeIn_0.2s_ease-out]">
                  {day.items.length >= 2 && (
                    <div className="flex items-end gap-1 h-16 mb-4 px-2">
                      {day.items.map((item, i) => {
                        const h = (Math.abs(item.score) / 5) * 60;
                        return <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-white/70">{item.score > 0 ? "+" : ""}{item.score}</span>
                          <div className="w-full rounded-sm" style={{ height: `${Math.max(h, 8)}px`, backgroundColor: item.score > 0 ? "#8BCB9E" : item.score < 0 ? "#F5A3A3" : "#ffffff30" }} />
                        </div>;
                      })}
                    </div>
                  )}
                  <div className="space-y-1">
                    {day.items.map((item, i) => {
                      const isNarrative = item.entryType === "narrative" && item.aiHook;
                      return (
                        <div key={i}
                          className={`flex items-start gap-3 p-2 rounded-lg ${
                            isNarrative ? "cursor-pointer hover:bg-white/[0.08]" : "hover:bg-white/[0.04]"
                          }`}
                          onClick={() => {
                            if (isNarrative) {
                              try { setNarrativeDetail(JSON.parse(item.aiHook!)); }
                              catch { /* ignore parse errors */ }
                            }
                          }}
                        >
                          <span className="text-xs text-white/70 w-12 shrink-0">{item.time}</span>
                          {isNarrative ? (
                            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-primary/20 text-primary">📖 {item.tag}</span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.score > 0 ? "bg-success/20 text-success" : item.score < 0 ? "bg-secondary/20 text-secondary" : "bg-white/10 text-white/70"}`}>{item.tag}</span>
                          )}
                          <span className="text-xs text-white/70">{item.note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/50 text-lg mb-2">📭</p>
          <p className="text-sm text-white/70">这个月还没有记录</p>
        </div>
      )}

      <div className="text-center text-xs text-white/70 mt-6 mb-4">
        本月共记录 {total} 个瞬间
      </div>
      {NarrativeModal}
    </div>
  );
}

// ============ Main Component ============
type ViewMode = "year" | "month" | "day";

export default function Tab3Page() {
  const [entries, setEntries] = useState<DiaryEntryData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewMode>("day");
  const [selectedYear, setSelectedYear] = useState(NOW.year);
  const [selectedMonth, setSelectedMonth] = useState(NOW.month);
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Load entries on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setEntries(loadEntries());
      // 尝试从 API 加载最新数据
      const res = await apiFetchEntries();
      if (!cancelled && res.ok) {
        setEntries(res.data.entries as DiaryEntryData[]);
      }
      setLoaded(true);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const dataMap = useMemo(() => monthsWithData(entries), [entries]);
  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = REGISTER_YEAR; y <= NOW.year; y++) ys.push(y);
    return ys;
  }, []);

  // Re-load entries when returning from detail (to pick up new data)
  useEffect(() => {
    if (!loaded) return;
    setEntries(loadEntries());
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {view === "year" && (
        <YearPicker years={years} currentYear={NOW.year} onSelectYear={(y) => { setSelectedYear(y); setSelectedMonth(y === REGISTER_YEAR ? REGISTER_MONTH : 1); setView("month"); }} onBack={() => setView("month")} />
      )}
      {view === "month" && (
        <MonthPicker year={selectedYear} registerMonth={REGISTER_MONTH} currentMonth={NOW.month} monthDataMap={dataMap} onSelectMonth={(m) => { setSelectedMonth(m); setView("day"); }} onBack={() => setView("year")} />
      )}
      {view === "day" && (
        <DayListView entries={entries} year={selectedYear} month={selectedMonth} sortAsc={sortAsc} expanded={expanded} onToggleExpand={setExpanded} onBack={() => setView("month")} onToggleSort={() => setSortAsc(!sortAsc)} onShowReport={() => setShowReport(true)} />
      )}
      {showReport && <WeeklyReportModal entries={entries} onClose={() => setShowReport(false)} />}
    </div>
  );
}
