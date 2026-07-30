import { NextRequest, NextResponse } from "next/server";
import { getChatReply } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession(req);

    // 速率限制：对话 20 次/分钟
    const rl = rateLimit(`ai:chat:${userId}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rl.retryAfter} 秒后重试` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { messages, narrativeText, narrativeResult } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "消息不能为空" },
        { status: 400 }
      );
    }

    const reply = await getChatReply(messages, { narrativeText, narrativeResult });

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "我在这里听着。你想继续说些什么吗？" }
    );
  }
}
