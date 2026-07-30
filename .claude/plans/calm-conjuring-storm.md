# 知己合规方案

## Context

知几（Zhiji）是一款自我觉察与情绪追踪工具，涉及大量用户敏感数据（人格问卷、情绪日记、AI 心理分析）。当前 MVP 阶段无任何合规措施——无隐私政策、无用户协议、无数据删除机制、无支付系统。随着产品发展，必须建立完整的合规框架。

---

## 一、数据资产盘点

### 1.1 收集的数据

| 数据类型 | 内容 | 敏感等级 | 存储位置 |
|---------|------|---------|---------|
| 登录信息 | Email 地址 | 高 | PostgreSQL (Neon, AWS ap-southeast-1) |
| 人格问卷 | 12 支柱 × 3 题的选择答案 | **极高** | PostgreSQL + localStorage |
| 情绪日记 | 情绪标签、强度、来源、备注 | **极高** | PostgreSQL + localStorage |
| 叙事文本 | 用户自由书写的经历/感受 | **极高** | PostgreSQL + localStorage |
| AI 分析 | 叙事分析、周报、人生说明书 | 高 | PostgreSQL + localStorage |
| 匿名 ID | `crypto.randomUUID()` | 低 | localStorage |

### 1.2 第三方数据处理

| 服务商 | 用途 | 传输的数据 | 所在地 |
|-------|------|-----------|--------|
| DeepSeek (api.deepseek.com) | AI 分析 | 人格问卷 + 日记条目 + 叙事文本 | 中国 |
| Neon (neon.tech) | 数据库托管 | 全部用户数据 | AWS 新加坡 |
| Resend (resend.com) | 登录邮件 | Email 地址 | AWS 全球 |

### 1.3 当前合规缺口

- ❌ 无隐私政策 / 用户协议
- ❌ 无数据删除 / 导出入口
- ❌ 无 AI 数据处理告知
- ❌ 无年龄验证
- ❌ 无支付系统
- ❌ Debug 端点暴露 API Key 前缀
- ❌ 无日志审计
- ❌ 无数据加密声明
- ❌ **无心理健康危机资源**（无自杀预防热线、无危机干预）
- ❌ **无 AI / 心理健康免责声明**（未告知用户 AI 非持证治疗师）
- ❌ **AI Prompt 存在安全隐患**："严禁使用'可能、或许、大概'"使 AI 输出听起来像临床诊断
- ❌ **无数据跨境传输告知**（数据发往 DeepSeek，位于中国）

---

## 二、隐私合规方案

### 2.1 隐私政策页面

新建 `src/app/privacy/page.tsx`，覆盖以下内容（参考 GDPR Art. 13 + 中国《个人信息保护法》第 17 条）：

**必须包含的章节：**
1. **数据控制者** — 产品名称、联系方式
2. **收集的数据** — 按 1.1 列表逐一说明
3. **数据处理目的** — 账号登录、AI 分析、产品改进
4. **法律依据** — 用户同意（GDPR）、履行合同（提供服务）
5. **第三方共享** — DeepSeek、Neon、Resend 的名称、用途、所在地
6. **数据跨境传输** — 数据发送至 DeepSeek（中国）做 AI 分析
7. **数据保留期限** — 账号存续期间持续保留，注销后 30 天内删除
8. **用户权利** — 访问、更正、删除、限制处理、数据可携带、撤回同意
9. **Cookie 说明** — 仅 NextAuth session cookie（必要型），无追踪 cookie
10. **更新日期** — 标注最后更新日期

### 2.2 用户协议页面

新建 `src/app/terms/page.tsx`：

**必须包含的章节：**
1. **服务说明** — 知几是自我觉察工具，不提供心理咨询/医疗诊断
2. **用户责任** — 不传播有害内容、不滥用 AI 功能
3. **AI 分析免责** — AI 生成内容仅供参考，不替代专业心理咨询
4. **付费服务** — 订阅条款、退款政策（预留章节）
5. **账号终止** — 数据删除流程
6. **免责声明** — 服务按"现状"提供
7. **管辖法律** — 适用法律和争议解决

### 2.3 用户数据管理入口

在 `src/app/main/` 新增设置页或嵌入 Tab4 底部：

**功能列表：**
- **数据导出**：一键导出全部数据为 JSON（人格问卷 + 日记 + 报告）
- **账号注销**：确认后删除 PostgreSQL 中全部用户数据（User、UserProfile、DiaryEntry、LifeManual），保留 30 天缓冲期
- **清除本地数据**：清空 localStorage 中 `zhiji_*` 全部 key

### 2.4 同意采集

在登录/注册流程中追加：

1. **首次登录**时展示隐私摘要 + 同意复选框：
   - "我已阅读并同意 [隐私政策](privacy) 和 [用户协议](terms)"
   - "我了解我的数据将被发送至 DeepSeek 进行 AI 分析"
