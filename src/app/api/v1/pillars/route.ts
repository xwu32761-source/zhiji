/**
 * 支柱答案 API
 *
 * 原则三（权限默认拒绝）：必须通过 session 认证
 * 原则二（防御式编程）：输入校验 + try-catch
 * 原则一（数据抽象）：业务字段统一由 prisma schema 定义
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      pillarCompleted: profile?.pillarCompleted ?? null,
      pillarData: profile?.pillarData ?? null,
      basicAnswers: profile?.basicAnswers ?? null,
      deepTags: profile?.deepTags ?? null,
      lastSealAt: profile?.lastSealAt ?? null,
    });
  } catch (err) {
    console.error("[PILLARS_GET]", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { pillarCompleted, pillarData, basicAnswers, deepTags } = body;

    // 类型校验
    if (pillarCompleted !== undefined && !Array.isArray(pillarCompleted)) {
      return NextResponse.json({ error: "pillarCompleted 必须为数组" }, { status: 400 });
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(pillarCompleted !== undefined ? { pillarCompleted } : {}),
        ...(pillarData !== undefined ? { pillarData } : {}),
        ...(basicAnswers !== undefined ? { basicAnswers } : {}),
        ...(deepTags !== undefined ? { deepTags } : {}),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        basicAnswers: basicAnswers ?? {},
        pillarCompleted: pillarCompleted ?? [],
        firstProfileAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[PILLARS_PUT]", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
