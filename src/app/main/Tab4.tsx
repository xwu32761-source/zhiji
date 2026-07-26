"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PillarAnswers } from "@/lib/types";
import { getStorageItem, setStorageItem, KEYS } from "@/lib/storage";
import { exportAllData } from "@/lib/export";
import { fetchPillars as apiFetchPillars, fetchEntries as apiFetchEntries } from "@/lib/api-client";

type Tab4State = "empty" | "insufficient" | "pillar_ready" | "ready" | "generated";
type ReportType = "none" | "quick" | "full";

const PILLAR_STORAGE_KEY = "zhiji_pillar_answers_v2";
const PILLAR_NEEDED = 3;
const ENTRY_NEEDED = 5;

const LOADING_QUOTES = [
  "正在整理你的昨日碎片……",
  "寻找你未言说的剧本……",
  "编织只属于你的暗涌图谱……",
  "回溯你情绪的潮汐规律……",
  "拼凑你的人格拼图残片……",
];

// Ink loading animation SVG
function InkLoadingAnimation() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="mb-6">
      {/* Ink drop blob */}
      <path
        d="M60 10 C60 10, 30 40, 30 65 C30 85, 45 100, 60 100 C75 100, 90 85, 90 65 C90 40, 60 10, 60 10Z"
        fill="none"
        stroke="#818CF8"
        strokeWidth="1.5"
        className="animate-[inkExpand_3s_ease-in-out_infinite]"
        opacity="0.3"
      />
      {/* Expanding ring 1 */}
      <circle
        cx="60" cy="55" r="0" fill="none" stroke="#818CF8" strokeWidth="1"
        className="animate-[inkRing_3s_ease-out_infinite]"
        opacity="0"
      />
      {/* Expanding ring 2 */}
      <circle
        cx="60" cy="55" r="0" fill="none" stroke="#818CF8" strokeWidth="0.8"
        className="animate-[inkRing_3s_ease-out_infinite]"
        style={{ animationDelay: "1s" }}
        opacity="0"
      />
      {/* Expanding ring 3 */}
      <circle
        cx="60" cy="55" r="0" fill="none" stroke="#818CF8" strokeWidth="0.5"
        className="animate-[inkRing_3s_ease-out_infinite]"
        style={{ animationDelay: "2s" }}
        opacity="0"
      />
      {/* Ink dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx={40 + Math.random() * 40}
          cy={35 + Math.random() * 35}
          r="2"
          fill="#818CF8"
          className="animate-[inkFloat_4s_ease-in-out_infinite]"
          style={{
            animationDelay: `${i * 0.6}s`,
            opacity: 0.2 + Math.random() * 0.3,
          }}
        />
      ))}
      {/* Center pulsing circle */}
      <circle cx="60" cy="55" r="8" fill="#818CF8" opacity="0.15" className="animate-[pulse_2s_ease-in-out_infinite]" />
      <circle cx="60" cy="55" r="4" fill="#818CF8" opacity="0.25" className="animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: "0.5s" }} />
    </svg>
  );
}

function ReportLoadingOverlay() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % LOADING_QUOTES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a14] flex flex-col items-center justify-center">
      <InkLoadingAnimation />
      <p className="text-sm text-white/90 font-medium transition-opacity duration-500 tracking-wide">
        {LOADING_QUOTES[quoteIndex]}
      </p>
      <p className="text-xs text-white/70 mt-6 animate-breathe">
        正在生成中，请稍候……
      </p>
    </div>
  );
}

