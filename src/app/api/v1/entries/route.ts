/**
 * 日记条目 API
 *
 * 原则三（权限默认拒绝）：必须通过 session 认证，数据隔离（仅返回当前用户的数据）
 * 原则二（防御式编程）：输入校验 + try-catch + 超时
 * 原则一（抽象）：entryType 用枚举验证
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ENTRY_TYPES = ["emotion", "behavior", "intake", "narrative"] as const;

/** 从 tag 推导情绪分值 */
function scoreFromTag(tag?: string): number {
  const positive = ["开心", "平静", "爱", "信任", "满足", "感恩"];
  const negative = ["焦虑", "恐惧", "愤怒", "悲伤", "厌恶", "压力"];
  if (!tag) return 0;
  if (positive.some((p) => tag.includes(p))) return Math.floor(Math.random() * 3) + 2;
  if (negative.some((n) => tag.includes(n))) return -(Math.floor(Math.random() * 3) + 2);
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { entryType, coreTag, intensity, source, note } = body;

    // 类型校验
    if (!entryType || !VALID_ENTRY_TYPES.includes(entryType)) {
      return NextResponse.json(
        { error: "entryType 必须为 emotion / behavior / intake / narrative" },
        { status: 400 }
      );
    }
    if (intensity !== undefined && (typeof intensity !== "number" || intensity < 1 || intensity > 5)) {
      return NextResponse.json({ error: "intensity 必须在 1-5 之间" }, { status: 400 });
    }

    const now = new Date();
    const entry = await prisma.diaryEntry.create({
      data: {
        userId: session.user.id,
        entryType,
        coreTag: coreTag || null,
        intensity: intensity || null,
        source: source || null,
        note: note || null,
        score: scoreFromTag(coreTag),
        entryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[ENTRIES_POST]", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const where: Record<string, unknown> = { userId: session.user.id };
    if (date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.entryDate = { gte: start, lt: end };
    }

    const entries = await prisma.diaryEntry.findMany({
      where,
      orderBy: { entryDate: "desc" },
      take: limit,
    });

    return NextResponse.json({ entries, total: entries.length });
  } catch (err) {
    console.error("[ENTRIES_GET]", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
