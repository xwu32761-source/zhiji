"use client";

import { cn } from "@/lib/utils";
import { TabType } from "@/lib/types";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "1", label: "我的前传", icon: "📖" },
  { id: "2", label: "定格此刻", icon: "⚡" },
  { id: "3", label: "时光日记", icon: "📅" },
  { id: "4", label: "说明书", icon: "📄" },
];

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-2xl mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-label={`切换到${tab.label}`}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200",
              activeTab === tab.id
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
