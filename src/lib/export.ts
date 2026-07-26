"use client";

import { getStorageItem, KEYS } from "./storage";

const PILLAR_STORAGE_KEY = "zhiji_pillar_answers_v2";

export interface ExportPayload {
  exportedAt: string;
  version: number;
  data: {
    pillars: Record<string, unknown>;
    diaryEntries: unknown[];
    reports: {
      full: string;
      quick: string;
      type: string;
    };
    weeklyReports: Record<string, unknown>;
    consent: unknown;
  };
}

/** 从 localStorage 收集全部用户数据并触发浏览器下载 */
export function exportAllData(): void {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      pillars: getStorageItem(PILLAR_STORAGE_KEY, {}),
      diaryEntries: getStorageItem<any[]>(KEYS.DIARY_ENTRIES, []),
      reports: {
        full: getStorageItem<string>(KEYS.REPORT_CONTENT, ""),
        quick: getStorageItem<string>(KEYS.REPORT_QUICK, ""),
        type: getStorageItem<string>(KEYS.REPORT_TYPE, ""),
      },
      weeklyReports: getStorageItem<Record<string, unknown>>(KEYS.WEEKLY_REPORTS, {}),
      consent: getStorageItem<unknown>(KEYS.CONSENT, null),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zhiji-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
