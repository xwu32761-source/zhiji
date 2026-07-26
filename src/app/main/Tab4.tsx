"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PillarAnswers } from "@/lib/types";
import { getStorageItem, setStorageItem, KEYS } from "@/lib/storage";
import { fetchPillars as apiFetchPillars, fetchEntries as apiFetchEntries } from "@/lib/api-client";

type Tab4State = "empty" | "insufficient" | "ready" | "generated";

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
  const [generated, setGenerated] = useState(false);

  const [pillarProgress, setPillarProgress] = useState(0);
  const [entryProgress, setEntryProgress] = useState(0);

  const pillarNeeded = Math.max(0, PILLAR_NEEDED - pillarProgress);
  const entryNeeded = Math.max(0, ENTRY_NEEDED - entryProgress);

  // Read real progress from localStorage + API on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 先从本地读取
      const localPillarData = getStorageItem<Record<number, PillarAnswers>>(PILLAR_STORAGE_KEY, {});
      const localEntries = getStorageItem<any[]>(KEYS.DIARY_ENTRIES, []);

      let doneCount = Object.values(localPillarData).filter((d) => d.status === "done").length;
      let entryCount = localEntries.length;

      // 再尝试从 API 获取最新数据（仅当 API 返回有效数据时覆盖）
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

        if (doneCount >= PILLAR_NEEDED && entryCount >= ENTRY_NEEDED) {
          setState("ready");
        } else if (doneCount === 0 && entryCount === 0) {
          setState("empty");
        } else {
          setState("insufficient");
        }

        // 检查是否有已生成的说明书
        const savedReport = getStorageItem<string>(KEYS.REPORT_CONTENT, "");
        if (savedReport) {
          setReportContent(savedReport);
          setGenerated(true);
          setState("generated");
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
    } catch {
      setReportContent(REPORT_FALLBACK);
      setStorageItem(KEYS.REPORT_CONTENT, REPORT_FALLBACK);
    }
    setLoading(false);
    setGenerated(true);
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

        <Button variant="ghost" size="md" disabled>
          手册沉睡中……
        </Button>
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

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={handleGenerate}
          className="animate-breathe"
        >
          ✨ 唤醒我的使用手册
        </Button>
      </div>
    );
  }

  // Generated state
  return (
    <div className="pb-8">
      {/* Loading state */}
      {loading && <ReportLoadingOverlay />}

      {/* Report content */}
      {generated && reportContent && (
        <ReportContentRenderer markdown={reportContent} />
      )}
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

// ========== Book-style Report Renderer ==========

/** Parse "第一章" → "一" */
function parseChapterNum(title: string): string {
  const m = title.match(/第([一二三四五六七八九十])章/);
  return m?.[1] ?? "";
}

/** Chapter title bar — "CHAPTER 一" label + large serif heading */
function ChapterTitle({ title }: { title: string }) {
  const clean = title.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "");
  const num = parseChapterNum(clean);
  const display = clean.replace(/第.章[：:]?\s*/, "");
  return (
    <div className="mb-5">
      {num && (
        <span className="text-[10px] text-primary/50 font-semibold tracking-[0.15em] uppercase">
          CHAPTER {num}
        </span>
      )}
      <h2 className="text-lg md:text-xl font-bold text-white font-serif tracking-wider mt-1 leading-snug">
        {display || clean}
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
        <p className="text-sm text-white/90 leading-relaxed">{text.replace(/\*\*/g, "")}</p>
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
      <p className="text-sm text-white/90 leading-relaxed">{text.replace(/\*\*/g, "")}</p>
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
          <p className="text-sm text-white/85 leading-relaxed">{item.replace(/\*\*/g, "")}</p>
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

    // Bold sub‑heading (standalone **text**)
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      const text = line.replace(/\*\*/g, "");
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

    // Short punchy line → callout; long paragraph → plain text
    if (line.length < 30 && !line.endsWith("。") && line.length > 0) {
      nodes.push(<CalloutBlock key={currentKey} text={line} />);
    } else {
      nodes.push(
        <p key={currentKey} className="text-sm text-white/85 leading-relaxed">
          {line.replace(/\*\*/g, "")}
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
      <div className="flex gap-3 sticky bottom-16 bg-[#0a0a14]/80 backdrop-blur-xl py-3 -mx-4 px-4 mt-6">
        <Button variant="ghost" size="md" className="flex-1">
          📤 即将上线
        </Button>
        <Button variant="primary" size="md" className="flex-1">
          🔄 校准（剩余 3 次）
        </Button>
      </div>
    </div>
  );
}
