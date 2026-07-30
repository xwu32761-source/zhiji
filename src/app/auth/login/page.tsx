"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StarsBackground } from "@/components/ui/stars";

type Tab = "login" | "register";

/* ────────── Login Form ────────── */

type LoginStatus = "idle" | "submitting" | "error";

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("请填写用户名和密码");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg("用户名或密码错误");
        setStatus("error");
      } else {
        router.push("/");
      }
    } catch {
      setErrorMsg("网络错误，请检查连接");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名"
          disabled={status === "submitting"}
          className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
          autoFocus
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          disabled={status === "submitting"}
          className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400/90">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "登录中…" : "登录"}
      </button>
    </form>
  );
}

/* ────────── Register Form ────────── */

type RegisterStatus = "idle" | "submitting" | "error" | "success";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToAI, setAgreedToAI] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const allChecked = agreedToTerms && agreedToAI && ageConfirmed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 客户端校验
    if (!username.trim()) {
      setErrorMsg("请输入用户名");
      setStatus("error");
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 20) {
      setErrorMsg("用户名长度须在 3-20 个字符之间");
      setStatus("error");
      return;
    }
    if (!USERNAME_REGEX.test(username.trim())) {
      setErrorMsg("用户名只能包含字母、数字和下划线");
      setStatus("error");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg("密码长度至少 8 位");
      setStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("两次输入的密码不一致");
      setStatus("error");
      return;
    }
    if (!allChecked) {
      setErrorMsg("请完成所有同意事项");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          agreedToTerms,
          agreedToAI,
          ageConfirmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "注册失败");
        setStatus("error");
        return;
      }

      // 注册成功，自动登录
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg("注册成功，但自动登录失败，请手动登录");
        setStatus("error");
      } else {
        setStatus("success");
        router.push("/");
      }
    } catch {
      setErrorMsg("网络错误，请检查连接");
      setStatus("error");
    }
  };

  const checkboxClass = (checked: boolean) =>
    `flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
      checked
        ? "bg-primary/10 border border-primary/30"
        : "bg-white/5 border border-white/[0.06] hover:bg-white/[0.08]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名（3-20位，字母数字下划线）"
          disabled={status === "submitting"}
          className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码（至少 8 位）"
          disabled={status === "submitting"}
          className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
        />
      </div>
      <div>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="确认密码"
          disabled={status === "submitting"}
          className="w-full h-12 px-4 bg-white/5 border border-white/[0.06] rounded-lg text-white placeholder-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
        />
      </div>

      {/* 同意区域 */}
      <div className="space-y-3">
        <label className={checkboxClass(agreedToTerms)}>
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

        <label className={checkboxClass(agreedToAI)}>
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

        <label className={checkboxClass(ageConfirmed)}>
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/5 text-primary focus:ring-primary/50 accent-primary"
          />
          <span className="text-sm text-white/80 leading-relaxed">
            我确认已年满 18 周岁，或在父母/监护人陪同下使用本服务
          </span>
        </label>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400/90">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "注册中…" : "注册并登录"}
      </button>
    </form>
  );
}

/* ────────── LoginPage ────────── */

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
      <StarsBackground className="absolute inset-0" />
      <div className="relative z-10 max-w-sm w-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
          登录「知己」
        </h1>

        {/* Tab Bar */}
        <div className="flex border-b border-white/[0.06] mb-6">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "login"
                ? "text-white border-b-2 border-primary"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "register"
                ? "text-white border-b-2 border-primary"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            注册
          </button>
        </div>

        {/* Form */}
        {tab === "login" ? <LoginForm /> : <RegisterForm />}

        {/* Footer Links */}
        <p className="text-xs text-white/40 mt-6 text-center leading-relaxed">
          登录即表示你已阅读并同意{" "}
          <a
            href="/privacy"
            className="text-white/60 hover:text-white/80 transition-colors underline underline-offset-2"
          >
            隐私政策
          </a>
          {" 和 "}
          <a
            href="/terms"
            className="text-white/60 hover:text-white/80 transition-colors underline underline-offset-2"
          >
            用户协议
          </a>
        </p>
      </div>
    </div>
  );
}
