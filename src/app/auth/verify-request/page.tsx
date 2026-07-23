"use client";

import { StarsBackground } from "@/components/ui/stars";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
      <StarsBackground className="absolute inset-0" />
      <div className="relative z-10 max-w-sm text-center">
        <div className="text-5xl mb-6">✉️</div>
        <h1 className="text-xl font-bold text-white mb-3 tracking-wide">
          查收你的登录邮件
        </h1>
        <p className="text-sm text-white/70 leading-relaxed">
          如果该邮箱已注册，你将收到一封包含登录链接的邮件。
        </p>
        <p className="text-xs text-white/50 mt-6">
          链接 10 分钟内有效，收不到请检查垃圾邮件。
        </p>
        <a
          href="/auth/login"
          className="inline-block mt-8 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          返回登录
        </a>
      </div>
    </div>
  );
}