export default function Tab4Page() {
  const [state, setState] = useState<Tab4State>("insufficient");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("none");

  const [pillarProgress, setPillarProgress] = useState(0);
  const [entryProgress, setEntryProgress] = useState(0);

  const pillarNeeded = Math.max(0, PILLAR_NEEDED - pillarProgress);
  const entryNeeded = Math.max(0, ENTRY_NEEDED - entryProgress);
  const generated = state === "generated";

  /** 从缓存恢复报告状态，同时从 localStorage 读取进度用于 canUpgrade 判断 */
  function restoreCachedReport(content: string, type: ReportType) {
    setReportContent(content);
    setReportType(type);
    setState("generated");
    // 缓存路径也要读取进度，否则 canUpgrade 永远为 false
    const localPillarData = getStorageItem<Record<number, PillarAnswers>>(PILLAR_STORAGE_KEY, {});
    const localEntries = getStorageItem<any[]>(KEYS.DIARY_ENTRIES, []);
    setPillarProgress(Object.values(localPillarData).filter((d) => d.status === "done").length);
    setEntryProgress(localEntries.length);
    setDataLoaded(true);
  }

  // Read real progress from localStorage + API on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 优先显示缓存报告：已生成则跳过 API，立即渲染
      const savedReport = getStorageItem<string>(KEYS.REPORT_CONTENT, "");
      const savedQuick = getStorageItem<string>(KEYS.REPORT_QUICK, "");

      if (savedReport) {
        restoreCachedReport(savedReport, "full");
        return;
      }
      if (savedQuick) {
        restoreCachedReport(savedQuick, "quick");
        return;
      }

      // 无缓存报告时才需要从 API 同步进度
      const localPillarData = getStorageItem<Record<number, PillarAnswers>>(PILLAR_STORAGE_KEY, {});
      const localEntries = getStorageItem<any[]>(KEYS.DIARY_ENTRIES, []);

      let doneCount = Object.values(localPillarData).filter((d) => d.status === "done").length;
      let entryCount = localEntries.length;

      const [pillarRes, entriesRes] = await Promise.all([
        apiFetchPillars(),
        apiFetchEntries(),
      ]);

      if (!cancelled) {
        if (pillarRes.ok && pillarRes.data.pillarData && Object.keys(pillarRes.data.pillarData).length > 0) {
          const apiData = pillarRes.data.pillarData as Record<number, PillarAnswers>;
          doneCount = Object.values(apiData).filter((d) => d.status === "done").length;
        }
        if (entriesRes.ok) {
          entryCount = entriesRes.data.total;
        }

        setPillarProgress(doneCount);
        setEntryProgress(entryCount);

        if (doneCount >= PILLAR_NEEDED) {
          setState(entryCount >= ENTRY_NEEDED ? "ready" : "pillar_ready");
        } else if (doneCount === 0 && entryCount === 0) {
          setState("empty");
        } else {
          setState("insufficient");
        }

        setDataLoaded(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const [reportContent, setReportContent] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const pillarData = getStorageItem<Record<number, PillarAnswers>>(PILLAR_STORAGE_KEY, {});
      const entries = getStorageItem<any[]>(KEYS.DIARY_ENTRIES, []);

      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: { pillarAnswers: pillarData },
          recentEntries: entries,
        }),
      });
      const data = await res.json();
      const content = data.report || REPORT_FALLBACK;
      setReportContent(content);
      setStorageItem(KEYS.REPORT_CONTENT, content);
      setStorageItem(KEYS.REPORT_TYPE, "full");
    } catch {
      setReportContent(REPORT_FALLBACK);
      setStorageItem(KEYS.REPORT_CONTENT, REPORT_FALLBACK);
      setStorageItem(KEYS.REPORT_TYPE, "full");
    }
    setLoading(false);
    setReportType("full");
        setState("generated");
  };

  const handleGenerateQuick = async () => {
    setLoading(true);
    try {
      const pillarData = getStorageItem<Record<number, PillarAnswers>>(PILLAR_STORAGE_KEY, {});

      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: { pillarAnswers: pillarData },
          quick: true,
        }),
      });
      const data = await res.json();
      const content = data.report || QUICK_REPORT_FALLBACK;
      setReportContent(content);
      setStorageItem(KEYS.REPORT_QUICK, content);
    } catch {
      setReportContent(QUICK_REPORT_FALLBACK);
      setStorageItem(KEYS.REPORT_QUICK, QUICK_REPORT_FALLBACK);
    }
    setLoading(false);
    setReportType("quick");
        setState("generated");
  };

  // 数据加载完成前不渲染，防止闪跳
  if (!dataLoaded) {
    return <div className="min-h-[60vh]" />;
  }

  if (state === "empty") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-32 h-32 mb-6 text-6xl opacity-30">🧩</div>
        <p className="text-lg text-white/70 mb-2">你的专属说明书正在沉睡……</p>
        <Button variant="primary" size="md">
          ⚡ 去点亮第一块拼图
        </Button>
        <button onClick={exportAllData} className="text-xs text-white/30 hover:text-white/60 transition-colors mt-6">
          💾 导出全部数据
        </button>
      </div>
    );
  }

  if (state === "insufficient") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="text-lg font-bold text-white tracking-wide mb-2">📄 我的人生使用说明书</h1>

        {/* Dual progress */}
        <div className="w-full max-w-xs mb-8 mt-4">
          {/* Pillar progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/80">支柱进度</span>
              <span className="text-white/70">{pillarProgress}/3</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(pillarProgress / 3) * 100}%` }} />
            </div>
          </div>
          {/* Entry progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/80">记录进度</span>
              <span className="text-white/70">{entryProgress}/5</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${(entryProgress / 5) * 100}%` }} />
            </div>
          </div>
        </div>

        <p className="text-sm text-white/70 mb-6 leading-relaxed">
          还差 {pillarNeeded} 个支柱{entryNeeded > 0 && ` 和 ${entryNeeded} 条记录`}，初版说明书即可破茧。
        </p>

        {/* AI 数据处理告知 */}
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 max-w-xs w-full">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>生成报告时将把你的问卷和日记数据发送至 AI 服务商进行处理。</span>
        </div>

        <Button variant="ghost" size="md" disabled>
          手册沉睡中……
        </Button>
        <button onClick={exportAllData} className="text-xs text-white/30 hover:text-white/60 transition-colors mt-6">
          💾 导出全部数据
        </button>
      </div>
    );
  }

  if (state === "pillar_ready") {
    const quickNeeded = Math.max(0, ENTRY_NEEDED - entryProgress);
    return (
      <div className="flex flex-col items-center min-h-[60vh] px-6 pt-8">
        <h1 className="text-lg font-bold text-white tracking-wide mb-1">📄 人格初稿 · 第一印象</h1>
        <p className="text-xs text-white/60 mb-6">基于人格问卷的初步印象，有待行为数据验证</p>

        {/* Dual progress */}
        <div className="w-full max-w-xs mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/80">支柱进度</span>
              <span className="text-success font-semibold">✓ 3/3</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/80">记录进度</span>
              <span className="text-white/70">{entryProgress}/{ENTRY_NEEDED}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(entryProgress / ENTRY_NEEDED) * 100}%` }} />
            </div>
          </div>
        </div>

        <p className="text-sm text-white/70 mb-6 leading-relaxed text-center">
          支柱已点亮，{quickNeeded > 0 ? `再记录 ${quickNeeded} 条情绪即可生成完整的「人生使用说明书」` : "可生成完整说明书"}
        </p>

        {/* AI 数据处理告知 */}
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 max-w-xs w-full">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>生成报告时将把你的问卷和日记数据发送至 AI 服务商进行处理。</span>
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={handleGenerateQuick}
          className="mb-3"
        >
          ✨ 生成人格初稿
        </Button>
        <button onClick={exportAllData} className="text-xs text-white/30 hover:text-white/60 transition-colors mt-4">
          💾 导出全部数据
        </button>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="text-lg font-bold text-white tracking-wide mb-6">📄 我的人生使用说明书</h1>

        <ProgressRing progress={100} size={120} strokeWidth={6} label="" />

        <p className="text-sm text-white/70 mt-6 mb-8">
          数据已充足，可以唤醒你的专属说明书了。
        </p>

        {/* AI 数据处理告知 */}
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 max-w-xs mx-auto">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>生成报告时将把你的问卷和日记数据发送至 AI 服务商进行处理。</span>
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={handleGenerate}
          className="animate-breathe"
        >
          ✨ 唤醒我的使用手册
        </Button>
        <button onClick={exportAllData} className="text-xs text-white/30 hover:text-white/60 transition-colors mt-6">
          💾 导出全部数据
        </button>
      </div>
    );
  }

  // Generated state
  const canUpgrade = reportType === "quick" && entryProgress >= ENTRY_NEEDED;
  return (
    <div className="pb-8">
      {/* Loading state */}
      {loading && <ReportLoadingOverlay />}

      {/* Report type label */}
      {generated && reportContent && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-white/90 font-medium">
              {reportType === "quick" ? "📄 人格初稿 · 第一印象" : "📄 我的人生使用说明书"}
            </span>
          </div>

          {/* Quick-report upgrade reminder */}
          {reportType === "quick" && (
            <div className={`rounded-lg p-3 text-sm ${canUpgrade ? "bg-primary/10 border border-primary/30 text-primary" : "bg-white/5 border border-white/[0.06] text-white/70"}`}>
              {canUpgrade
                ? "✨ 数据已充足，可以生成完整的「人生使用说明书」了！"
                : "💡 记录更多情绪与行为后，可生成更完整的「人生使用说明书」"}
            </div>
          )}
        </div>
      )}

      {/* Report content */}
      {generated && reportContent && (
        <ReportContentRenderer markdown={reportContent} />
      )}

      {/* Upgrade CTA */}
      {canUpgrade && (
        <div className="mt-4 mb-2 text-center">
          <Button variant="primary" size="lg" loading={loading} onClick={handleGenerate}>
            🔄 生成完整说明书
          </Button>
        </div>
      )}

      {/* Data export */}
      <div className="text-center mt-8">
        <button onClick={exportAllData} className="text-xs text-white/30 hover:text-white/60 transition-colors">
          💾 导出全部数据
        </button>
      </div>
    </div>
  );
}

// Fallback report when API is unavailable
const REPORT_FALLBACK = `# 第一章：此刻的身份速写

「克制中带着野心的晨间行者」
你习惯在清晨掌控世界，但在内心深处你渴望打破规则。

# 第二章：你的生命能量图谱

**🔋 充能项**
- 独处时的创造力：你在安静的环境中思维最为活跃
- 深度阅读的沉浸感：你通过阅读获得精神能量
- 清晨的高效时段：你的精力峰值出现在早间

**⚡ 耗能项**
- 权威审视下的窒息感：被否定时情绪波动剧烈
- 过度共情的耗竭感：你容易吸收他人的情绪
- 社交后的疲惫期：长时间社交后需要独处恢复

# 第三章：近期运行日志分析

**情绪底层算法**
你的情绪低谷频繁出现在周一/周二，高峰出现在周末。

**未言明的剧本**
你描述自己是独立自主的，但记录显示你深夜频繁因人际关系焦虑。

# 第四章：维护与保养指南

1. **燃料补给**：将最难的工作安排在早 7-9 点
2. **故障预警**：肩颈僵硬意味着你在压抑情绪
3. **升级路线**：推荐阅读《也许你该找个人聊聊》

# 第五章：版本更新日志

V1.0（2026-07-15）：基于当前数据初版生成

---

亲爱的探索者：

你比你想象中更复杂，也比你以为的更简单。那些深夜的焦虑和白日的坚强，都是你真实的一部分。这本说明书不是要定义你，而是要提醒你：你有权成为任何版本。

我一直在看。`;

// Fallback quick profile when API is unavailable
const QUICK_REPORT_FALLBACK = `# 第一章：此刻的身份速写

「审慎的晨间掌控者」
你习惯在清晨掌控世界，选择理性分析作为决策核心。这种对秩序和可控性的偏好，是你给自己建造的安全堡垒。

# 第二章：你的生命能量图谱

**🔋 充能项**
- 清晨的高效时段：你选择22:00-23:59入睡并维持7-8小时睡眠，表明你对节奏感的掌控欲——这使你感到安全且高效
- 理性决策的避险本能：你选择"理性分析"作为决策核心，这种方式过滤冲动，让你在复杂局面中不易掉入陷阱
- 情绪稳态的调节力：你的基线情绪倾向"平静"，这种能力为你累积了心理资本

**⚡ 耗能项**
- 被否定的过载反应：被否定/批评是你情绪起伏的主要导火索，你内化外界否定并触发自我怀疑的潜在危机
- 比较型决策的思维摩擦：你的理性比较→无绝对最优→再比较的决策流程，消耗巨大的心理带宽
- "偶尔会"的自我松动：你承认"偶尔会"放弃理性——这个"偶尔"是意识层面下的暗流，表明你尚未允许自己坦然接纳感性冲动

---
*本报告仅基于人格问卷数据生成，属于初步印象。记录更多日常情绪与行为后，可生成更完整的「人生使用说明书」。*`;

// ========== Book-style Report Renderer ==========

/** Strip both **bold** and *italic* markers from inline text */
function cleanMd(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*(.*?)\*/g, "$1");
}

/** Parse "第一章" → "一" */
function parseChapterNum(title: string): string {
  const m = title.match(/第([一二三四五六七八九十])章/);
  return m?.[1] ?? "";
}

/** Chapter title bar — "CHAPTER 一" label + large serif heading */
function ChapterTitle({ title }: { title: string }) {
  const raw = title.replace(/^#{1,3}\s+/, "");
  const num = parseChapterNum(raw);
  const display = cleanMd(raw).replace(/第.章[：:]?\s*/, "");
  return (
    <div className="mb-5">
      {num && (
        <span className="text-[10px] text-primary/50 font-semibold tracking-[0.15em] uppercase">
          CHAPTER {num}
        </span>
      )}
      <h2 className="text-lg md:text-xl font-bold text-white font-serif tracking-wider mt-1 leading-snug">
        {display || cleanMd(raw)}
      </h2>
    </div>
  );
}

/** Section subtitle — left accent bar + primary color */
function SectionTitle({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 mb-3 mt-6 first:mt-0">
      <div className="w-[3px] h-[18px] bg-primary/60 rounded-full shrink-0 mt-0.5" />
      <h3 className="text-[15px] font-semibold text-primary tracking-wide">{text}</h3>
    </div>
  );
}

/** Single charge/drain energy item as a mini-card */
function EnergyCard({ text, index, type }: { text: string; index: number; type: "charge" | "drain" }) {
  const isCharge = type === "charge";
  return (
    <div className={`rounded-lg p-3.5 ${isCharge ? "bg-success/[0.08] border border-success/15" : "bg-secondary/[0.08] border border-secondary/15"}`}>
      <div className="flex items-start gap-3">
        <span className={`w-5 h-5 rounded-full ${isCharge ? "bg-success/20 text-success" : "bg-secondary/20 text-secondary"} text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
          {index + 1}
        </span>
        <p className="text-sm text-white/90 leading-relaxed">{cleanMd(text)}</p>
      </div>
    </div>
  );
}

