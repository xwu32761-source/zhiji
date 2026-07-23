import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWeeklyReport } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
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
