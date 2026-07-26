"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/shared/ToastManager";
import { Button } from "@/components/ui/Button";
import { DiaryEntryData } from "@/lib/types";
import { getStorageItem, setStorageItem, KEYS } from "@/lib/storage";
import { createEntry as apiCreateEntry } from "@/lib/api-client";

const STORAGE_KEY = KEYS.DIARY_ENTRIES;

// Sentiment for score derivation
const POSITIVE_EMOTIONS = new Set(["开心", "平静", "爱/信任"]);
const NEGATIVE_EMOTIONS = new Set(["焦虑", "恐惧", "愤怒", "悲伤"]);

function getScore(emotionName: string, intensity: number): number {
  if (POSITIVE_EMOTIONS.has(emotionName)) return intensity;
  if (NEGATIVE_EMOTIONS.has(emotionName)) return -intensity;
  return 0; // behavior / intake → neutral
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadEntries(): DiaryEntryData[] {
  return getStorageItem<DiaryEntryData[]>(STORAGE_KEY, []);
}

function saveEntryLocal(entry: DiaryEntryData) {
  const entries = loadEntries();
  entries.unshift(entry);
  setStorageItem(STORAGE_KEY, entries);
}

/** 先存本地（即时生效），再同步 API */
async function saveEntry(entry: DiaryEntryData): Promise<void> {
  saveEntryLocal(entry);
  const res = await apiCreateEntry({
    entryType: entry.entryType,
    coreTag: entry.coreTag || undefined,
    intensity: entry.intensity || undefined,
    source: entry.source || undefined,
    note: entry.note || undefined,
    aiHook: entry.aiHook || undefined,
  });
  if (!res.ok) {
    console.warn("API 同步失败，本地已保存");
  }
}

// Emotion taxonomy
const EMOTION_CATEGORIES = [
  {
    type: "emotion" as const,
    label: "💭 此刻的情绪",
    data: [
      { name: "焦虑", variants: ["担忧", "不安", "恐慌", "畏惧"], details: ["心慌意乱", "患得患失", "坐立难安", "思虑过度", "害怕失控"] },
      { name: "恐惧", variants: ["惊吓", "忌惮", "胆怯"], details: ["被吓一跳", "毛骨悚然", "不敢面对", "怯场"] },
      { name: "平静", variants: ["安宁", "松弛", "踏实", "超然"], details: ["心如止水", "放空", "无忧无虑", "舒坦", "慵懒"] },
      { name: "愤怒", variants: ["恼火", "暴躁", "憎恨", "敌意"], details: ["被冒犯", "不耐烦", "咬牙切齿", "不公平感"] },
      { name: "开心", variants: ["欣喜", "兴奋", "温暖", "自豪"], details: ["满足", "激动", "甜蜜", "被治愈", "成就感"] },
      { name: "悲伤", variants: ["忧郁", "失落", "哀痛", "凄凉"], details: ["难过想哭", "觉得空落落的", "绝望", "孤单"] },
      { name: "爱/信任", variants: ["亲密", "欣赏", "依赖"], details: ["被理解", "想靠近", "温暖陪伴", "感动"] },
    ],
  },
  {
    type: "behavior" as const,
    label: "🎯 此刻的行为",
    data: [
      { name: "工作", variants: ["专注", "拖延", "忙碌"], details: ["高效输出", "摸鱼", "加班", "会议轰炸"] },
      { name: "运动", variants: ["有氧", "力量", "拉伸"], details: ["跑步", "游泳", "瑜伽", "散步", "健身"] },
      { name: "休息", variants: ["睡眠", "放空", "娱乐"], details: ["小憩", "刷手机", "追剧", "发呆"] },
      { name: "学习", variants: ["阅读", "听课", "实践"], details: ["看书", "上网课", "做笔记", "背单词"] },
      { name: "社交", variants: ["聚会", "独处", "陪伴"], details: ["朋友聚餐", "宅家", "陪家人", "遛宠物"] },
      { name: "创作", variants: ["写作", "绘画", "音乐", "手工"], details: ["写日记", "涂鸦", "弹琴", "做手工"] },
      { name: "家务", variants: ["清洁", "整理", "烹饪"], details: ["打扫", "收纳", "做饭", "洗衣服"] },
      { name: "通勤", variants: ["步行", "驾车", "公共交通"], details: ["走路", "开车", "挤地铁", "骑车"] },
    ],
  },
  {
    type: "intake" as const,
    label: "🌱 此刻的滋养",
    data: [
      { name: "饮食", variants: ["正餐", "零食", "饮品"], details: ["外卖", "下厨", "奶茶", "咖啡", "酒"] },
      { name: "信息", variants: ["阅读", "视频", "社交"], details: ["看书", "刷短视频", "看新闻", "刷朋友圈"] },
      { name: "精神补给", variants: ["灵感", "自然", "音乐", "艺术"], details: ["看日落", "听音乐", "逛展", "冥想", "去公园"] },
    ],
  },
];

const TOAST_MSGS = ["✨ 已捕获", "🌊 汇入长河", "📌 钉在时光墙上", "☀️ 阳光存档", "🌙 夜色收藏"];

type Mode = "quick" | "narrative";

export default function Tab2Page() {
  const [mode, setMode] = useState<Mode>("quick");
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const today = todayStr();
    setTodayCount(loadEntries().filter((e) => e.entryDate === today).length);
  }, []);

  const handleSaved = () => {
    const today = todayStr();
    const entries = loadEntries();
    setTodayCount(entries.filter((e) => e.entryDate === today).length);
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-white tracking-wider">⚡ 定格此刻</h1>
        <span className="text-xs text-white/70 bg-white/5 backdrop-blur-xl border border-white/[0.06] px-3 py-1 rounded-full">
          今日 {todayCount} 次
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-full p-1 mb-6">
        <button
          onClick={() => setMode("quick")}
          className={`flex-1 py-2 text-sm rounded-full transition-colors ${
            mode === "quick" ? "bg-white/15 text-white" : "text-white/70"
          }`}
        >
          闪电定格
        </button>
        <button
          onClick={() => setMode("narrative")}
          className={`flex-1 py-2 text-sm rounded-full transition-colors ${
            mode !== "quick" ? "bg-white/15 text-white" : "text-white/70"
          }`}
        >
          叙事疗愈
        </button>
      </div>

      {/* Content based on mode */}
      {mode === "quick" ? <QuickModeContent onSaved={handleSaved} /> : <NarrativeModeContent />}
    </div>
  );
}

