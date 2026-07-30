/**
 * 用户注册 API
 *
 * 原则一（数据与状态必须抽象）：校验逻辑集中在此，不散落在页面
 * 原则二（防御式编程）：输入校验 + try-catch + 事务写入
 * 原则三（权限默认拒绝）：注册无需登录，但创建后直接审计
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

interface RegisterBody {
  username?: string;
  password?: string;
  agreedToTerms?: boolean;
  agreedToAI?: boolean;
  ageConfirmed?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const { username, password, agreedToTerms, agreedToAI, ageConfirmed } = body;

    // === 输入校验 ===
    const errors: string[] = [];

    if (!username || typeof username !== "string") {
      errors.push("请输入用户名");
    } else if (username.length < 3 || username.length > 20) {
      errors.push("用户名长度须在 3-20 个字符之间");
    } else if (!USERNAME_REGEX.test(username)) {
      errors.push("用户名只能包含字母、数字和下划线");
    }

    if (!password || typeof password !== "string") {
      errors.push("请输入密码");
    } else if (password.length < 8) {
      errors.push("密码长度至少 8 位");
    }

    if (!agreedToTerms) errors.push("请同意隐私政策和用户协议");
    if (!agreedToAI) errors.push("请同意 AI 数据发送");
    if (!ageConfirmed) errors.push("请确认年龄");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    // === 查重 ===
    const existing = await prisma.user.findUnique({
      where: { username: username!.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "该用户名已被注册" }, { status: 409 });
    }

    // === 事务：创建用户 + 同意记录 ===
    const hashedPassword = await bcrypt.hash(password!, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: username!.trim(),
          passwordHash: hashedPassword,
          nickname: username!.trim(), // 用户名即显示名
        },
      });

      await tx.consent.create({
        data: {
          userId: newUser.id,
          agreedToTerms: true,
          agreedToAI: true,
          ageConfirmed: true,
        },
      });

      return newUser;
    });

    // === 审计日志（不阻塞主流程） ===
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    logAudit({
      userId: user.id,
      action: "register",
      resourceType: "account",
      ipAddress: ip,
    }).catch(() => {});

    return NextResponse.json(
      { ok: true, userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
