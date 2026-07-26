import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "用户协议 — 知几",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] text-white/90 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-wide mb-8">用户协议</h1>
        <p className="text-sm text-white/60 mb-8">最后更新：2026 年 7 月</p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">1. 服务说明</h2>
            <p>
              知几是一款自我觉察与情绪追踪工具，帮助用户记录情绪、探索自我、
              生成个人洞察报告。<strong className="text-white">知几不提供心理咨询、
              心理治疗或医疗诊断服务</strong>。所有 AI 生成的内容仅供参考，
              不应被视为专业心理健康建议。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">2. 用户资格</h2>
            <p>
              您确认您已年满 18 周岁，或在父母/监护人的陪同下使用本服务。
              未满 18 周岁的用户应在监护人知晓并同意的情况下使用。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">3. 用户责任</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>您对您记录的内容负责，不得记录违法、有害或侵犯他人权益的信息</li>
              <li>您不得滥用 AI 功能（如输入大量无关文本、试图提示注入等）</li>
              <li>您应妥善保管登录邮箱和账号，对账号下的所有操作负责</li>
              <li>如果您正经历严重的情绪困扰或心理健康危机，请立即联系专业机构或拨打心理援助热线（全国心理援助热线：400-161-9995），而非依赖本工具</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">4. AI 分析与免责声明</h2>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="font-medium text-white mb-2">⚠️ 重要声明</p>
              <ul className="space-y-2">
                <li>
                  AI 生成的分析、报告和洞察基于您提供的数据，<strong className="text-white">不构成心理咨询、
                  心理治疗或医疗诊断</strong>
                </li>
                <li>
                  AI 的分析可能不准确、不完整或存在偏差，不应作为决策的唯一依据
                </li>
                <li>
                  知几的 AI 模型由 DeepSeek 提供，您的数据将被发送至 DeepSeek 服务器进行处理
                </li>
                <li>
                  如果您需要专业心理健康服务，请咨询持证心理咨询师或医生
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">5. 付费服务</h2>
            <p>
              知几目前提供免费服务。未来可能推出付费会员服务（如深度校准会员），
              届时将另行公布服务条款和价格。付费服务一经购买，根据相关法律法规，
              数字化产品原则上不支持无理由退款。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">6. 知识产权</h2>
            <p>
              知几应用程序、品牌名称、Logo 及相关知识产权的所有权归我们所有。
              您记录的内容（日记、问卷答案等）归您所有。AI 生成的内容
              （分析报告、洞察等）归我们所有，但您可以在本服务范围内自由使用。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">7. 免责声明</h2>
            <p>
              本服务按"现状"提供，不提供任何明示或暗示的保证。
              我们不保证服务不会中断、及时、安全或无错误。
              在法律允许的最大范围内，我们不对因使用或无法使用本服务而产生的任何损害承担责任。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">8. 账号终止</h2>
            <p>
              您可以随时在应用设置页注销账号，注销后您的全部数据将在 30 天内被删除。
              如果您违反本协议，我们保留终止您访问服务的权利。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">9. 管辖法律</h2>
            <p>
              本协议适用中华人民共和国法律。因本协议引起的争议，
              双方应友好协商解决；协商不成的，提交有管辖权的人民法院诉讼解决。
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">10. 联系我们</h2>
            <p>
              如您对本协议有任何疑问，或有数据相关的请求（删除、导出等），
              请联系我们：<span className="text-white/60">（联系邮箱待设置）</span>
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/privacy" className="text-sm text-primary hover:text-primary/80 transition-colors">
            查看隐私政策 →
          </a>
        </div>
      </div>
    </main>
  );
}
