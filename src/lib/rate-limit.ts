/**
 * 速率限制工具（内存滑动窗口）
 *
 * 原则二（防御式编程）：防止 AI 端点被滥用，同一用户每分钟最多 N 次
 * 原则一（数据抽象）：限流阈值统一在这里定义，不散落在路由中
 */
interface RateLimitEntry {
  count: number;
  resetAt: number; // 窗口结束时间戳
}

const store = new Map<string, RateLimitEntry>();

/** 每 5 分钟清理过期条目，防止内存泄漏 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 300_000);
}

/**
 * 检查速率限制
 * @param key  唯一标识，如 "ai:report:user_xxx"
 * @param limit  窗口内最大请求数
 * @param windowMs  窗口时长（毫秒），默认 60s
 * @returns ok=true 通过，ok=false 返回重试等待秒数
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  // 没有记录或窗口已过期 → 重置
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  // 超限 → 拒绝
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  // 计数递增
  entry.count++;
  return { ok: true };
}
