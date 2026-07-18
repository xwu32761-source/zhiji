"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";

// ============ Data ============
const MOCK_ENTRIES = [
  { date: "2026-07-15", day: "三", items: [
    { time: "09:30", tag: "焦虑", intensity: 4, score: -3, note: "周报汇报前的心慌" },
    { time: "14:20", tag: "开心", intensity: 3, score: 3, note: "同事请喝奶茶" },
    { time: "21:00", tag: "平静", intensity: 2, score: 2, note: "睡前听了歌" },
  ]},
  { date: "2026-07-14", day: "二", items: [
    { time: "10:00", tag: "愤怒", intensity: 5, score: -4, note: "被老板当众批评" },
    { time: "18:30", tag: "悲伤", intensity: 3, score: -2, note: "想起了一些旧事" },
  ]},
  { date: "2026-07-13", day: "一", items: [
    { time: "08:00", tag: "平静", intensity: 3, score: 2, note: "悠闲的早班地铁" },
    { time: "12:30", tag: "开心", intensity: 4, score: 4, note: "收到了好消息" },
    { time: "22:00", tag: "焦虑", intensity: 2, score: -1, note: "想到下周的deadline" },
  ]},
  { date: "2026-07-10", day: "五", items: [
    { time: "20:00", tag: "开心", intensity: 5, score: 5, note: "和朋友聚餐" },
  ]},
  { date: "2026-07-08", day: "三", items: [
    { time: "09:00", tag: "平静", intensity: 3, score: 1, note: "普通的一天" },
    { time: "16:30", tag: "焦虑", intensity: 3, score: -2, note: "项目进度焦虑" },
  ]},
];

const REGISTER_YEAR = 2026;
const REGISTER_MONTH = 7;
const NOW = { year: 2026, month: 7 };
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function monthsWithData(entries: typeof MOCK_ENTRIES): Set<string> {
  const s = new Set<string>();
  entries.forEach((d) => s.add(d.date.slice(0, 7)));
  return s;
}

function filterEntries(entries: typeof MOCK_ENTRIES, year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((d) => d.date.startsWith(prefix));
}

// ============ Weekly Report helpers ============
function getWeekSummary() {
  const scores = MOCK_ENTRIES.map(d => ({
    label: d.date.slice(5),
    score: d.items.reduce((s, i) => s + i.score, 0),
    high: Math.max(...d.items.map(i => i.score)),
    low: Math.min(...d.items.map(i => i.score)),
  }));

  const tagCounts: Record<string, number> = {};
  MOCK_ENTRIES.forEach(d => d.items.forEach(i => {
    tagCounts[i.tag] = (tagCounts[i.tag] || 0) + 1;
  }));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const totalPoints = scores.reduce((s, sc) => s + sc.score, 0);

  return { scores, topTags: sortedTags.slice(0, 3), totalScore: totalPoints };
}

// Simple emotion line chart (SVG)
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

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.score)}`).join(" ");

  // Area fill
  const areaPath = `${linePath} L${toX(data.length - 1)},${toY(minScore)} L${toX(0)},${toY(minScore)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px] h-auto">
      {/* Zero line */}
      <line x1={padding.left} y1={toY(0)} x2={W - padding.right} y2={toY(0)} stroke="#E2E0ED" strokeWidth="1" strokeDasharray="4" />
      {/* Area fill */}
      <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#5B6ABF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.score)} r="4" fill="#5B6ABF" stroke="white" strokeWidth="2" />
          {/* High/low annotations */}
          {d.score === d.high && d.score > 1 && (
            <text x={toX(i)} y={toY(d.score) - 10} textAnchor="middle" className="text-[9px]" fill="#8BCB9E">
              +{d.score}
            </text>
          )}
          {d.score === d.low && d.score < -1 && (
            <text x={toX(i)} y={toY(d.score) + 16} textAnchor="middle" className="text-[9px]" fill="#F5A3A3">
              {d.score}
            </text>
          )}
        </g>
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" className="text-[9px]" fill="#6B6B80">
          {d.label}
        </text>
      ))}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B6ABF" />
          <stop offset="100%" stopColor="#5B6ABF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Simple donut/rainbow chart (SVG)
function RainbowRing({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 50;
  const CX = 60;
  const CY = 60;
  const strokeW = 20;
  const circ = 2 * Math.PI * R;

  let offset = 0;
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
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={d.color}
            strokeWidth={strokeW}
            strokeDasharray={dash}
            transform={`rotate(${rotate} ${CX} ${CY})`}
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        );
      })}
      <text x={CX} y={CY + 4} textAnchor="middle" className="text-[10px]" fill="#1A1A2E" fontWeight="bold">
        {total}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="text-[7px]" fill="#6B6B80">
        记录
      </text>
    </svg>
  );
}

