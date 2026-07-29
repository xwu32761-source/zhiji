"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StarButton } from "@/components/ui/star-button";
import { StarsBackground } from "@/components/ui/stars";
import MainLayout from "./main/layout";

const EMAIL_LOGIN_DISABLED =
  process.env.NEXT_PUBLIC_EMAIL_LOGIN_DISABLED === "true";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState<"landing" | "loading" | "app">("loading");

  useEffect(() => {
    if (status === "loading") return;
    // 登录关闭期间，未登录也能直接进应用
    if (status === "authenticated" || EMAIL_LOGIN_DISABLED) {
      setPhase("app");
    } else {
      setPhase("landing");
    }
  }, [status]);

  // Enter main app — 登录关闭时直接进，否则跳登录页
  const handleEnter = () => {
    if (status === "authenticated" || EMAIL_LOGIN_DISABLED) {
      setPhase("app");
    } else {
      router.push("/auth/login");
    }
  };

  if (phase === "loading") return null;

  if (phase === "landing") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-6">
        <StarsBackground className="absolute inset-0" />
        <div className="relative z-10 max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            「知己」
          </h1>
          <p className="text-lg text-white/80 mb-2 leading-relaxed text-center">
            一本关于自己的说明书
          </p>
          <p className="text-sm text-white/60 mb-10 leading-relaxed text-center">
            记录即疗愈。AI 帮你发现你自己都忽略的生存模式。
          </p>
          <StarButton
            lightColor="#818CF8"
            backgroundColor="#5B6ABF"
            className="px-8 h-12 text-base"
            onClick={handleEnter}
          >
            开始探索
          </StarButton>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}