2. 同意记录存入 `UserProfile` 的 JSON 字段或新增 `Consent` 表
3. 用户可随时在设置页撤回同意

### 2.5 AI 数据处理告知

在叙事疗愈页（Tab2）和说明书页（Tab4）增加提示：

**叙事输入框上方：**
```
🔒 你的文字将被发送至 DeepSeek 进行 AI 分析，不会用于模型训练。详见隐私政策。
```

**报告生成按钮旁：**
```
💡 生成报告时将把你的问卷和日记数据发送至 AI 服务商进行处理。
```

### 2.6 年龄验证

在登录页增加：
- "你确认你已满 18 周岁，或在父母/监护人陪同下使用本服务"
- checkbox，不与外部服务校验，仅作为用户声明

### 2.7 AI 生成内容 / 心理健康免责声明

每个涉及 AI 心理分析的页面必须显示以下声明（`DisclaimerBanner` 组件）：

**Tab2 叙事分析报告上方：**
```
⚠️ AI 分析仅供参考，不构成心理咨询或医疗诊断。如果你正经历严重的情绪困扰，请联系专业心理咨询师或拨打心理援助热线：400-161-9995（全国心理援助热线）。
```

**Tab3 周报上方：**
```
⚠️ 周报由 AI 基于你的记录自动生成，不替代专业心理健康建议。
```

**Tab4 说明书上方：**
```
⚠️ 本说明书由 AI 生成，仅作为自我探索的参考，不具备临床或诊断意义。
```

**同时修复 AI Prompt 中的安全隐患**（`src/lib/ai.ts`）：
- `REPORT_SYSTEM_PROMPT` 中删除"严禁使用'可能'、'或许'、'大概'等模糊词汇"——这条规则使 AI 对人格特征做出武断声明
- 改为"每项分析应标注确信程度，对无数据支撑的判断使用'可能'等限定词"
- 避免用户将 AI 输出误解为临床诊断

### 2.8 心理健康危机资源

在 App 全局布局或关键流程中嵌入危机资源：

1. **全局 footer**：在设置页或主界面底部显示心理援助热线
2. **叙事分析结果页**：当 AI 检测到自我伤害、严重抑郁等关键词时，在分析结果上方突出显示危机资源
3. **固定入口**：底部导航栏或菜单中增加"SOS 🆘"入口，一键显示全国心理援助热线

援助热线资源：
| 热线 | 号码 |
|------|------|
| 全国心理援助热线 | 400-161-9995 |
| 北京心理危机研究与干预中心 | 010-82951332 |
| 希望 24 热线 | 400-161-9995 |
| 青少年心理援助热线 | 12355 |

---

## 三、数据安全方案

### 3.1 立即修复的安全问题

| 问题 | 修复方案 |
|------|---------|
| `/api/debug/ai` 暴露 API Key 前缀 | 删除该端点，或加环境变量 `DEBUG_ENABLED` 开关 |
| `.env` 明文密钥 | 迁移至 `.env.local`，确保不提交到 git |
| 无 Prisma 查询日志 | 开发环境启用 `log: ['query']`，生产环境启用 `error` |
| `EMAIL_FROM = onboarding@resend.dev` | 替换为已验证域名 |

### 3.2 数据库层

- **敏感字段加密**：`User.email` 使用数据库级加密（Neon 提供静态加密）
- **软删除**：所有模型已有 `deletedAt`（User 模型），补充其他模型的级联软删除
- **审计日志**：新建 `AuditLog` 表：
  ```
  AuditLog { id, userId, action, resourceType, resourceId, detail (JSON), ipAddress, createdAt }
  ```
  关键操作需记录：登录、数据导出、账号注销、报告生成、支付

### 3.3 API 层

- **速率限制**：AI 端点（`/api/ai/*`）加频率限制，同一用户每分钟最多 N 次
- **请求体大小限制**：限制 POST 请求体最大 1MB
- **Session 刷新**：NextAuth JWT 30 天过期，添加刷新机制
- **CORS**：目前在 middleware 中无显式 CORS 配置，生产环境应限制来源

### 3.4 客户端安全

- **localStorage 敏感数据**：考虑对 `zhiji_diary_entries`、`zhiji_pillar_answers_v2` 等数据使用 Web Crypto API 进行客户端加密
- **页面离开提醒**：当用户有未保存的叙事文本时，提示"内容仅保存在本地"

---

## 四、支付设计方案（规划）

### 4.1 商业模式：免费增值

| 项目 | 免费层 | 付费层（"深度校准会员"） |
|------|--------|------------------------|
| 报告刷新次数 | 每月 3 次 | 无限次 |
| 人格初稿 | ✓ | ✓ |
| 完整说明书 | ✓ | ✓ |
| PDF 导出 | ✗ | ✓ |
| 历史报告存档 | 最近 3 份 | 全部 |
| 价格 | 免费 | 9.9 元/月 或 79 元/年 |

