import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, profiles, diaryEntries, lifeManuals] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userProfile.findMany({ where: { userId } }),
      prisma.diaryEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.lifeManual.findMany({ where: { userId }, orderBy: { generatedAt: "desc" } }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        user: {
          id: user?.id,
          nickname: user?.nickname,
          createdAt: user?.createdAt,
        },
        profiles,
        diaryEntries,
        lifeManuals,
      },
    };

    // 异步记录审计日志
    logAudit({
      userId,
      action: "export",
      resourceType: "data",
      detail: { entryCount: diaryEntries.length, hasLifeManual: lifeManuals.length > 0 },
    }).catch(() => {});

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[DATA_EXPORT]", error);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
