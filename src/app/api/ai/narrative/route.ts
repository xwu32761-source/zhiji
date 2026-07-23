import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeNarrative } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
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
