/**
 * 用户配额逻辑（月度报告刷新次数）
 *
 * 原则一（数据抽象）：配额计算规则集中于此，不散落在 API 路由中
 * 原则二（防御式编程）：自动初始化 + 跨月重置，防止未定义状态
 */
import { prisma } from "@/lib/prisma";

export interface QuotaData {
  refreshUsed: number;
  refreshLimit: number;
  resetMonth: string;
  lastRefreshedAt: string | null;
}

/** 当前月份 "2026-07" 格式 */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 读取用户配额，自动初始化 + 跨月重置
 * - 无记录 → 创建默认配额（3 次/月）
 * - 月份变更 → 重置 refreshUsed = 0
 */
export async function getQuota(userId: string): Promise<QuotaData> {
  const month = currentMonth();
  let quota = await prisma.quota.findUnique({ where: { userId } });

  if (!quota) {
    quota = await prisma.quota.create({
      data: { userId, resetMonth: month },
    });
  } else if (quota.resetMonth !== month) {
    quota = await prisma.quota.update({
      where: { userId },
      data: { refreshUsed: 0, resetMonth: month },
    });
  }

  return {
    refreshUsed: quota.refreshUsed,
    refreshLimit: quota.refreshLimit,
    resetMonth: quota.resetMonth,
    lastRefreshedAt: quota.lastRefreshedAt?.toISOString() ?? null,
  };
}

/**
 * 消费一次刷新配额
 * - 有剩余 → ++refreshUsed, 返回成功
 * - 用尽 → 返回 { ok: false, reason: "quota_exceeded" }
 */
export async function useQuota(
  userId: string
): Promise<
  | { ok: true; quota: QuotaData }
  | { ok: false; quota: QuotaData; reason: "quota_exceeded" }
> {
  // 先确保配额记录存在且未过期
  const quota = await getQuota(userId);

  if (quota.refreshUsed >= quota.refreshLimit) {
    return { ok: false, quota, reason: "quota_exceeded" };
  }

  const updated = await prisma.quota.update({
    where: { userId },
    data: {
      refreshUsed: { increment: 1 },
      lastRefreshedAt: new Date(),
    },
  });

  return {
    ok: true,
    quota: {
      refreshUsed: updated.refreshUsed,
      refreshLimit: updated.refreshLimit,
      resetMonth: updated.resetMonth,
      lastRefreshedAt: updated.lastRefreshedAt?.toISOString() ?? null,
    },
  };
}