/** Numbered maintenance tip card */
function TipCard({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.04] rounded-lg p-3.5 border border-white/[0.06]">
      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </span>
      <p className="text-sm text-white/90 leading-relaxed">{cleanMd(text)}</p>
    </div>
  );
}

/** Regular bullet list with decorative dot */
function BulletList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-primary/50 mt-1.5 shrink-0">‧</span>
          <p className="text-sm text-white/85 leading-relaxed">{cleanMd(item)}</p>
        </div>
      ))}
    </div>
  );
}

/** Short impactful line rendered as a callout block */
function CalloutBlock({ text }: { text: string }) {
  return (
    <div className="border-l-2 border-primary/30 bg-white/[0.03] rounded-r-lg py-3 px-4 my-3">
      <p className="text-sm text-white/85 leading-relaxed font-serif italic">{text}</p>
    </div>
  );
}

/** Sealed‑envelope card for the final letter */
function LetterCard({ section }: { section: string }) {
  const paragraphs = section.split("\n\n").map((p) => p.trim()).filter(Boolean);
  return (
    <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6 md:p-8 mb-4 overflow-hidden animate-[pageEnter_0.5s_ease-out]">
      {/* Decorative seal */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/10 rounded-full border border-secondary/20 flex items-center justify-center rotate-12">
        <span className="text-xl">💌</span>
      </div>
      <div className="space-y-4 relative z-10">
        {paragraphs.map((p, i) => {
          if (p === "---" || p.startsWith("---")) return <div key={i} className="border-t border-white/10 my-2" />;
          const isSignOff = p === "我一直在看。";
          const isGreeting = p.includes("亲爱的探索者");
          return (
            <p
              key={i}
              className={`text-sm font-serif leading-relaxed ${
                isSignOff
                  ? "text-primary font-semibold text-right"
                  : isGreeting
                    ? "text-white font-semibold text-base"
                    : "text-white/90"
              }`}
            >
              {p}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/** One book page — frosted‑glass card with watermark + page number */
function BookPage({ content, pageIndex, totalPages }: { content: string; pageIndex: number; totalPages: number }) {
  const isOdd = pageIndex % 2 === 0;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] || "";
  const body = content.replace(/^#\s+.+$/m, "").trim();
  const blocks = parseBodyBlocks(body);
  const chapterNum = parseChapterNum(title);

  return (
    <div
      className={`
        relative bg-white/5 backdrop-blur-xl border border-white/[0.06]
        rounded-xl p-5 md:p-6 mb-4
        ${isOdd ? "ml-0 md:ml-1" : "mr-0 md:mr-1"}
        animate-[pageEnter_0.5s_ease-out]
      `}
      style={{ animationDelay: `${pageIndex * 80}ms` }}
    >
      {/* Decorative chapter‑number watermark */}
      {chapterNum && (
        <div className="absolute top-2 right-4 text-[80px] md:text-[100px] font-serif font-bold text-white/[0.04] select-none pointer-events-none leading-none">
          {chapterNum}
        </div>
      )}

      <ChapterTitle title={title} />
      <div className="space-y-3">{blocks}</div>

      {/* Page number */}
      <div className="text-center text-white/25 text-xs mt-6 pt-4 border-t border-white/5">
        — {pageIndex + 1} / {totalPages} —
      </div>
    </div>
  );
}

/** Parse chapter body into typed blocks */
function parseBodyBlocks(body: string) {
  const nodes: React.ReactNode[] = [];
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  let nextEnergyType: "charge" | "drain" | null = null;
  let key = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const currentKey = key++;

    // ## / ### sub‑heading (AI may output these instead of **bold**)
    if (/^#{2,3}\s+/.test(line)) {
      const text = cleanMd(line.replace(/^#{2,3}\s+/, ""));
      if (/充能|🔋/.test(text)) {
        nextEnergyType = "charge";
      } else if (/耗能|⚡/.test(text)) {
        nextEnergyType = "drain";
      } else {
        nextEnergyType = null;
      }
      nodes.push(<SectionTitle key={currentKey} text={text} />);
      i++;
      continue;
    }

    // Bold sub‑heading (standalone **text**)
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      const text = cleanMd(line);
      if (/充能|🔋/.test(text)) {
        nextEnergyType = "charge";
      } else if (/耗能|⚡/.test(text)) {
        nextEnergyType = "drain";
      } else {
        nextEnergyType = null;
      }
      nodes.push(<SectionTitle key={currentKey} text={text} />);
      i++;
      continue;
    }

    // List items (- item)
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].replace(/^- /, ""));
        i++;
      }

      if (nextEnergyType) {
        const energyType = nextEnergyType; // narrow from "charge"|"drain"|null
        nodes.push(
          <div key={currentKey} className="space-y-2 mb-1">
            {items.map((item, j) => (
              <EnergyCard key={j} text={item} index={j} type={energyType} />
            ))}
          </div>,
        );
        nextEnergyType = null;
      } else {
        nodes.push(<BulletList key={currentKey} items={items} />);
      }
      continue;
    }

    // Numbered items (1. item — maintenance tips, etc.)
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ""));
        i++;
      }
      nodes.push(
        <div key={currentKey} className="space-y-3 mb-1">
          {items.map((item, j) => (
            <TipCard key={j} num={j + 1} text={item} />
          ))}
        </div>,
      );
      continue;
    }

    // Skip bare number lines (AI may output "1" on its own as item marker)
    if (/^\d+$/.test(line)) {
      i++;
      continue;
    }

    // Short punchy line → callout; long paragraph → plain text
    if (line.length < 30 && !line.endsWith("。") && line.length > 0) {
      nodes.push(<CalloutBlock key={currentKey} text={cleanMd(line)} />);
    } else {
      nodes.push(
        <p key={currentKey} className="text-sm text-white/85 leading-relaxed">
          {cleanMd(line)}
        </p>,
      );
    }
    i++;
  }

  return nodes;
}

