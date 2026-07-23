/**
 * 用户资料 API
 *
 * 原则三（权限默认拒绝）：session 认证 + 用户数据隔离
 * 原则二（防御式编程）：输入校验 + try-catch
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profiles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt,
      profile: user.profiles[0] ?? null,
    });
  } catch (err) {
    console.error("[PROFILE_GET]", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { nickname } = body;

    if (nickname !== undefined && (typeof nickname !== "string" || nickname.length > 50)) {
      return NextResponse.json({ error: "昵称长度不能超过 50" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nickname !== undefined) updateData.nickname = nickname;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, nickname: user.nickname });
  } catch (err) {
    console.error("[PROFILE_PATCH]", err);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
