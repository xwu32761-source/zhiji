"use client";

import { useState } from "react";
import { saveConsent } from "@/lib/storage";

interface ConsentBannerProps {
  onConsent: () => void;
}

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToAI, setAgreedToAI] = useState(false);
  const [saving, setSaving] = useState(false);

  const allChecked = agreedToTerms && agreedToAI;

  const handleConfirm = () => {
    if (!allChecked) return;
    setSaving(true);
    saveConsent({
      agreedToTerms,
      agreedToAI,
      consentedAt: new Date().toISOString(),
    });
    // Fire-and-forget server sync — don't block on it
    fetch("/api/v1/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreedToTerms, agreedToAI }),
    }).catch(() => {
      /* server sync is best-effort */
    });
    onConsent();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a14]/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-white/5 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔖</div>
          <h2 className="text-lg font-bold text-white tracking-wide">欢迎使用知几</h2>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            在开始之前，请确认以下事项
          </p>
        </div>

        {/* Consent items */}
        <div className="space-y-4 mb-8">
          <label
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              agreedToTerms
                ? "bg-primary/10 border border-primary/30"
                : "bg-white/5 border border-white/[0.06] hover:bg-white/[0.08]"
            }`}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/5 text-primary focus:ring-primary/50 accent-primary"
            />
            <span className="text-sm text-white/80 leading-relaxed">
              我已阅读并同意{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                隐私政策
              </a>
              {" 和 "}
              <a
                href="/terms"
                target="_blank"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                用户协议
              </a>
            </span>
          </label>

          <label
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              agreedToAI
                ? "bg-primary/10 border border-primary/30"
                : "bg-white/5 border border-white/[0.06] hover:bg-white/[0.08]"
            }`}
          >
            <input
              type="checkbox"
              checked={agreedToAI}
              onChange={(e) => setAgreedToAI(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/5 text-primary focus:ring-primary/50 accent-primary"
            />
            <span className="text-sm text-white/80 leading-relaxed">
              我了解我的数据（问卷答案、日记条目、叙事文本）将被发送至 AI 服务商进行相关分析处理
            </span>
          </label>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!allChecked || saving}
          className={`w-full h-12 rounded-lg font-medium text-sm transition-all ${
            allChecked && !saving
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {saving ? "请稍候…" : "确认并开始使用"}
        </button>

        {/* Legal note */}
        <p className="text-[11px] text-white/30 text-center mt-4 leading-relaxed">
          根据《个人信息保护法》要求，我们需要获得您的明确同意
        </p>
      </div>
    </div>
  );
}