// =========== Quick Mode Content ===========
function QuickModeContent({ onSaved }: { onSaved?: () => void }) {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [source, setSource] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const category = selectedCategory !== null ? EMOTION_CATEGORIES[selectedCategory] : null;
  const emotion = selectedEmotion !== null ? category?.data[selectedEmotion] : null;

  const handleQuickSave = async () => {
    setLoading(true);

    // Build and save entry
    const now = new Date();
    const entry: DiaryEntryData = {
      id: crypto.randomUUID(),
      entryType: category?.type || "emotion",
      coreTag: emotion?.name || null,
      intensity: intensity,
      source: source,
      note: selectedDetail ? (note ? `${selectedDetail} · ${note}` : selectedDetail) : note,
      aiHook: null,
      score: emotion ? getScore(emotion.name, intensity) : 0,
      entryDate: todayStr(),
      createdAt: now.toISOString(),
    };
    saveEntry(entry);

    await new Promise((r) => setTimeout(r, 500));
    const msg = TOAST_MSGS[Math.floor(Math.random() * TOAST_MSGS.length)];
    showToast(msg, "success");
    setSelectedCategory(null);
    setSelectedEmotion(null);
    setSelectedDetail(null);
    setIntensity(3);
    setSource(null);
    setNote("");
    setLoading(false);
    onSaved?.();
  };

  return (
    <div>
      {selectedCategory === null ? (
        <div className="space-y-3">
          {EMOTION_CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setSelectedCategory(i)}
              className="w-full p-5 bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-xl text-left hover:bg-white/[0.08] transition-all"
            >
              <span className="text-xl text-white/90 tracking-wide">{cat.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedCategory(null); setSelectedEmotion(null); setSelectedDetail(null); }}
            className="text-sm text-white/70 mb-4 hover:text-white transition-colors"
          >
            ← 返回分类
          </button>

          {selectedEmotion === null ? (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {category!.data.map((em, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEmotion(i)}
                  className="p-3 bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-lg text-sm text-left text-white/80 hover:bg-white/[0.08] transition-all"
                >
                  {em.name}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setSelectedEmotion(null)}
                className="text-sm text-white/70 mb-4 hover:text-white transition-colors"
              >
                ← 返回
              </button>

              <p className="text-sm font-medium text-white/90 tracking-wide mb-3">
                {category!.label} &gt; {emotion!.name}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {emotion!.details.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDetail(d)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      selectedDetail === d ? "bg-primary text-white" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-sm text-white/80 mb-2">强度：{intensity}/5</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setIntensity(v)}
                      className={`w-10 h-10 rounded-full text-sm transition-all ${
                        v <= intensity ? "bg-primary text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-white/80 mb-2">来源</p>
                <div className="flex gap-2">
                  {["👤 我自己", "👥 他人", "🌍 外物"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className={`px-4 py-2 rounded-full text-xs transition-all ${
                        source === s ? "bg-primary text-white" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="一句话带过，选填"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-white/50 mb-6 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
              />

              <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={handleQuickSave}>
                ⚡ 定格此刻
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =========== Narrative Mode Content ===========
type ChatPhase = "input" | "report" | "chat";

function NarrativeModeContent() {
  const { showToast } = useToast();
  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeResult, setNarrativeResult] = useState<any>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [chatPhase, setChatPhase] = useState<ChatPhase>("input");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  const handleNarrativeSubmit = async () => {
    if (narrativeText.trim().length < 5) return;
    setNarrativeLoading(true);
    try {
      const res = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narrativeText.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNarrativeResult(data);
    } catch {
      // Fallback to mock
      setNarrativeResult({
        title: "雨中的独行者",
        mirror: "你描述了一个人在深夜独自面对内心困惑的场景。",
        psychology: "内省性独处——一种主动选择的自我整合状态。",
        empathy: "那种既想被理解又害怕被打扰的矛盾，我懂。",
        action: "明天给自己泡一杯茶，安静坐 5 分钟。",
      });
    }
    setNarrativeLoading(false);
    setChatPhase("report");
  };

  const handleStartChat = () => {
    setChatPhase("chat");
    setMessages([
      { role: "ai", text: "我一直在看你的叙述。有些感受，说出来之后反而变得更清晰了。你想继续聊聊吗？" },
    ]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const updatedMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(updatedMessages);
    setAiTyping(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply || "我在这里听着。" }]);
    } catch {
      const fallbacks = [
        "嗯，我在听。能告诉我更多细节吗？",
        "我很好奇——你的身体有什么感觉？",
      ];
      setMessages((prev) => [...prev, {
        role: "ai",
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      }]);
    }
    setAiTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveAndReturn = () => {
    // 保存叙事分析为日记条目
    if (narrativeResult) {
      const now = new Date();
      const entry: DiaryEntryData = {
        id: crypto.randomUUID(),
        entryType: "narrative",
        coreTag: narrativeResult.title || "未命名",
        intensity: null,
        source: null,
        note: narrativeResult.mirror || "",
        aiHook: JSON.stringify(narrativeResult),
        score: 0,
        entryDate: todayStr(),
        createdAt: now.toISOString(),
      };
      saveEntry(entry);
    }
    showToast("📖 已存入时光日记", "success");
    setChatPhase("input");
    setNarrativeResult(null);
    setNarrativeText("");
    setMessages([]);
  };

  // Phase 1: Input
  if (chatPhase === "input") {
    return (
      <div>
        <textarea
          value={narrativeText}
          onChange={(e) => setNarrativeText(e.target.value)}
          placeholder="今天发生了什么？开心的、难过的、困惑的……我都想听。"
          className="w-full h-48 p-4 rounded-lg bg-white/5 backdrop-blur-xl border border-white/[0.06] text-white text-sm resize-none placeholder-white/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 mb-4 transition-all"
        />
        <p className="text-xs text-white/70 text-right mb-3">
          {narrativeText.length} 字 {narrativeText.length < 5 ? "（至少 5 字）" : "✅"}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={narrativeLoading}
          disabled={narrativeText.trim().length < 5}
          onClick={handleNarrativeSubmit}
        >
          🌿 递给我的树洞
        </Button>
      </div>
    );
  }

  // Phase 2: Report
  if (chatPhase === "report") {
    return (
      <div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 mb-4 animate-[fadeIn_0.4s_ease-out]">
          <p className="text-sm text-white/70 mb-1 tracking-wide">🔖 心灵回响</p>
          <p className="text-lg font-serif text-primary mb-4">{narrativeResult.title}</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/70 mb-1">第一层 · 镜中之镜</p>
              <p className="text-sm text-white/90 leading-relaxed">{narrativeResult.mirror}</p>
            </div>
            <div>
              <p className="text-xs text-white/70 mb-1">第二层 · 深层透视</p>
              <p className="text-sm text-white/90 leading-relaxed">{narrativeResult.psychology}</p>
            </div>
            <div>
              <p className="text-xs text-white/70 mb-1">第三层 · 与你同在</p>
              <p className="text-sm text-white/90 leading-relaxed">{narrativeResult.empathy}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs text-white/70 mb-1 tracking-wide">✨ 一剂行动微光</p>
              <p className="text-sm text-primary">{narrativeResult.action}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleSaveAndReturn}
          >
            📖 存入今日日记 & 人生基石
          </Button>
          <Button variant="ghost" size="lg" onClick={handleStartChat}>
            💬 我还想再聊聊
          </Button>
        </div>
      </div>
    );
  }

  // Phase 3: Chat
  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Back to report button */}
      <button
        onClick={() => setChatPhase("report")}
        className="text-sm text-white/70 mb-3 hover:text-white transition-colors self-start"
      >
        ← 返回报告
      </button>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 px-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[fadeIn_0.3s_ease-out]`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-white/5 backdrop-blur-xl border border-white/[0.06] text-white/90 rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* AI typing indicator */}
        {aiTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-xl border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说说你的感受……"
          rows={2}
          className="flex-1 p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/[0.06] text-white text-sm resize-none placeholder-white/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleSendMessage}
          disabled={!chatInput.trim() || aiTyping}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
          aria-label="发送"
        >
          ↑
        </button>
      </div>

      {/* Settle button */}
      <button
        onClick={handleSaveAndReturn}
        className="mt-3 w-full py-2.5 rounded-full bg-white/10 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors tracking-wide"
      >
        🤝 沉淀为最终报告
      </button>
    </div>
  );
}
