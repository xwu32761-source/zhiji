"use client";

import { useState, useEffect } from "react";
import { SOUL_QUESTIONS } from "@/lib/pillars";
import { getAnonymousId, setOnboardingDone, getOnboardingDone, setStorageItem } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import MainLayout from "./main/layout";

type Phase = "landing" | "soul-questions" | "result" | "app";

function generatePersona(answers: Record<string, string>): string {
  const map: Record<string, string[]> = {
    work: ["克制的战略家", "疲惫的赶路人", "燃烧的事业骑士"],
    emotion: ["游荡的浪漫主义者", "孤独的守望者"],
    money: ["清醒的野心家", "自由的朝圣者"],
    self: ["在夜里修复的晨间理想主义者", "安静的破局者", "温柔的战士"],
    default: ["未完成的杰作", "沉默的探索者", "不设限的生活家"],
  };

  const source = answers.q1 === "工作" ? "work"
    : answers.q1 === "感情" ? "emotion"
    : answers.q1 === "经济" ? "money"
    : "self";

  const list = map[source] || map.default;
  return list[Math.floor(Math.random() * list.length)];
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [soulAnswers, setSoulAnswers] = useState<Record<string, string>>({});
  const [persona, setPersona] = useState("");
  const [showProgress, setShowProgress] = useState(false);

  // Check if onboarding already done
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = getAnonymousId(); // ensure anonymous ID is set
    if (getOnboardingDone()) {
      setPhase("app");
    }
  }, []);

  // Landing → Soul questions
  const handleStartOnboarding = () => {
    setPhase("soul-questions");
  };

  // Select answer for current question
  const handleSelectAnswer = (value: string) => {
    const qId = SOUL_QUESTIONS[currentQuestion].id;
    const newAnswers = { ...soulAnswers, [qId]: value };
    setSoulAnswers(newAnswers);

    if (currentQuestion < SOUL_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All answered → generate persona
      const p = generatePersona(newAnswers);
      setPersona(p);
      // Save to local storage
      setStorageItem("zhiji_soul_answers", newAnswers);
      setPhase("result");
      // Animate progress ring
      setTimeout(() => setShowProgress(true), 100);
    }
  };

  // Skip onboarding → go to app
  const handleSkip = () => {
    setOnboardingDone();
    setPhase("app");
  };

  // Enter main app after personality sketch
  const handleEnterApp = () => {
    setOnboardingDone();
    setPhase("app");
  };

  // =========== Landing Page ===========
  if (phase === "landing") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            「知己」
          </h1>
          <p className="text-lg text-white/80 mb-2 leading-relaxed">
            一本关于自己的说明书
          </p>
          <p className="text-sm text-white/60 mb-10 leading-relaxed">
            记录即疗愈。AI 帮你发现你自己都忽略的生存模式。
          </p>
          <Button
            variant="primary"
            size="lg"
            className="bg-white text-primary hover:bg-white/90 px-10"
            onClick={handleStartOnboarding}
          >
            开始书写我的前传
          </Button>
          <p className="text-xs text-white/40 mt-4">
            3 个问题 · 15 秒 · 无需登录
          </p>
        </div>
      </div>
    );
  }

  // =========== Soul Questions ===========
  if (phase === "soul-questions") {
    const q = SOUL_QUESTIONS[currentQuestion];
    const isLast = currentQuestion === SOUL_QUESTIONS.length - 1;
    const hasAnswer = !!soulAnswers[q.id];

    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {SOUL_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                i === currentQuestion ? "bg-primary" : i < currentQuestion ? "bg-success" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <div className="w-full max-w-md bg-card rounded-2xl card-shadow p-8 animate-[fadeIn_0.3s_ease-out]">
          <p className="text-sm text-text-secondary mb-2">问题 {currentQuestion + 1} / 3</p>
          <h2 className="text-xl font-bold text-text-primary mb-6">{q.question}</h2>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectAnswer(opt)}
                className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                  soulAnswers[q.id] === opt
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border bg-white text-text-primary hover:border-primary/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="mt-8 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          跳过建档
        </button>
      </div>
    );
  }

  // =========== Personality Sketch Result ===========
  if (phase === "result") {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6">
        <div className="relative flex items-center justify-center mb-6">
          <ProgressRing
            progress={showProgress ? 30 : 0}
            size={160}
            strokeWidth={6}
          />
        </div>

        <div className="text-center max-w-sm">
          <p className="text-white/60 text-sm mb-2">人格速描</p>
          <h2 className="text-xl font-serif text-white leading-relaxed mb-8">
            「{persona}」
          </h2>

          <Button
            variant="primary"
            size="lg"
            className="bg-white text-primary hover:bg-white/90 px-10"
            onClick={handleEnterApp}
          >
            开始探索
          </Button>
          <p className="text-xs text-white/40 mt-4">
            集齐 10 块人格拼图，解锁完整说明书
          </p>
        </div>
      </div>
    );
  }

  // =========== Main App ===========
  return (
    <MainApp />
  );
}

// =========== Main App with Tabs ===========
function MainApp() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    getAnonymousId();
    setIsInitialized(true);
  }, []);

  if (!isInitialized) return null;

  return <MainLayout />;
}
