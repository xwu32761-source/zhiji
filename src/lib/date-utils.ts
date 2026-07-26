/**
 * 日期工具函数 — 周计算、周报生成窗口判断
 */

/** 一周的天数 */
const DAYS_IN_WEEK = 7;

/**
 * 获取 ISO 周数（周一为一周第一天）
 * 算法：周四所在的周为该年的第几周
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // 设置为周四（ISO 标准）
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNum;
}

/**
 * 获取某天所在周的周一和周日
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay() || 7; // 周日=7, 周一=1
  // 周一
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  // 周日
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

/** 周 key 格式 "2026-W30" */
export function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** 从周 key 解析年份和周数 */
export function parseWeekKey(weekKey: string): { year: number; week: number } {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid week key: ${weekKey}`);
  return { year: parseInt(match[1]), week: parseInt(match[2]) };
}

/**
 * 从 ISO 周数获取该周周一的具体日期
 */
export function getStartOfWeek(year: number, week: number): Date {
  // 1月4日一定在该年第1周（ISO 标准）
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 周日=7
  // 第1周的周一
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  // 目标周的周一
  const target = new Date(firstMonday);
  target.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
  return target;
}

/**
 * 获取周范围的日期字符串数组 ["2026-07-27", ..., "2026-08-02"]
 */
export function getWeekDateStrings(weekKey: string): string[] {
  const { year, week } = parseWeekKey(weekKey);
  const monday = getStartOfWeek(year, week);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

/** 格式化为 "YYYY-MM-DD" */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 格式化为 "M月D日" */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}月${parseInt(d)}日`;
}

/**
 * 获取当前周的周 key 和日期范围
 */
export function getCurrentWeekInfo(): {
  weekKey: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const range = getWeekRange(now);
  return {
    weekKey: getWeekKey(now),
    weekNumber,
    startDate: formatDate(range.start),
    endDate: formatDate(range.end),
  };
}

/**
 * 判断当天是否在周报生成窗口内（周日 ~ 周一）
 */
export function isWithinGenerationWindow(): boolean {
  const day = new Date().getDay(); // 0=周日, 6=周六
  return day === 0 || day === 1;
}

/**
 * 筛选某周的日记条目
 */
export function filterEntriesByWeek<T extends { entryDate: string }>(
  entries: T[],
  weekKey: string
): T[] {
  const dateStrings = getWeekDateStrings(weekKey);
  const dateSet = new Set(dateStrings);
  return entries.filter((e) => {
    const dateOnly = e.entryDate.slice(0, 10);
    return dateSet.has(dateOnly);
  });
}

/**
 * 从周 key 生成显示文本 "第 W 周（M月D日 - M月D日）"
 */
export function formatWeekLabel(weekKey: string): string {
  const { year, week } = parseWeekKey(weekKey);
  const monday = getStartOfWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startStr = formatShortDate(formatDate(monday));
  const endStr = formatShortDate(formatDate(sunday));
  return `第 ${week} 周（${startStr} - ${endStr}）`;
}