// =========== Weekly Report Modal ===========
function WeeklyReportModal({ onClose }: { onClose: () => void }) {
  const summary = getWeekSummary();
  const totalEntries = MOCK_ENTRIES.reduce((s, d) => s + d.items.length, 0);

  // Compute emotion distribution for rainbow ring
  const emotionColors: Record<string, string> = {
    "开心": "#8BCB9E", "平静": "#5B6ABF", "焦虑": "#F5A3A3",
    "愤怒": "#E87373", "悲伤": "#9B8EC4", "爱/信任": "#F0C27A",
  };
  const tagFreq: Record<string, number> = {};
  MOCK_ENTRIES.forEach(d => d.items.forEach(i => {
    tagFreq[i.tag] = (tagFreq[i.tag] || 0) + 1;
  }));
  const ringData = Object.entries(tagFreq).slice(0, 6).map(([label, value]) => ({
    label, value,
    color: emotionColors[label] || "#E2E0ED",
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lg animate-[slideUp_0.3s_ease-out]">
        <div className="p-6">
          {/* Close */}
          <button onClick={onClose} className="float-right w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-text-secondary" aria-label="关闭">
            ✕
          </button>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary">第 29 周 · 心灵航行报告</h2>
            <p className="text-sm text-text-secondary mt-1">
              这一周，你像潮汐一样在"焦灼"与"释然"之间摆荡，但始终没停止向前。
            </p>
          </div>

          {/* Section 1: Emotion line chart */}
          <div className="mb-6">
            <p className="text-sm font-medium text-text-primary mb-3">情绪光谱图</p>
            <div className="bg-bg rounded-xl p-3 flex justify-center">
              <EmotionLineChart data={summary.scores} />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1 px-2">
              <span>最低：{Math.min(...summary.scores.map(s => s.score))}</span>
              <span>最高：{Math.max(...summary.scores.map(s => s.score))}</span>
            </div>
          </div>

          {/* Section 2: Rainbow ring + top tags */}
          <div className="mb-6">
            <p className="text-sm font-medium text-text-primary mb-3">本周情绪百宝箱</p>
            <div className="flex items-center gap-4 bg-bg rounded-xl p-4">
              <RainbowRing data={ringData} />
              <div className="flex-1">
                <p className="text-xs text-text-secondary mb-2">Top 3 高频关键词</p>
                <div className="space-y-1.5">
                  {summary.topTags.map(([tag, count], i) => (
                    <div key={tag} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-text-secondary">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary">#{tag}</span>
                      <span className="text-xs text-text-secondary">{count}次</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pattern recognition */}
          <div className="mb-6">
            <p className="text-sm font-medium text-text-primary mb-2">🔗 模式识别：你未言明的剧本</p>
            <div className="bg-primary-light rounded-xl p-4">
              <p className="text-sm text-text-primary leading-relaxed">
                你对"权威否定"极其敏感。本周的低谷（被质疑），再次触发了你的战逃反应。但你的记录显示你通过社交连接（聚餐）恢复了能量——你已无意识地启动了自我调节机制。
              </p>
            </div>
          </div>

          {/* Section 4: Action insight */}
          <div className="mb-6">
            <p className="text-sm font-medium text-text-primary mb-2">✨ 下周微光指引</p>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-text-primary mb-3">
                本周你周六情绪最高，建议下周将重要的社交活动安排在周六。
              </p>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                📌 记入明日待办
              </button>
            </div>
          </div>

          {/* Share button */}
          <Button variant="primary" size="lg" className="w-full">
            📤 分享人格徽章
          </Button>
          <p className="text-xs text-text-secondary text-center mt-3">
            分享卡片仅展示成长趋势，不包含具体日记内容
          </p>
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
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors">←</button>
        <h2 className="text-lg font-bold text-text-primary">选择年份</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((y) => (
          <button key={y} onClick={() => onSelectYear(y)}
            className={`aspect-[3/2] rounded-xl text-lg font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              y === currentYear
                ? "bg-primary text-white shadow-md"
                : "bg-card card-shadow text-text-primary hover:card-shadow-hover border border-transparent"
            }`}
          >
            {y}
            <span className="text-xs font-normal opacity-70">{y === currentYear ? "当前" : "有记录"}</span>
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
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors">←</button>
        <h2 className="text-lg font-bold text-text-primary">{year}年</h2>
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
                  ? "bg-gray-100 text-text-secondary/30 cursor-not-allowed"
                  : !hasEntry
                  ? "bg-card card-shadow text-text-secondary/50"
                  : m === currentMonth && year === NOW.year
                  ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                  : "bg-card card-shadow text-text-primary hover:card-shadow-hover border border-transparent"
              }`}
            >
              <span className="text-lg">{MONTH_NAMES[m - 1]}</span>
              {locked && <span className="text-sm">🔒</span>}
              {!locked && hasEntry && <span className="text-[10px] opacity-70">📝</span>}
              {!locked && !hasEntry && <span className="text-[10px] text-text-secondary/50">无记录</span>}
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
  entries: typeof MOCK_ENTRIES; year: number; month: number; sortAsc: boolean;
  expanded: string | null; onToggleExpand: (d: string | null) => void;
  onBack: () => void; onToggleSort: () => void; onShowReport: () => void;
}) {
  const sorted = sortAsc ? [...entries].reverse() : entries;
  const total = entries.reduce((s, d) => s + d.items.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors" aria-label="返回">←</button>
        <div className="flex items-center gap-2">
          <span className="text-md font-bold text-text-primary">{year}年{MONTH_NAMES[month - 1]}</span>
          <button onClick={onToggleSort} className={`text-sm p-1 rounded ${sortAsc ? "text-primary bg-primary-light" : "text-text-secondary hover:text-text-primary"}`}>⇅</button>
        </div>
        <button onClick={onShowReport} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light relative" aria-label="周报">
          📊<span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((day) => {
          const open = expanded === day.date;
          const sum = day.items.reduce((s, i) => s + i.score, 0);
          return (
            <div key={day.date}>
              <button onClick={() => onToggleExpand(open ? null : day.date)} className="w-full bg-card rounded-xl card-shadow p-4 text-left hover:card-shadow-hover transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div><span className="text-sm font-medium text-text-primary">{day.date}</span><span className="text-xs text-text-secondary ml-2">周{day.day}</span></div>
                  <span className={`text-sm font-bold ${sum >= 0 ? "text-success" : "text-secondary"}`}>{sum > 0 ? "+" : ""}{sum}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {day.items.slice(0, 3).map((item, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${item.score > 0 ? "bg-success/20 text-green-700" : item.score < 0 ? "bg-secondary/20 text-red-600" : "bg-primary-light text-primary"}`}>{item.tag}</span>
                  ))}
                  {day.items.length > 3 && <span className="text-xs text-text-secondary">+{day.items.length - 3}</span>}
                </div>
              </button>
              {open && (
                <div className="bg-card rounded-xl card-shadow p-4 mt-1 animate-[fadeIn_0.2s_ease-out]">
                  {day.items.length >= 2 && (
                    <div className="flex items-end gap-1 h-16 mb-4 px-2">
                      {day.items.map((item, i) => {
                        const h = (Math.abs(item.score) / 5) * 60;
                        return <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-text-secondary">{item.score > 0 ? "+" : ""}{item.score}</span>
                          <div className="w-full rounded-sm" style={{ height: `${Math.max(h, 8)}px`, backgroundColor: item.score > 0 ? "#8BCB9E" : item.score < 0 ? "#F5A3A3" : "#E2E0ED" }} />
                        </div>;
                      })}
                    </div>
                  )}
                  <div className="space-y-1">
                    {day.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg/50">
                        <span className="text-xs text-text-secondary w-12 shrink-0">{item.time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.score > 0 ? "bg-success/20 text-green-700" : item.score < 0 ? "bg-secondary/20 text-red-600" : "bg-primary-light text-primary"}`}>{item.tag}</span>
                        <span className="text-xs text-text-secondary">{item.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary/50 text-lg mb-2">📭</p>
          <p className="text-sm text-text-secondary">这个月还没有记录</p>
        </div>
      )}

      <div className="text-center text-xs text-text-secondary mt-6 mb-4">
        本月共记录 {total} 个瞬间
      </div>
    </div>
  );
}

// ============ Main Component ============
type ViewMode = "year" | "month" | "day";

export default function Tab3Page() {
  const [view, setView] = useState<ViewMode>("day");
  const [selectedYear, setSelectedYear] = useState(NOW.year);
  const [selectedMonth, setSelectedMonth] = useState(NOW.month);
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const dataMap = useMemo(() => monthsWithData(MOCK_ENTRIES), []);
  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = REGISTER_YEAR; y <= NOW.year; y++) ys.push(y);
    return ys;
  }, []);

  const filtered = useMemo(() => filterEntries(MOCK_ENTRIES, selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  return (
    <div>
      {view === "year" && (
        <YearPicker years={years} currentYear={NOW.year} onSelectYear={(y) => { setSelectedYear(y); setSelectedMonth(y === REGISTER_YEAR ? REGISTER_MONTH : 1); setView("month"); }} onBack={() => setView("month")} />
      )}
      {view === "month" && (
        <MonthPicker year={selectedYear} registerMonth={REGISTER_MONTH} currentMonth={NOW.month} monthDataMap={dataMap} onSelectMonth={(m) => { setSelectedMonth(m); setView("day"); }} onBack={() => setView("year")} />
      )}
      {view === "day" && (
        <DayListView entries={filtered} year={selectedYear} month={selectedMonth} sortAsc={sortAsc} expanded={expanded} onToggleExpand={setExpanded} onBack={() => setView("month")} onToggleSort={() => setSortAsc(!sortAsc)} onShowReport={() => setShowReport(true)} />
      )}
      {showReport && <WeeklyReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}
