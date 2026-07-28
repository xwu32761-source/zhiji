/**
 * 配额消费 API（消耗一次报告刷新次数）
 *
 * 原则三（权限默认拒绝）：必须通过 session 认证
 * 原则二（防御式编程）：try-catch 兜底，配额用尽返回 403
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { useQuota } from "@/lib/quota";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const result = await useQuota(session.user.id);

    if (!result.ok) {
      return NextResponse.json(
        { error: "quota_exceeded", quota: result.quota },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, quota: result.quota });
  } catch (err) {
    console.error("[QUOTA_USE]", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
