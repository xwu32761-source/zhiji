/**
 * 数据迁移 API
 *
 * 将源账号的全部数据迁移到当前账号。
 * UUID（user.id）作为所有权凭证——知道 UUID 即证明拥有该账号。
 *
 * 原则一（数据与状态必须抽象）：迁移逻辑统一在此路由，不散落在各处
 * 原则二（防御式编程）：事务内全部操作原子执行，任一失败整体回滚
 * 原则三（数据隔离）：session 校验 + 用户数据隔离
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const targetUserId = session.user.id;
    const { sourceUuid } = await req.json();

    if (!sourceUuid || typeof sourceUuid !== "string") {
      return NextResponse.json({ error: "请提供源账号 UUID" }, { status: 400 });
    }

    if (sourceUuid === targetUserId) {
      return NextResponse.json({ error: "不能将自己的数据迁移到自身" }, { status: 400 });
    }

    // 在事务内执行全部操作，防止并发竞争
    const result = await prisma.$transaction(async (tx) => {
      // 1. 检查源账号存在且未被软删除（事务内查询，与后续操作原子一致）
      const sourceUser = await tx.user.findUnique({ where: { id: sourceUuid } });
      if (!sourceUser) {
        throw new Error("SOURCE_NOT_FOUND");
      }
      if (sourceUser.deletedAt) {
        throw new Error("SOURCE_DELETED");
      }

      // 2. 删除目标账号已有的 1:1 记录（UserProfile / Consent / Quota），防止冲突
      await tx.userProfile.deleteMany({ where: { userId: targetUserId } });
      await tx.consent.deleteMany({ where: { userId: targetUserId } });
      await tx.quota.deleteMany({ where: { userId: targetUserId } });

      // 3. 将源账号的全部数据重新关联到目标账号
      const profileCount = (await tx.userProfile.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      const diaryCount = (await tx.diaryEntry.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      const manualCount = (await tx.lifeManual.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      const consentCount = (await tx.consent.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      const quotaCount = (await tx.quota.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      const auditCount = (await tx.auditLog.updateMany({
        where: { userId: sourceUuid },
        data: { userId: targetUserId },
      })).count;

      // 4. 软删除源账号
      await tx.user.update({
        where: { id: sourceUuid },
        data: { deletedAt: new Date() },
      });

      // 5. 使源账号所有会话失效
      await tx.session.deleteMany({ where: { userId: sourceUuid } });

      return {
        profile: profileCount,
        diary: diaryCount,
        manual: manualCount,
        consent: consentCount,
        quota: quotaCount,
        audit: auditCount,
      };
    });

    // 审计日志（在事务外，失败不打断主流程）
    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    await logAudit({
      userId: targetUserId,
      action: "migrate",
      resourceType: "data",
      detail: { sourceUuid, migrated: result },
      ipAddress,
      userAgent,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: "数据迁移成功",
      detail: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";

    if (msg === "SOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "源账号不存在" }, { status: 404 });
    }
    if (msg === "SOURCE_DELETED") {
      return NextResponse.json({ error: "源账号已注销，无法迁移" }, { status: 400 });
    }

    console.error("[MIGRATE]", err);
    return NextResponse.json({ error: "迁移失败，请稍后重试" }, { status: 500 });
  }
}
