import { NextRequest, NextResponse } from "next/server";
import { getChatReply } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "消息不能为空" },
        { status: 400 }
      );
    }

    const reply = await getChatReply(messages);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "我在这里听着。你想继续说些什么吗？" }
    );
  }
}
