import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
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
