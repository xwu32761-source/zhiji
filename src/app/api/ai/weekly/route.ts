import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession(req);

    // 速率限制：周报 5 次/分钟
    const rl = rateLimit(`ai:weekly:${userId}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rl.retryAfter} 秒后重试` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { entries } = await req.json();

    const entriesData = JSON.stringify(entries || [], null, 2);
    const result = await generateWeeklyReport(entriesData);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Weekly API error:", err);
    return NextResponse.json(
      { error: "周报生成失败" },
      { status: 500 }
    );
  }
}