### 4.2 支付技术选型

**推荐方案：Lemon Squeezy（LemonSqueezy）**

理由：
1. 支持中国用户支付宝付款（LemonSqueezy 通过 Paddle 处理）
2. 提供托管结账页面（无需处理 PCI-DSS）
3. 支持订阅管理（自动续费、升降级）
4. Webhook 通知
5. 提供 30 天退款保证
6. 支持税费自动计算（VAT、Sales Tax）

备选：**Stripe** + **支付宝/微信支付**（通过 Stripe PaymentIntents）

### 4.3 数据库模型

```prisma
model Price {
  id        String   @id @default(cuid())
  name      String   // "月度会员", "年度会员", "终身会员"
  price     Int      // 单位: 分 (990 = 9.9元)
  interval  String?  // "month", "year", null (终身)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String
  variantId       String   // LemonSqueezy variant ID
  status          String   // "active", "paused", "cancelled", "expired"
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelledAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])

  @@unique([userId, variantId])
}

model Quota {
  id              String   @id @default(cuid())
  userId          String   @unique
  refreshUsed     Int      @default(0)   // 本月已用刷新次数
  refreshLimit    Int      @default(3)   // 每月限额 (免费3次)
  resetMonth      String   // "2026-07" 格式
  lastRefreshedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  provider        String   // "lemonsqueezy"
  providerId      String   // LemonSqueezy order ID
  amount          Int      // 单位: 分
  currency        String   @default("cny")
  status          String   // "paid", "refunded", "failed"
  productName     String
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
}
```

### 4.4 API 路由

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/v1/payments/create-checkout` | POST | 创建 LemonSqueezy 结账会话 |
| `/api/v1/payments/webhook` | POST | 接收 LemonSqueezy 事件通知 |
| `/api/v1/payments/portal` | GET | 跳转订阅管理门户 |
| `/api/v1/quota` | GET | 查询当前用户配额 |
| `/api/v1/subscription` | GET | 查询当前订阅状态 |

### 4.5 配额与付费墙

**配额检查逻辑**（状态机）：

```
用户点击"校准" → quota.check(refreshUsed, refreshLimit, resetMonth)
  ├─ refreshUsed < refreshLimit → 刷新 → refreshUsed++
  ├─ refreshUsed >= refreshLimit → 检查 subscription
  │   ├─ 有活跃订阅 → 刷新 (不计入免费配额)
  │   └─ 无订阅 → 展示付费墙
