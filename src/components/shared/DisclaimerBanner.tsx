"use client";

import { cn } from "@/lib/utils";

type DisclaimerType = "narrative" | "weekly" | "report";

const DISCLAIMER_TEXT: Record<DisclaimerType, string> = {
  narrative:
    "AI 分析仅供参考，不构成心理咨询或医疗诊断。如果你正经历严重的情绪困扰，请联系专业心理咨询师或拨打心理援助热线：400-161-9995（全国心理援助热线）。",
  weekly:
    "周报由 AI 基于你的记录自动生成，不替代专业心理健康建议。",
  report:
    "本说明书由 AI 生成，仅作为自我探索的参考，不具备临床或诊断意义。",
};

interface DisclaimerBannerProps {
  type: DisclaimerType;
  className?: string;
}

export function DisclaimerBanner({ type, className }: DisclaimerBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90",
        className,
      )}
    >
      <span className="shrink-0 mt-0.5">⚠️</span>
      <span className="leading-relaxed">{DISCLAIMER_TEXT[type]}</span>
    </div>
  );
}
