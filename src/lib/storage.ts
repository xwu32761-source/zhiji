// Local storage helpers with JSON safety

import type { ConsentData } from "./types";

const KEYS = {
  ANONYMOUS_ID: "zhiji_anonymous_id",
  USER_PROFILE: "zhiji_user_profile",
  PILLAR_ANSWERS: "zhiji_pillar_answers",
  ONBOARDING_DONE: "zhiji_onboarding_done",
  DIARY_ENTRIES: "zhiji_diary_entries",
  WEEKLY_REPORTS: "zhiji_weekly_reports",
  REPORT_CONTENT: "zhiji_report_content",
  REPORT_QUICK: "zhiji_report_quick",
  REPORT_TYPE: "zhiji_report_type",
  CONSENT: "zhiji_consent",
} as const;

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEYS.ANONYMOUS_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.ANONYMOUS_ID, id);
  }
  return id;
}

export function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function getOnboardingDone(): boolean {
  return getStorageItem<boolean>(KEYS.ONBOARDING_DONE, false);
}

export function setOnboardingDone(): void {
  setStorageItem(KEYS.ONBOARDING_DONE, true);
}

// =========== Weekly Reports ===========

export interface WeeklyReportData {
  weekKey: string;
  summary: string;
  pattern: string;
  insight: string;
  generatedAt: string;
}

export function getWeeklyReports(): Record<string, WeeklyReportData> {
  return getStorageItem<Record<string, WeeklyReportData>>(KEYS.WEEKLY_REPORTS, {});
}

export function getWeeklyReport(weekKey: string): WeeklyReportData | null {
  const reports = getWeeklyReports();
  return reports[weekKey] || null;
}

export function saveWeeklyReport(report: WeeklyReportData): void {
  const reports = getWeeklyReports();
  reports[report.weekKey] = report;
  setStorageItem(KEYS.WEEKLY_REPORTS, reports);
}

// =========== Consent ===========

export function getConsent(): ConsentData | null {
  return getStorageItem<ConsentData | null>(KEYS.CONSENT, null);
}

export function saveConsent(consent: ConsentData): void {
  setStorageItem(KEYS.CONSENT, consent);
}

/** 清除所有本地缓存数据，返回被清除的 key 列表 */
export function clearLocalData(): string[] {
  const removed: string[] = [];
  for (const k of Object.values(KEYS)) {
    try { localStorage.removeItem(k); removed.push(k); } catch {}
  }
  // 旧版支柱数据 key
  try { localStorage.removeItem("zhiji_pillar_answers_v2"); removed.push("zhiji_pillar_answers_v2"); } catch {}
  return removed;
}

export { KEYS };
