import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const agreedToTerms = Boolean(body.agreedToTerms);
    const agreedToAI = Boolean(body.agreedToAI);
    const ageConfirmed = Boolean(body.ageConfirmed);

    if (!agreedToTerms || !agreedToAI || !ageConfirmed) {
      return NextResponse.json({ error: "需要同意所有条款" }, { status: 400 });
    }

    // upsert — 同一用户只保留一条同意记录
    await prisma.consent.upsert({
      where: { userId: session.user.id },
      update: {
        agreedToTerms,
        agreedToAI,
        ageConfirmed,
        revokedAt: null,
      },
      create: {
        userId: session.user.id,
        agreedToTerms,
        agreedToAI,
        ageConfirmed,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CONSENT_POST]", error);
    return NextResponse.json({ error: "内部错误" }, { status: 500 });
  }
}
