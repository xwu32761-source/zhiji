import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 — 知几",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] text-white/90 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-wide mb-8">隐私政策</h1>
        <p className="text-sm text-white/60 mb-8">最后更新：2026 年 7 月</p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">1. 数据控制者</h2>
            <p>
              知几（以下简称"我们"）是您个人数据的控制者。如您对本隐私政策有任何疑问，
              可通过以下方式联系我们：<span className="text-white/60">（联系邮箱待设置）</span>
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">2. 我们收集的数据</h2>
            <p>在您使用知几服务时，我们收集以下类型的数据：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>账号信息</strong>：您的电子邮件地址（用于登录验证）</li>
              <li><strong>人格问卷答案</strong>：您在人生支柱模块中提交的所有问卷选择</li>
              <li><strong>情绪日记</strong>：您记录的情绪标签、强度、来源和备注</li>
              <li><strong>叙事文本</strong>：您在叙事疗愈模块中自由书写的内容</li>
              <li><strong>AI 分析报告</strong>：基于您的数据生成的叙事分析、周报和人生说明书</li>
            </ul>
            <p className="mt-2">
              我们不收集您的位置信息、通讯录、设备标识符或浏览历史。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">3. 数据处理目的与法律依据</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>提供账号登录</strong>（法律依据：履行合同）</li>
              <li><strong>生成 AI 心理分析</strong>（法律依据：您的明确同意）</li>
              <li><strong>改进服务质量</strong>（法律依据：合法权益）</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">4. 第三方数据处理</h2>
            <p>我们将您的数据委托给以下服务商处理：</p>
            <div className="mt-3 space-y-3">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-medium text-white">DeepSeek（深度求索）</p>
                <p className="text-white/70 mt-1">用途：AI 分析（叙事分析、周报、人生说明书生成）</p>
                <p className="text-white/70">传输的数据：问卷答案、日记内容、叙事文本</p>
                <p className="text-white/70">所在地：中国</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-medium text-white">Neon（PostgreSQL 托管）</p>
                <p className="text-white/70 mt-1">用途：数据库存储</p>
                <p className="text-white/70">传输的数据：全部用户数据</p>
                <p className="text-white/70">所在地：AWS 新加坡</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-medium text-white">Resend</p>
                <p className="text-white/70 mt-1">用途：发送登录验证邮件</p>
                <p className="text-white/70">传输的数据：电子邮件地址</p>
              </div>
            </div>
            <p className="mt-3">
              您的数据可能被传输至中国境内的 DeepSeek 服务器进行 AI 分析。
              通过使用本服务，您同意此跨境数据传输。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">5. 数据保留</h2>
            <p>
              在您的账号存续期间，我们持续保留您的数据。如果您注销账号，
              您的全部个人数据将在 30 天内被删除。本地浏览器缓存的数据需要您手动清除。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">6. 您的权利</h2>
            <p>根据适用的数据保护法律，您享有以下权利：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>访问权</strong>：获取我们持有的您的数据副本</li>
              <li><strong>更正权</strong>：更正不准确的数据</li>
              <li><strong>删除权</strong>：注销账号并删除您的数据</li>
              <li><strong>数据可携带权</strong>：以 JSON 格式导出您的数据</li>
              <li><strong>撤回同意</strong>：撤回对 AI 数据处理的同意</li>
            </ul>
            <p className="mt-2">
              您可以在应用设置页中执行数据导出和账号注销操作。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">7. Cookie</h2>
            <p>
              我们仅使用必要的会话 Cookie（由 NextAuth 设置）来维持登录状态。
              我们不使用任何追踪、广告或分析 Cookie。您可以通过浏览器设置禁用 Cookie，
              但这将导致登录功能不可用。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">8. 数据安全</h2>
            <p>
              我们采用行业标准的安全措施保护您的数据，包括：
              TLS/SSL 传输加密、数据库静态加密、访问控制机制。
              但请注意，没有任何互联网传输或存储方法是完全安全的。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">9. 政策更新</h2>
            <p>
              我们可能会不时更新本隐私政策。变更后继续使用本服务即表示您同意更新后的政策。
              重大变更将通过应用内通知告知您。
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/terms" className="text-sm text-primary hover:text-primary/80 transition-colors">
            查看用户协议 →
          </a>
        </div>
      </div>
    </main>
  );
}
