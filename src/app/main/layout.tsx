"use client";

import { useState, useEffect } from "react";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ToastProvider } from "@/components/shared/ToastManager";
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
    return <div className="min-h-screen bg-bg" />;
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
      <div className="min-h-screen bg-bg pb-16">
        {/* Offline banner */}
        {isOffline && (
          <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center animate-[slideDown_0.3s_ease-out]">
            <p className="text-xs text-amber-700">
              ⚠️ 网络不稳定，数据将本地暂存，恢复后同步
            </p>
          </div>
        )}
        <main className="max-w-2xl mx-auto px-4 pt-4">
          {renderTab()}
        </main>
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </ToastProvider>
  );
}
