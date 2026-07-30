"use client";

import { useState, useEffect } from "react";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastProvider } from "@/components/shared/ToastManager";
import { StarsBackground } from "@/components/ui/stars";
import { SOSButton } from "@/components/shared/SOSButton";
import { TabType } from "@/lib/types";
import Tab1Page from "./Tab1";
import Tab2Page from "./Tab2";
import Tab3Page from "./Tab3";
import Tab4Page from "./Tab4";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("1");
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOffline(typeof navigator !== "undefined" && !navigator.onLine);
  }, []);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0a0a14]" />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "1": return <Tab1Page />;
      case "2": return <Tab2Page />;
      case "3": return <Tab3Page />;
      case "4": return <Tab4Page />;
      default: return <Tab1Page />;
    }
  };

  return (
    <ToastProvider>
      <StarsBackground className="fixed inset-0 -z-10" />
      <div className="relative min-h-screen pb-16">
        {/* Offline banner */}
        {isOffline && (
          <div className="sticky top-0 z-50 bg-amber-500/20 backdrop-blur-md border-b border-amber-500/30 px-4 py-2 text-center animate-[slideDown_0.3s_ease-out]">
            <p className="text-xs text-amber-200">
              ⚠️ 网络不稳定，数据将本地暂存，恢复后同步
            </p>
          </div>
        )}
        <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4">
          {renderTab()}
        </main>
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <SOSButton />
        <footer className="relative z-10 text-center py-4 max-w-2xl mx-auto space-y-1">
          <div>
            <a href="/privacy" className="text-[11px] text-white/30 hover:text-white/50 transition-colors mx-2">隐私</a>
            <span className="text-[11px] text-white/20">·</span>
            <a href="/terms" className="text-[11px] text-white/30 hover:text-white/50 transition-colors mx-2">条款</a>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
