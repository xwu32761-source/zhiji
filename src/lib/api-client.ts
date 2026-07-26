/**
 * 客户端 API 工具函数
 *
 * 原则二（防御式编程）：所有请求含 try-catch，失败返回 fallback 值
 * 原则三（数据隔离）：所有请求自动携带 session cookie，后端按 session 隔离数据
 */

const BASE = "/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options,
    });

    const body = await res.json();

    if (!res.ok) {
      return { ok: false, error: body.error || `请求失败 (${res.status})` };
    }

    return { ok: true, data: body as T };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "网络错误";
    return { ok: false, error: msg };
  }
}

// ========= Pillars =========

export interface PillarsData {
  pillarCompleted: number[] | null;
  pillarData: Record<string, unknown> | null;
  basicAnswers: Record<string, unknown> | null;
  deepTags: string[] | null;
  lastSealAt: string | null;
}

export async function fetchPillars() {
  return request<PillarsData>("/pillars");
}

export async function savePillars(data: {
  pillarCompleted?: number[];
  pillarData?: Record<string, unknown>;
  basicAnswers?: Record<string, unknown>;
  deepTags?: string[];
}) {
  return request<{ ok: boolean }>("/pillars", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ========= Entries =========

export interface ApiEntry {
  id: string;
  entryType: string;
  coreTag: string | null;
  intensity: number | null;
  source: string | null;
  note: string | null;
  score: number | null;
  aiHook: string | null;
  entryDate: string;
  createdAt: string;
}

export async function fetchEntries(params?: { date?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return request<{ entries: ApiEntry[]; total: number }>(
    `/entries${query ? `?${query}` : ""}`
  );
}

export async function createEntry(data: {
  entryType: string;
  coreTag?: string;
  intensity?: number;
  source?: string;
  note?: string;
  aiHook?: string;
}) {
  return request<ApiEntry>("/entries", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ========= Profile =========

export interface ProfileData {
  id: string;
  email: string | null;
  nickname: string;
  createdAt: string;
  profile: Record<string, unknown> | null;
}

export async function fetchProfile() {
  return request<ProfileData>("/profile");
}

export async function updateProfile(data: { nickname?: string }) {
  return request<{ ok: boolean; nickname: string }>("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
