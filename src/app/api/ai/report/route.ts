import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateReport } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { userProfile, recentEntries } = await req.json();

    const userData = `
## 用户数据
### Tab1 人格画像
${JSON.stringify(userProfile || {}, null, 2)}

### Tab2 最近记录
${JSON.stringify(recentEntries || [], null, 2)}
    `;

    const report = await generateReport(userData);

    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("Report API error:", err);
    return NextResponse.json(
      { error: "报告生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