/** Root renderer — splits markdown into chapters + letter, arranges as book pages */
function ReportContentRenderer({ markdown }: { markdown: string }) {
  const sections = markdown.split(/(?=^#\s)/m).filter((s) => s.trim());

  // Separate chapters from the letter (letter may be inside the last chapter section)
  const chapterSections: string[] = [];
  let letterSection = "";

  for (const s of sections) {
    if (s.includes("亲爱的探索者") && /^#\s/.test(s.trim())) {
      // Last chapter section also contains the letter after ---
      const parts = s.split(/^---\s*$/m);
      if (parts.length > 1) {
        chapterSections.push(parts[0].trim());
        letterSection = parts.slice(1).join("\n---\n").trim();
      } else {
        chapterSections.push(s);
      }
    } else if (s.includes("亲爱的探索者")) {
      letterSection = s;
    } else if (/^#\s/.test(s.trim())) {
      chapterSections.push(s);
    }
  }
  const totalPages = chapterSections.length;

  return (
    <div className="pb-8">
      {chapterSections.map((section, i) => (
        <BookPage key={i} content={section.trim()} pageIndex={i} totalPages={totalPages} />
      ))}

      {letterSection && <LetterCard section={letterSection} />}

      {/* Bottom action bar */}
      <div className="flex flex-col gap-3 sticky bottom-16 bg-[#0a0a14]/80 backdrop-blur-xl py-3 -mx-4 px-4 mt-6">
        {/* AI 数据处理告知 */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>报告基于你的问卷和日记数据生成，数据将发送至 AI 服务商进行处理。</span>
        </div>
        <Button variant="primary" size="md" className="flex-1">
          🔄 校准（剩余 3 次）
        </Button>
      </div>
    </div>
  );
}
