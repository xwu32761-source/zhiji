"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { StarsBackground } from "@/components/ui/stars";

const EMAIL_LOGIN_DISABLED =
  process.env.NEXT_PUBLIC_EMAIL_LOGIN_DISABLED === "true";

type Status = "idle" | "sending" | "sent" | "error";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("请输入有效的邮箱地址");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const result = await signIn("email", {
        email: trimmed,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg("发送失败，请稍后重试");
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg("网络错误，请检查连接");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
        <StarsBackground className="absolute inset-0" />
        <div className="relative z-10 max-w-sm text-center">
          <div className="text-5xl mb-6">✉️</div>
          <h1 className="text-xl font-bold text-white mb-3 tracking-wide">
            查收你的登录邮件
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            我们已将魔法链接发送到
            <br />
            <span className="text-primary font-medium">{email}</span>
          </p>
          <p className="text-xs text-white/50 mt-6">
            点击邮件中的链接即可登录，链接 10 分钟内有效。
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-8 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            重新输入邮箱
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
      <StarsBackground className="absolute inset-0" />
      <div className="relative z-10 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">
          登录「知己」
        </h1>
        <p className="text-sm text-white/60 mb-8">
          输入邮箱，我们给你发一个登录链接
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === "sending"}
              className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
              autoFocus
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400/90">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "发送中…" : "发送登录链接"}
          </button>
        </form>

        <p className="text-xs text-white/40 mt-6 leading-relaxed">
          登录即表示你已阅读并同意{" "}
          <a href="/privacy" className="text-white/60 hover:text-white/80 transition-colors underline underline-offset-2">
            隐私政策
          </a>
          {" 和 "}
          <a href="/terms" className="text-white/60 hover:text-white/80 transition-colors underline underline-offset-2">
            用户协议
          </a>
        </p>
      </div>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
      <StarsBackground className="absolute inset-0" />
      <div className="relative z-10 max-w-sm text-center">
        <div className="text-5xl mb-6">🔜</div>
        <h1 className="text-xl font-bold text-white mb-3 tracking-wide">
          即将开放
        </h1>
        <p className="text-sm text-white/70 leading-relaxed">
          邮箱登录功能正在做最后准备，敬请期待。
        </p>
        <p className="text-xs text-white/50 mt-6 leading-relaxed">
          域名备案完成后即可使用。
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  if (EMAIL_LOGIN_DISABLED) return <ComingSoon />;
  return <LoginForm />;
}
