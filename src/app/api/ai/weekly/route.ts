import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWeeklyReport } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 速率限制：周报 5 次/分钟
    const rl = rateLimit(`ai:weekly:${session.user.id}`, 5, 60_000);
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
