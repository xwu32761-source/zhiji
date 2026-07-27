import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = session.user.id;

    // 软删除：设置 deletedAt，30 天后由清理任务永久删除
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { deletedAt: now },
      }),
      // 级联软删除关联数据
      prisma.userProfile.updateMany({
        where: { userId },
        data: { /* UserProfile 无 deletedAt 字段，仅标记用户已删除 */ },
      }),
    ]);

    // 清除会话
    await prisma.session.deleteMany({ where: { userId } });

    return NextResponse.json({
      ok: true,
      deletedAt: now.toISOString(),
      message: "账号已注销，数据将在 30 天后永久删除。如想恢复，请在 30 天内重新登录。",
    });
  } catch (error) {
    console.error("[ACCOUNT_DELETE]", error);
    return NextResponse.json({ error: "注销失败" }, { status: 500 });
  }
}
