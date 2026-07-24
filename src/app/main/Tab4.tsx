"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PillarAnswers } from "@/lib/types";
import { getStorageItem, KEYS } from "@/lib/storage";
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
      setReportContent(data.report || REPORT_FALLBACK);
    } catch {
      setReportContent(REPORT_FALLBACK);
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

function ReportContentRenderer({ markdown }: { markdown: string }) {
  const sections = markdown.split(/(?=#{1,3}\s)/);

  return (
    <div className="pb-8">
      {sections.map((section, i) => {
        if (section.startsWith("亲爱的")) {
          return (
            <section key={i} className="bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-lg p-6 mb-8">
              {section.split("\n\n").map((para, j) => {
                const t = para.trim();
                if (!t) return null;
                const isSignOff = t === "我一直在看。";
                return (
                  <p key={j} className={`text-sm font-serif italic leading-relaxed mb-4 ${isSignOff ? "text-primary" : "text-white/90"}`}>
                    {t}
                  </p>
                );
              })}
            </section>
          );
        }

        const titleMatch = section.match(/^#{1,3}\s+(.+)$/m);
        const title = titleMatch?.[1] || "";
        const body = section.replace(/^#{1,3}\s+.+$/m, "").trim();
        if (!title && !body) return null;

        if (title.includes("版本更新")) {
          return (
            <section key={i} className="mb-8">
              <h3 className="text-md font-serif font-bold text-primary mb-3 tracking-wide">{title}</h3>
              <div className="border-l-2 border-primary/30 pl-3 space-y-2">
                {body.split("\n").filter(l => l.trim()).map((line, j) => (
                  <p key={j} className="text-xs text-white/70">{line.replace(/^[-*]\s*/, "")}</p>
                ))}
              </div>
            </section>
          );
        }

        const bodyLines = body.split("\n").filter(l => l.trim());
        return (
          <section key={i} className="mb-8">
            {title && <h3 className="text-md font-serif font-bold text-primary mb-3 tracking-wide">{title}</h3>}
            <div className="space-y-2">
              {bodyLines.map((line, j) => {
                const trimmed = line.trim().replace(/^[-*]\s*/, "");
                if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                  const isCharge = trimmed.includes("充能");
                  return (
                    <div key={j} className={`rounded-lg p-3 ${isCharge ? "bg-success/10" : "bg-secondary/10"}`}>
                      <p className={`text-sm font-medium ${isCharge ? "text-success" : "text-secondary"}`}>
                        {trimmed.replace(/\*\*/g, "")}
                      </p>
                    </div>
                  );
                }
                return <p key={j} className="text-sm text-white/90 leading-relaxed">{trimmed}</p>;
              })}
            </div>
          </section>
        );
      })}

      <div className="flex gap-3 sticky bottom-16 bg-[#0a0a14]/80 backdrop-blur-xl py-3 -mx-4 px-4">
        <Button variant="ghost" size="md" className="flex-1">📤 即将上线</Button>
        <Button variant="primary" size="md" className="flex-1">🔄 校准（剩余 3 次）</Button>
      </div>
    </div>
  );
}
