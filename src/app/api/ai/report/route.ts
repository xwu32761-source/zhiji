import { NextRequest, NextResponse } from "next/server";
import { generateReport, generateQuickProfile } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession(req);

    // 速率限制：报告生成 3 次/分钟（已有 Quota，限流防止突发）
    const rl = rateLimit(`ai:report:${userId}`, 3, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rl.retryAfter} 秒后重试` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { userProfile, recentEntries, quick } = await req.json();

    // 人格初稿：仅基于支柱数据，不依赖记录
    if (quick) {
      const pillarJson = JSON.stringify(userProfile || {}, null, 2);
      const report = await generateQuickProfile(pillarJson);
      logAudit({
        userId,
        action: "generate_report",
        resourceType: "report",
        detail: { quick: true },
      }).catch(() => {});
      return NextResponse.json({ report });
    }

    const userData = `
## 用户数据
### Tab1 人格画像
${JSON.stringify(userProfile || {}, null, 2)}

### Tab2 最近记录
${JSON.stringify(recentEntries || [], null, 2)}
    `;

    const report = await generateReport(userData);

    logAudit({
      userId,
      action: "generate_report",
      resourceType: "report",
      detail: { quick: false },
    }).catch(() => {});

    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("Report API error:", err);
    return NextResponse.json(
      { error: "报告生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
