/**
 * 审计日志工具
 *
 * 原则二（防御式编程）：日志写入失败不打断主流程
 * 原则三（可追溯）：关键操作（登录、导出、注销、报告生成）必须记录
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface AuditInput {
  userId: string;
  action: "login" | "export" | "delete_account" | "generate_report" | "payment" | "migrate";
  resourceType: string;
  resourceId?: string;
  detail?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * 写入审计日志
 * 内部 try-catch，失败只 console.error，不抛异常
 */
export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        detail: (input.detail ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}