```

**付费墙 UI**（半屏 Modal）：

```
┌────────────────────────┐
│                        │
│   🔒 本月洞察次数已用尽   │
│                        │
│   已使用 3/3 次免费刷新   │
│                        │
│   ┌──────────────────┐  │
│   │ ✨ 开通无限校准    │  │  ← 主 CTA
│   │   ￥9.9/月        │  │
│   │   或 ￥79/年 (省40)│  │
│   └──────────────────┘  │
│                        │
│   不升级，继续使用基础功能  │  ← 次要链接
└────────────────────────┘
```

### 4.6 支付安全注意事项

- **绝对不存储信用卡号** — 使用 LemonSqueezy 托管结账
- **Webhook 签名验证** — 验证 `X-Signature` header
- **幂等处理** — Webhook 事件去重（LemonSqueezy `idempotency_key`）
- **退款处理** — Webhook 监听 `order_refunded` 事件，降级订阅
- **税费合规** — LemonSqueezy 自动计算 VAT/GST/Sales Tax

---

## 五、法规适用范围

### 5.1 适用法规判断

| 法规 | 适用条件 | 是否需要遵守 |
|------|---------|------------|
| 中国《个人信息保护法》(PIPL) | 处理中国用户个人信息 | ✅ 是（目标用户为中国用户） |
| 中国《数据安全法》 | 在中国境内运营 | ✅ 是 |
| GDPR | 向欧盟用户提供服务 | ⏸ 当前不适用，预留 |
| CCPA | 向加州用户提供服务 | ⏸ 当前不适用，预留 |
| COPPA | 面向 13 岁以下儿童 | ❌ 应禁止 18 岁以下使用 |

### 5.2 中国《个人信息保护法》重点合规项

| 要求 | 实施方案 |
|------|---------|
| 第 17 条：告知同意 | 隐私政策 + 首次登录同意弹窗 |
| 第 23 条：委托处理 | 披露 DeepSeek 等第三方处理者 |
| 第 38 条：跨境传输 | 告知用户数据发送至 DeepSeek（中国） |
| 第 44 条：查阅复制权 | 数据导出功能（JSON） |
| 第 47 条：删除权 | 账号注销 + 数据删除 |
| 第 55 条：影响评估 | AI 心理分析属高风险处理活动，需做 PIPL 影响评估 |

---

## 六、实施路线图

### Phase 1（1-2 天）— 立即修复
- [x] 删除 `/api/debug/ai` 端点或加环境变量守卫
- [ ] 将 `.env` 密钥迁移至 `.env.local`，更新 `.gitignore`
- [x] 替换 `EMAIL_FROM = onboarding@resend.dev` 为已验证域名
- [x] 隐私政策 + 用户协议页面（静态页面，纯文案）

### Phase 2（3-5 天）— 用户控制
- [x] 首次登录同意采集流程
- [ ] AI 数据处理告知（Tab2 + Tab4 提示条）
- [ ] 数据导出功能（JSON）
- [ ] 账号注销功能（软删除 + 30 天缓冲）
- [ ] 年龄确认 checkbox
- [ ] DisclaimerBanner 组件 + 三页嵌入（Tab2/Tab3/Tab4）
- [ ] 修复 AI Prompt 中"严禁使用'可能、或许、大概'"的安全隐患
- [ ] 心理健康危机热线入口（SOS 按钮 + 全局 footer）

### Phase 3（5-7 天）— 数据安全
- [ ] Quota 表 + API
- [ ] 速率限制（AI 端点）
- [ ] AuditLog 表 + 关键路径日志
- [ ] 客户端 localStorage 清理机制

### Phase 4（7-10 天）— 支付系统
- [ ] LemonSqueezy 账号注册 + SDK 集成
- [ ] `Payment`、`Subscription`、`Price` 表 + Prisma migration
- [ ] 创建结账 API + webhook 处理
- [ ] 配额检查逻辑 + 付费墙 UI
- [ ] 订阅状态管理 + 用户端显示

---

## 七、涉及文件清单

| 文件 | 用途 |
|------|------|
| `src/app/privacy/page.tsx` | 隐私政策页面 |
| `src/app/terms/page.tsx` | 用户协议页面 |
| `src/app/auth/login/page.tsx` | 追加同意 checkbox + 年龄确认 |
| `src/app/main/Tab2.tsx` | 叙事输入区 AI 处理告知 + 免责声明 + 危机热线 |
| `src/app/main/Tab3.tsx` | 周报区免责声明 |
| `src/app/main/Tab4.tsx` | 报告生成区 AI 处理告知 + 免责声明；替换硬编码"剩余 3 次"为配额 |
| `prisma/schema.prisma` | 新增 Consent、Quota、Subscription、Payment、AuditLog 模型 |
| `src/lib/ai.ts` | 修复 REPORT_SYSTEM_PROMPT 中"严禁使用'可能、或许、大概'"的安全隐患 |
| `src/lib/storage.ts` | KEYS 常量统一（修正 PILLAR_ANSWERS 键名） |
| `src/lib/types.ts` | 新增 ConsentRecord、QuotaData、SubscriptionData 类型 |
| `src/lib/api-client.ts` | 新增 payments、quota API 方法 |
| `src/app/api/debug/ai/route.ts` | 删除或加守卫 |
| `src/app/api/v1/data/export/route.ts` | 数据导出 API |
| `src/app/api/v1/data/delete/route.ts` | 账号注销 API |
| `src/app/api/v1/quota/route.ts` | 配额查询 API |
| `src/app/api/v1/payments/checkout/route.ts` | 创建结账会话 |
| `src/app/api/v1/payments/webhook/route.ts` | LemonSqueezy webhook |
| `src/app/api/v1/payments/portal/route.ts` | 订阅管理门户 |
| `src/components/shared/PaywallModal.tsx` | 付费墙 UI 组件 |
| `src/components/shared/ConsentBanner.tsx` | 同意采集弹窗 |
| `src/components/shared/DisclaimerBanner.tsx` | AI / 心理健康免责声明横幅 |

## 八、验证方法

1. **隐私页面**：访问 `/privacy` 和 `/terms`，内容完整可读
2. **同意采集**：新用户首次登录看到同意弹窗，勾选后才可进入主界面
3. **AI 告知**：Tab2 叙事输入区上方出现 🔒 提示条
4. **数据导出**：设置页点击"导出"→ 下载包含全部数据的 JSON 文件
5. **账号注销**：确认后账号从 DB 软删除，30 天后自动清除
6. **配额检查**：免费用户刷新 3 次后第 4 次弹出付费墙
7. **支付流程**：点击"开通无限校准"→ 跳转 LemonSqueezy → 支付成功 → 配额刷新
8. **Webhook**：LemonSqueezy 发送 `order_created` → Quota.refreshLimit 更新为无限
9. **速率限制**：连续 30 次 AI 请求 → 429 响应
10. TypeScript 编译通过，E2E 流程完整
