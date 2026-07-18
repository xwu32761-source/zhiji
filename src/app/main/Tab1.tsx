"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PILLARS } from "@/lib/pillars";
import { getPillarQuestions } from "@/lib/questions";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { useToast } from "@/components/shared/ToastManager";
import { PillarAnswers } from "@/lib/types";

const STORAGE_KEY = "zhiji_pillar_answers_v2";
const TOTAL_QS = 48;
const BATCH_SIZE = 3;

function loadAllPillarData(): Record<number, PillarAnswers> {
  return getStorageItem<Record<number, PillarAnswers>>(STORAGE_KEY, {});
}

function savePillarData(data: Record<number, PillarAnswers>) {
  setStorageItem(STORAGE_KEY, data);
}

// ============ Pillar Grid (main view) ============
export default function Tab1Page() {
  const [allData, setAllData] = useState<Record<number, PillarAnswers>>({});
  const [selectedPillar, setSelectedPillar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAllData(loadAllPillarData());
    setLoading(false);
  }, []);

  const completedCount = useMemo(
    () => Object.values(allData).filter((d) => d.status === "done").length,
    [allData]
  );

  const refreshData = useCallback(() => {
    setAllData(loadAllPillarData());
  }, []);

  if (loading) {
    return (
      <div>
        <div className="text-center mb-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto animate-pulse-slow mb-3" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse-slow" />
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (selectedPillar !== null) {
    return (
      <PillarDetailView
        pillarId={selectedPillar}
        initialData={allData[selectedPillar]}
        onBack={() => { setSelectedPillar(null); refreshData(); }}
        onDataChange={(data) => {
          const newAll = { ...allData, [selectedPillar]: data };
          savePillarData(newAll);
          setAllData(newAll);
        }}
      />
    );
  }

  // Main grid
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-text-primary">📖 我的前传</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors" aria-label="帮助">❓</button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <ProgressRing progress={(completedCount / 12) * 100} size={140} strokeWidth={6} label={`${completedCount}/12`} />
        </div>
        <p className="text-sm text-text-secondary mt-3 text-center">
          {completedCount < 3
            ? `还差 ${3 - Math.min(completedCount, 3)} 个支柱即可生成初版说明书`
            : completedCount >= 12 ? "所有支柱已锚定！"
            : `已锚定 ${completedCount} 个支柱`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {PILLARS.map((p) => {
          const data = allData[p.id];
          const status = data?.status || "idle";
          const answeredCount = data ? Object.keys(data.answers).length : 0;

          return (
            <Card key={p.id} variant="pillar"
              className={`p-4 transition-all duration-200 ${
                status === "idle" ? "opacity-60 grayscale" : status === "progress" ? "opacity-90" : "bg-primary-light border border-primary/20"
              }`}
              onClick={() => setSelectedPillar(p.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{p.icon}</span>
                {status === "done" && <span className="text-success text-sm">✅</span>}
              </div>
              <p className="text-sm font-medium text-text-primary">{p.name}</p>
              <p className="text-xs text-text-secondary mt-1">
                {status === "idle" && "待探索"}
                {status === "progress" && `进行中 ${answeredCount}/${TOTAL_QS}`}
                {status === "done" && `已锚定 ${TOTAL_QS}/${TOTAL_QS} ✓`}
              </p>
              {status === "progress" && (
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(answeredCount / TOTAL_QS) * 100}%` }} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {completedCount > 0 && (
        <div className="sticky bottom-4 bg-card/80 backdrop-blur-sm border border-border rounded-full p-1 flex justify-center shadow-md">
          <button className="w-full py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors text-center">
            🔒 封存至人生底层
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Pillar Detail View (答题/回顾) ============
type DetailPhase = "answering" | "choosing" | "reviewing" | "answering-all";

function PillarDetailView({
  pillarId, initialData, onBack, onDataChange,
}: {
  pillarId: number;
  initialData?: PillarAnswers;
  onBack: () => void;
  onDataChange: (data: PillarAnswers) => void;
}) {
  const { showToast } = useToast();
  const pillar = PILLARS.find((p) => p.id === pillarId)!;
  const allQuestions = getPillarQuestions(pillarId);

  // Load existing data
  const existingData = initialData || { answers: {}, supplements: [], status: "idle" as const };
  const answeredCount = Object.keys(existingData.answers).length;

  const [phase, setPhase] = useState<DetailPhase>(
    answeredCount === 0 ? "answering" : answeredCount >= TOTAL_QS ? "reviewing" : "choosing"
  );
  const [batchIndex, setBatchIndex] = useState(Math.floor(answeredCount / BATCH_SIZE));
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [supplements, setSupplements] = useState<string[]>(existingData.supplements || []);
  const [supplementInput, setSupplementInput] = useState("");
  const [allAnswers, setAllAnswers] = useState<Record<string, string>>(existingData.answers);
  const [showAll, setShowAll] = useState(false);

  // Current batch questions
  const batchQs = useMemo(() => {
    if (phase === "answering-all") {
      return allQuestions.slice(answeredCount);
    }
    const start = batchIndex * BATCH_SIZE;
    return allQuestions.slice(start, start + BATCH_SIZE);
  }, [phase, batchIndex, allQuestions, answeredCount]);

  // For "answering-all", calc remaining
  const remainingAll = useMemo(() => allQuestions.slice(answeredCount), [allQuestions, answeredCount]);

  const isLastBatch = (batchIndex + 1) * BATCH_SIZE >= TOTAL_QS;

  const handleSubmit = () => {
    const newAll = { ...allAnswers, ...currentAnswers };
    const totalAnswered = Object.keys(newAll).length;
    const isDone = totalAnswered >= TOTAL_QS;

    const data: PillarAnswers = {
      answers: newAll,
      supplements,
      status: isDone ? "done" : "progress",
    };
    setAllAnswers(newAll);
    onDataChange(data);

    if (isDone) {
      showToast(`✅ ${pillar.name} 全部 ${TOTAL_QS} 题已答完！`, "success");
      setPhase("reviewing");
    } else {
      showToast(`已保存！共 ${TOTAL_QS} 题，还剩 ${TOTAL_QS - totalAnswered} 题`, "success");
      setCurrentAnswers({});
      setPhase("choosing");
    }
  };

  const handleSubmitSupplement = () => {
    if (!supplementInput.trim()) return;
    const newList = [...supplements, supplementInput.trim()];
    setSupplements(newList);
    setSupplementInput("");

    const data: PillarAnswers = {
      answers: allAnswers,
      supplements: newList,
      status: Object.keys(allAnswers).length >= TOTAL_QS ? "done" : "progress",
    };
    onDataChange(data);
    showToast("📝 已补充", "success");
  };

  const handleAnswerAll = () => {
    setPhase("answering-all");
  };

  const handleSubmitAll = () => {
    const newAll = { ...allAnswers, ...currentAnswers };
    const data: PillarAnswers = {
      answers: newAll,
      supplements,
      status: "done",
    };
    setAllAnswers(newAll);
    onDataChange(data);
    showToast(`✅ ${pillar.name} 全部 ${TOTAL_QS} 题已答完！`, "success");
    setPhase("reviewing");
  };

  // ============ Render ============
  return (
    <div className="animate-[slideInRight_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors" aria-label="返回">←</button>
        <div>
          <h2 className="text-lg font-bold text-text-primary">{pillar.icon} {pillar.name}</h2>
          <p className="text-xs text-text-secondary">
            已答 {Object.keys(allAnswers).length}/{TOTAL_QS} 题
            {supplements.length > 0 && ` · ${supplements.length} 条补充`}
          </p>
        </div>
      </div>

      {/* Answering phase: 3 questions per batch */}
      {(phase === "answering" || phase === "answering-all") && (
        <div>
          <p className="text-sm text-text-secondary mb-4">
            {phase === "answering-all"
              ? `全部剩余 ${remainingAll.length} 题`
              : `第 ${batchIndex * BATCH_SIZE + 1}-${Math.min((batchIndex + 1) * BATCH_SIZE, TOTAL_QS)} 题 / 共 ${TOTAL_QS} 题`}
          </p>

          <div className="space-y-5 mb-6">
            {(phase === "answering" ? batchQs : remainingAll).map((q) => (
              <Card key={q.id} className="p-4">
                <p className="text-sm font-medium text-text-primary mb-3">{q.id.replace(/^p\d+_q/, "Q")}. {q.text}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const qId = q.id;
                    const selected = currentAnswers[qId] === opt;
                    return (
                      <button key={opt} onClick={() => setCurrentAnswers((prev) => ({ ...prev, [qId]: opt }))}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                          selected ? "bg-primary text-white" : "bg-primary-light text-text-secondary hover:bg-primary/20"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Submit button — bottom right */}
          <div className="flex justify-end mb-4">
            {phase === "answering-all" ? (
              <Button variant="primary" size="md" onClick={handleSubmitAll}
                disabled={Object.keys(currentAnswers).length < remainingAll.length}
              >
                ✅ 提交全部答案
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleSubmit}
                disabled={Object.keys(currentAnswers).length < batchQs.length}
              >
                ✏️ 提交
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Choosing phase: what to do next */}
      {phase === "choosing" && (
        <div className="bg-card rounded-xl card-shadow p-6 text-center animate-[fadeIn_0.3s_ease-out]">
          <p className="text-lg mb-1">✅</p>
          <p className="text-sm font-medium text-text-primary mb-1">
            已答 {Object.keys(allAnswers).length}/{TOTAL_QS} 题
          </p>
          <p className="text-xs text-text-secondary mb-5">还要继续答题吗？</p>

          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Button variant="primary" size="md" onClick={() => { setBatchIndex((i) => i + 1); setPhase("answering"); }}>
              再答 3 题
            </Button>
            <Button variant="secondary" size="md" onClick={handleAnswerAll}>
              答完全部（{TOTAL_QS - Object.keys(allAnswers).length} 题）
            </Button>
            <Button variant="ghost" size="md" onClick={() => setPhase("reviewing")}>
              先不答了
            </Button>
          </div>
        </div>
      )}

      {/* Reviewing phase: show all answered + supplements */}
      {phase === "reviewing" && (
        <div>
          {/* Status banner */}
          <div className={`rounded-xl p-4 mb-4 ${Object.keys(allAnswers).length >= TOTAL_QS ? "bg-success/10" : "bg-primary-light"}`}>
            <p className="text-sm font-medium text-text-primary">
              {Object.keys(allAnswers).length >= TOTAL_QS
                ? `✅ ${pillar.name} 已完成全部 ${TOTAL_QS} 题`
                : `📝 已答 ${Object.keys(allAnswers).length}/${TOTAL_QS} 题`}
            </p>
            <p className="text-xs text-text-secondary mt-1">{supplements.length} 条补充</p>
          </div>

          {/* Continue answering button (if not done) */}
          {Object.keys(allAnswers).length < TOTAL_QS && (
            <button onClick={() => { setBatchIndex(Math.floor(Object.keys(allAnswers).length / BATCH_SIZE)); setPhase("answering"); }}
              className="w-full py-2.5 text-sm text-primary bg-primary-light rounded-full mb-4 hover:bg-primary/20 transition-colors"
            >
              继续答题（还剩 {TOTAL_QS - Object.keys(allAnswers).length} 题）
            </button>
          )}

          {/* Show all answered toggle */}
          {Object.keys(allAnswers).length > 0 && (
            <div className="mb-4">
              <button onClick={() => setShowAll(!showAll)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {showAll ? "收起全部" : `展开全部已答（${Object.keys(allAnswers).length} 题）`}
              </button>

              {showAll && (
                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(allAnswers).map(([qId, answer]) => {
                    const q = allQuestions.find((q) => q.id === qId);
                    const qNum = qId.replace(/^p\d+_q/, "Q");
                    return (
                      <div key={qId} className="bg-card rounded-lg card-shadow p-3 text-sm">
                        <p className="text-text-primary font-medium">{qNum}. {q?.text || qId}</p>
                        <p className="text-text-secondary mt-0.5">答：{answer}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Supplements list */}
          {supplements.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-text-primary">补充记录</p>
              {supplements.map((s, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-text-primary">
                  <span className="text-xs text-amber-600 mr-2">#{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Supplement input — fixed at bottom */}
          <div className="sticky bottom-0 bg-bg pt-3 pb-4">
            <div className="bg-card rounded-xl card-shadow p-4 border border-border">
              <p className="text-xs text-text-secondary mb-2">还有想补充的吗？</p>
              <textarea
                value={supplementInput}
                onChange={(e) => setSupplementInput(e.target.value)}
                placeholder="写点你想说的……"
                rows={2}
                className="w-full p-3 rounded-lg border border-border bg-white text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 mb-2"
              />
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSubmitSupplement} disabled={!supplementInput.trim()}>
                  提交补充
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
