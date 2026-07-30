/**
 * 会话工具 — 统一处理 API 路由的认证校验
 *
 * 原则三（权限默认拒绝）：所有 API 路由必须通过此函数校验 session
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
  userId: string;
}

/**
 * 获取当前请求的认证用户。
 * 必须通过 next-auth session 认证，无 session 时抛出 UNAUTHORIZED。
 */
export async function requireSession(_req: NextRequest): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId: session.user.id };
}
