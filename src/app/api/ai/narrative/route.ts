import { NextRequest, NextResponse } from "next/server";
import { analyzeNarrative } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession(req);

    // 速率限制：叙事分析 10 次/分钟
    const rl = rateLimit(`ai:narrative:${userId}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rl.retryAfter} 秒后重试` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json(
        { error: "输入文字至少 5 个字符" },
        { status: 400 }
      );
    }

    const result = await analyzeNarrative(text.trim());

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Narrative API error:", err);
    return NextResponse.json(
      { error: "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}
