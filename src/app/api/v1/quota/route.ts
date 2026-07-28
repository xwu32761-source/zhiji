/**
 * 配额查询 API
 *
 * 原则三（权限默认拒绝）：必须通过 session 认证
 * 原则二（防御式编程）：try-catch 兜底
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQuota } from "@/lib/quota";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const quota = await getQuota(session.user.id);
    return NextResponse.json(quota);
  } catch (err) {
    console.error("[QUOTA_GET]", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
